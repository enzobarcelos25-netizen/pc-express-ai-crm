const DEFAULT_OWNER_WHATSAPP = '5534984033975';

function setCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || 'https://pc-express-ai-crm.vercel.app';
  const origin = req.headers.origin || allowed;
  res.setHeader('Access-Control-Allow-Origin', origin === allowed ? origin : allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('550')) digits = `55${digits.slice(3)}`;
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!digits.startsWith('55') || digits.length < 12 || digits.length > 13) return '';
  return digits;
}

function scoreLead(lead) {
  const text = `${lead.problema || ''} ${lead.recomendacao || ''}`.toLowerCase();
  let score = 60;
  if (text.includes('virus') || text.includes('adware')) score += 18;
  if (text.includes('ssd') || text.includes('upgrade')) score += 16;
  if (text.includes('formatacao') || text.includes('otimizacao')) score += 14;
  if (lead.telefone_normalizado) score += 10;
  if (lead.consent) score += 8;
  return Math.min(score, 99);
}

function buildOwnerWaUrl(lead) {
  const owner = normalizePhone(process.env.PC_EXPRESS_OWNER_WHATSAPP || DEFAULT_OWNER_WHATSAPP);
  const message = [
    'Novo lead pelo site PC Express:',
    `Nome: ${lead.nome}`,
    `Telefone: ${lead.telefone || 'nao informado'}`,
    `Problema: ${lead.problema || 'nao informado'}`,
    `Recomendacao: ${lead.recomendacao || 'nao informada'}`,
  ].join('\n');
  return `https://wa.me/${owner}?text=${encodeURIComponent(message)}`;
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function saveToSupabase(lead) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { skipped: true, reason: 'supabase_not_configured' };

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/leads?on_conflict=site_lead_id`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([lead]),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`);
  return { ok: true, data: text ? JSON.parse(text) : null };
}

async function sendToN8n(lead) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return { skipped: true, reason: 'n8n_not_configured' };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(lead),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`n8n ${response.status}: ${text}`);
  return { ok: true };
}

async function sendToGoogleAppsScript(lead) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return { skipped: true, reason: 'google_apps_script_not_configured' };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(lead),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Google Apps Script ${response.status}: ${text}`);
  return { ok: true };
}

async function sendWhatsAppTemplate(lead) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'diagnostico_pc_express';
  const language = process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR';

  if (!lead.consent) return { skipped: true, reason: 'no_consent' };
  if (!token || !phoneNumberId) return { skipped: true, reason: 'whatsapp_not_configured' };
  if (!lead.telefone_normalizado) return { skipped: true, reason: 'invalid_phone' };

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: lead.telefone_normalizado,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: lead.nome || 'cliente' },
              { type: 'text', text: lead.recomendacao || lead.problema || 'diagnostico de PC' },
            ],
          },
        ],
      },
    }),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`WhatsApp ${response.status}: ${text}`);
  return { ok: true, data: text ? JSON.parse(text) : null };
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const body = await readJson(req);
    const telefoneNormalizado = normalizePhone(body.telefone || body.phone || body.whatsapp);
    const lead = {
      site_lead_id: body.id || body.siteLeadId || null,
      nome: String(body.nome || body.name || 'Cliente sem nome').trim().slice(0, 120),
      telefone: String(body.telefone || body.phone || body.whatsapp || '').trim().slice(0, 40),
      telefone_normalizado: telefoneNormalizado || null,
      problema: String(body.problema || body.problem || '').trim().slice(0, 240),
      recomendacao: String(body.recomendacao || body.recommendation || '').trim().slice(0, 240),
      explicacao: String(body.explicacao || body.explanation || '').trim().slice(0, 500),
      status: 'novo',
      consent: Boolean(body.consent),
      source: String(body.source || 'site_diagnostico').slice(0, 80),
      page_url: String(body.pageUrl || '').slice(0, 500),
      user_agent: String(body.userAgent || req.headers['user-agent'] || '').slice(0, 500),
      answers: body.answers || null,
      raw: body,
    };
    lead.score = scoreLead(lead);

    const results = {};
    const errors = [];

    for (const [name, action] of [
      ['supabase', () => saveToSupabase(lead)],
      ['n8n', () => sendToN8n(lead)],
      ['googleSheets', () => sendToGoogleAppsScript(lead)],
      ['whatsapp', () => sendWhatsAppTemplate(lead)],
    ]) {
      try {
        results[name] = await action();
      } catch (error) {
        errors.push({ service: name, message: error.message });
        results[name] = { ok: false, error: error.message };
      }
    }

    return res.status(errors.length ? 207 : 200).json({
      ok: true,
      lead: {
        nome: lead.nome,
        telefone_normalizado: lead.telefone_normalizado,
        score: lead.score,
        consent: lead.consent,
      },
      ownerWaUrl: buildOwnerWaUrl(lead),
      results,
      errors,
    });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
}

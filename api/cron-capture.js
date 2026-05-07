const CENTER = { lat: -18.9186, lon: -48.2772 };
const RADIUS = 30000;

const FILTERS = {
  office: ['accountant', 'lawyer', 'estate_agent', 'company', 'administrative', 'insurance', 'financial', 'consulting', 'architect'],
  amenity: ['clinic', 'doctors', 'dentist', 'school', 'college', 'language_school'],
  healthcare: ['clinic', 'doctor', 'dentist', 'physiotherapist', 'laboratory'],
  shop: ['copyshop', 'stationery', 'office_supplies', 'electronics', 'computer', 'mobile_phone'],
};

function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('550')) digits = `55${digits.slice(3)}`;
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!digits.startsWith('55') || digits.length < 12 || digits.length > 13) return '';
  return digits;
}

function tag(tags, keys) {
  for (const key of keys) if (tags?.[key]) return String(tags[key]);
  return '';
}

function segment(tags) {
  const value = tag(tags, ['office', 'healthcare', 'amenity', 'shop']);
  if (['accountant', 'lawyer', 'estate_agent', 'insurance', 'financial', 'consulting', 'administrative', 'company', 'architect'].includes(value)) return 'escritorio';
  if (['clinic', 'doctor', 'doctors', 'dentist', 'physiotherapist', 'laboratory'].includes(value)) return 'clinica';
  if (['school', 'college', 'language_school'].includes(value)) return 'educacao';
  if (['copyshop', 'stationery', 'office_supplies'].includes(value)) return 'impressao';
  return 'negocio_local';
}

function recommendation(seg) {
  if (seg === 'escritorio') return 'Diagnostico gratis para computador de escritorio lento ou travando';
  if (seg === 'clinica') return 'Diagnostico para computador de recepcao, agenda ou atendimento travando';
  if (seg === 'educacao') return 'Revisao de computadores de secretaria ou uso diario';
  if (seg === 'impressao') return 'Suporte para computador de impressao e atendimento';
  return 'Diagnostico gratis para PC lento em Uberlandia';
}

function scoreLead(tags, seg) {
  let score = { escritorio: 94, clinica: 92, educacao: 86, impressao: 84, negocio_local: 70 }[seg] || 70;
  if (tag(tags, ['contact:phone', 'phone', 'mobile', 'contact:mobile'])) score += 4;
  if (tag(tags, ['website', 'contact:website', 'contact:instagram'])) score += 2;
  return Math.min(score, 99);
}

function buildQuery() {
  const parts = [];
  for (const [key, values] of Object.entries(FILTERS)) {
    for (const value of values) parts.push(`nwr(around:${RADIUS},${CENTER.lat},${CENTER.lon})[${key}=${value}];`);
  }
  return `[out:json][timeout:90];(${parts.join('')});out center tags 800;`;
}

async function fetchPublicLeads(limit) {
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: new URLSearchParams({ data: buildQuery() }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Overpass ${response.status}: ${text.slice(0, 300)}`);

  const data = JSON.parse(text);
  const seen = new Set();
  const leads = [];

  for (const element of data.elements || []) {
    const tags = element.tags || {};
    const nome = tag(tags, ['name', 'brand']);
    if (!nome) continue;

    const seg = segment(tags);
    const telefone = tag(tags, ['contact:phone', 'phone', 'mobile', 'contact:mobile']);
    const id = `osm:${element.type}:${element.id}`;
    const key = `${nome.toLowerCase()}|${tag(tags, ['addr:street']).toLowerCase()}|${seg}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    leads.push({
      site_lead_id: id,
      nome,
      telefone,
      telefone_normalizado: normalizePhone(telefone) || null,
      problema: `Lead publico de ${seg} em Uberlandia`,
      recomendacao: recommendation(seg),
      explicacao: 'Capturado automaticamente de fonte publica para pesquisa comercial.',
      status: 'prospect_publico',
      score: scoreLead(tags, seg),
      consent: false,
      source: 'auto_osm_uberlandia',
      page_url: lat && lon ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}` : '',
      user_agent: 'pc-express-cron-capture',
      answers: { segmento: seg, osmType: element.type, osmId: element.id },
      raw: { tags, elementType: element.type, elementId: element.id },
    });
  }

  return leads.sort((a, b) => b.score - a.score).slice(0, limit);
}

async function saveToSupabase(leads) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { skipped: true, reason: 'supabase_not_configured' };
  if (leads.length === 0) return { ok: true, count: 0 };

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/leads?on_conflict=site_lead_id`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(leads),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`);
  return { ok: true, count: leads.length };
}

async function sendToN8n(leads) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return { skipped: true, reason: 'n8n_not_configured' };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'auto_public_lead_capture', leads }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`n8n ${response.status}: ${text}`);
  return { ok: true, count: leads.length };
}

async function sendToGoogleAppsScript(leads) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return { skipped: true, reason: 'google_apps_script_not_configured' };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leads }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Google Apps Script ${response.status}: ${text}`);
  return { ok: true, count: leads.length };
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}` && req.query.secret !== secret) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const limit = Math.min(Number(req.query.limit || process.env.AUTO_LEAD_LIMIT || 25), 100);

  try {
    const leads = await fetchPublicLeads(limit);
    const results = {};
    const errors = [];

    for (const [name, action] of [
      ['supabase', () => saveToSupabase(leads)],
      ['n8n', () => sendToN8n(leads)],
      ['googleSheets', () => sendToGoogleAppsScript(leads)],
    ]) {
      try {
        results[name] = await action();
      } catch (error) {
        results[name] = { ok: false, error: error.message };
        errors.push({ service: name, message: error.message });
      }
    }

    return res.status(errors.length ? 207 : 200).json({
      ok: true,
      captured: leads.length,
      results,
      errors,
      sample: leads.slice(0, 5),
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

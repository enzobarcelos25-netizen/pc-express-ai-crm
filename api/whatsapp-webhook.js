function getMessageEvents(payload) {
  const entries = payload.entry || [];
  const events = [];

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        events.push({
          event_type: message.type || 'message',
          from_phone: message.from || '',
          message_id: message.id || '',
          payload: message,
        });
      }
      for (const status of value.statuses || []) {
        events.push({
          event_type: `status_${status.status || 'unknown'}`,
          from_phone: status.recipient_id || '',
          message_id: status.id || '',
          payload: status,
        });
      }
    }
  }

  return events;
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function forwardToN8n(payload, events) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return { skipped: true };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'whatsapp_webhook', events, payload }),
  });
  if (!response.ok) throw new Error(`n8n ${response.status}: ${await response.text()}`);
  return { ok: true };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Forbidden');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const payload = await readJson(req);
    const events = getMessageEvents(payload);
    const n8n = await forwardToN8n(payload, events);
    return res.status(200).json({ ok: true, events: events.length, n8n });
  } catch (error) {
    return res.status(200).json({ ok: false, error: error.message });
  }
}

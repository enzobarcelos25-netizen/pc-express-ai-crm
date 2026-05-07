export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    automation: {
      supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      n8n: Boolean(process.env.N8N_WEBHOOK_URL),
      googleSheets: Boolean(process.env.GOOGLE_APPS_SCRIPT_URL),
      whatsappCloudApi: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN),
      cronSecret: Boolean(process.env.CRON_SECRET),
    },
    endpoints: {
      leads: '/api/leads',
      cronCapture: '/api/cron-capture?limit=25',
      whatsappWebhook: '/api/whatsapp-webhook',
    },
  });
}

import { Activity, Play, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

const styles = {
  layout: {
    margin: '0 auto',
    maxWidth: 1120,
    padding: '56px 20px 72px',
  },
  panel: {
    background: 'rgba(12, 16, 32, 0.78)',
    border: '1px solid rgba(132, 238, 255, 0.14)',
    borderRadius: 8,
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.22)',
    display: 'grid',
    gap: 18,
    marginBottom: 18,
    padding: 22,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  grid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    marginBottom: 18,
  },
  card: {
    background: 'rgba(12, 16, 32, 0.78)',
    border: '1px solid rgba(132, 238, 255, 0.14)',
    borderRadius: 8,
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.22)',
    padding: 18,
  },
  label: {
    color: '#9eb1c7',
    fontSize: 13,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    display: 'block',
    fontSize: 22,
    margin: '8px 0',
  },
  text: {
    color: '#aab8cc',
    lineHeight: 1.45,
    marginBottom: 0,
  },
  log: {
    background: 'rgba(0, 0, 0, 0.34)',
    border: '1px solid rgba(132, 238, 255, 0.12)',
    borderRadius: 8,
    color: '#dcecff',
    margin: 0,
    maxHeight: 420,
    overflow: 'auto',
    padding: 14,
    whiteSpace: 'pre-wrap',
  },
};

function IntegrationCard({ label, enabled, detail }) {
  return (
    <article style={styles.card}>
      <span style={styles.label}>{label}</span>
      <strong style={styles.title}>{enabled ? 'Conectado' : 'Pendente'}</strong>
      <p style={styles.text}>{detail}</p>
    </article>
  );
}

export function Automacao() {
  const [status, setStatus] = useState(null);
  const [log, setLog] = useState('Nenhum teste rodado ainda.');
  const [loading, setLoading] = useState(false);

  async function checkIntegrations() {
    setLoading(true);
    setLog('Checando /api/health...');
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setStatus(data.automation);
      setLog(JSON.stringify(data, null, 2));
    } catch (error) {
      setLog(`API ainda nao respondeu neste ambiente.\n\nPublique na Vercel ou rode com Vercel CLI.\nErro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function runCapture() {
    setLoading(true);
    setLog('Rodando captura publica em Uberlandia...');
    try {
      const response = await fetch('/api/cron-capture?limit=10');
      const data = await response.json();
      setLog(JSON.stringify(data, null, 2));
    } catch (error) {
      setLog(`Captura automatica precisa da API no deploy Vercel.\nErro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={styles.layout}>
      <div className="section-heading">
        <Activity size={28} />
        <div>
          <p className="eyebrow">Automacao real</p>
          <h1>Motor de captacao</h1>
        </div>
      </div>

      <div style={styles.panel}>
        <p style={{ color: '#b6c3d6', fontSize: 17, lineHeight: 1.6, margin: 0, maxWidth: 820 }}>
          O diagnostico envia leads para <strong>/api/leads</strong>. O cron da Vercel chama{' '}
          <strong>/api/cron-capture</strong> diariamente para captar negocios publicos em Uberlandia.
        </p>
        <div style={styles.actions}>
          <button className="primary-button" type="button" onClick={checkIntegrations} disabled={loading}>
            <RefreshCw size={18} />
            Checar integracoes
          </button>
          <button className="secondary-button" type="button" onClick={runCapture} disabled={loading}>
            <Play size={18} />
            Rodar captura agora
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <IntegrationCard
          label="Supabase CRM"
          enabled={status?.supabase}
          detail={status?.supabase ? 'Leads vao para banco externo.' : 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'}
        />
        <IntegrationCard
          label="n8n"
          enabled={status?.n8n}
          detail={status?.n8n ? 'Webhook ativo para automacoes.' : 'Configure N8N_WEBHOOK_URL.'}
        />
        <IntegrationCard
          label="Google Sheets"
          enabled={status?.googleSheets}
          detail={status?.googleSheets ? 'Planilha recebe leads automaticamente.' : 'Configure GOOGLE_APPS_SCRIPT_URL.'}
        />
        <IntegrationCard
          label="WhatsApp Cloud API"
          enabled={status?.whatsappCloudApi}
          detail={status?.whatsappCloudApi ? 'Templates podem ser enviados com opt-in.' : 'Configure WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN.'}
        />
      </div>

      <div style={styles.card}>
        <strong style={{ color: '#fff', display: 'block', fontSize: 20, marginBottom: 10 }}>Log</strong>
        <pre style={styles.log}>{log}</pre>
      </div>
    </section>
  );
}

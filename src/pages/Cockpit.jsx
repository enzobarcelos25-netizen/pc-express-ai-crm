import { CheckCircle2, Copy, FileUp, MapPin, MessageCircle, RefreshCw, RotateCcw, SkipForward } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'pc-express-cockpit-v1';
const DEFAULT_INTERVAL_MS = 6 * 60 * 1000;
const LOCAL_BRIDGE_URL = 'http://127.0.0.1:8787/leads';

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
    gap: 16,
    marginBottom: 18,
    padding: 20,
  },
  metrics: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  },
  metric: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 14,
  },
  label: {
    color: '#9eb1c7',
    display: 'block',
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  value: {
    color: '#fff',
    display: 'block',
    fontSize: 24,
    fontWeight: 900,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    background: 'rgba(12, 16, 32, 0.78)',
    border: '1px solid rgba(132, 238, 255, 0.14)',
    borderRadius: 8,
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.22)',
    display: 'grid',
    gap: 16,
    padding: 20,
  },
  leadTop: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
  },
  pill: {
    background: 'rgba(124, 255, 107, 0.1)',
    border: '1px solid rgba(124, 255, 107, 0.25)',
    borderRadius: 999,
    color: '#c9ffcf',
    display: 'inline-flex',
    fontSize: 12,
    fontWeight: 900,
    padding: '7px 10px',
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 1.1,
    margin: '10px 0 6px',
  },
  muted: {
    color: '#aab8cc',
    lineHeight: 1.5,
    margin: 0,
  },
  textarea: {
    background: 'rgba(0, 0, 0, 0.28)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    color: '#eff7ff',
    font: 'inherit',
    lineHeight: 1.45,
    minHeight: 132,
    padding: 14,
    resize: 'vertical',
    width: '100%',
  },
  queue: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    marginTop: 18,
  },
  mini: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#eff7ff',
    cursor: 'pointer',
    padding: 12,
    textAlign: 'left',
  },
};

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      row.push(field);
      field = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((item) => item.trim() !== '')) rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((item) => item.trim() !== '')) rows.push(row);

  if (rows.length === 0) return [];
  const headers = rows.shift().map((item) => item.trim());
  return rows.map((items) =>
    headers.reduce((lead, header, index) => {
      lead[header] = (items[index] || '').trim();
      return lead;
    }, {}),
  );
}

function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('550')) digits = `55${digits.slice(3)}`;
  if (digits.length === 8 || digits.length === 9) digits = `5534${digits}`;
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!digits.startsWith('55') || digits.length < 12 || digits.length > 13) return '';
  return digits;
}

function buildMessage(lead) {
  if (lead.mensagem) return lead.mensagem;
  const name = lead.nome || 'sua empresa';
  if (lead.segmento === 'clinica') {
    return `Oi, tudo bem? Sou o Enzo da PC Express aqui em Uberlandia. Hoje estou fazendo diagnostico gratuito para PC de recepcao ou agenda lento/travando. Vi ${name} e queria perguntar: tem algum computador precisando de revisao rapida ai?`;
  }
  if (lead.segmento === 'educacao') {
    return `Oi, tudo bem? Sou o Enzo da PC Express aqui em Uberlandia. Hoje estou ajudando negocios locais com PC lento, limpeza e formatacao. Vi ${name} e queria perguntar: algum computador da secretaria ou atendimento esta travando?`;
  }
  if (lead.segmento === 'alimentacao') {
    return `Oi, tudo bem? Sou o Enzo da PC Express aqui em Uberlandia. Vi ${name} e queria perguntar: o computador de caixa ou atendimento esta rodando normal? Hoje estou fazendo diagnostico gratuito para PC lento.`;
  }
  return `Oi, tudo bem? Sou o Enzo da PC Express aqui em Uberlandia. Vi ${name} e estou fazendo hoje diagnostico gratuito para computador de escritorio lento ou travando. Tem algum PC ai precisando de uma revisao rapida?`;
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { leads: [], index: 0, sent: {}, nextAt: 0 };
  } catch {
    return { leads: [], index: 0, sent: {}, nextAt: 0 };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeLeads(items) {
  return items
    .map((item) => ({
      ...item,
      telefone_digits: normalizePhone(item.telefone_digits || item.telefone || item.whatsapp || item.phone),
      mensagem: buildMessage(item),
    }))
    .filter((item) => item.nome && item.telefone_digits)
    .sort((a, b) => Number(b.prioridade || b.score || 0) - Number(a.prioridade || a.score || 0));
}

function leadSignature(leads) {
  return leads.map((item) => `${item.nome}:${item.telefone_digits}`).join('|');
}

export function Cockpit() {
  const [state, setState] = useState(loadState);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState('Ponte local aguardando');
  const stateRef = useRef(state);

  const lead = state.leads[Math.min(state.index, Math.max(state.leads.length - 1, 0))] || null;
  const sentCount = Object.keys(state.sent || {}).length;
  const remainingMs = Math.max(0, (state.nextAt || 0) - now);
  const minutes = String(Math.floor(remainingMs / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0');

  const whatsAppUrl = useMemo(() => {
    if (!lead) return '#';
    const phone = normalizePhone(lead.telefone_digits || lead.telefone);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message || buildMessage(lead))}`;
  }, [lead, message]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setMessage(lead ? buildMessage(lead) : '');
  }, [lead]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    loadFromLocalBridge({ quiet: true });
    const syncTimer = window.setInterval(() => loadFromLocalBridge({ quiet: true }), 60000);
    return () => window.clearInterval(syncTimer);
  }, []);

  function updateState(next) {
    setState(next);
    saveState(next);
  }

  function applyImportedLeads(leads, sourceLabel) {
    const currentState = stateRef.current;
    if (!leads.length) {
      setSyncStatus(`${sourceLabel}: nenhum lead valido`);
      return;
    }

    const currentPhone = currentState.leads[currentState.index]?.telefone_digits;
    const currentIndex = currentPhone ? leads.findIndex((item) => item.telefone_digits === currentPhone) : 0;

    updateState({
      ...currentState,
      leads,
      index: Math.max(0, currentIndex),
      importedAt: new Date().toISOString(),
      importedFrom: sourceLabel,
      signature: leadSignature(leads),
    });
    setSyncStatus(`${sourceLabel}: ${leads.length} leads carregados`);
  }

  async function loadFromLocalBridge(options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(LOCAL_BRIDGE_URL, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      const leads = normalizeLeads(payload.leads || payload || []);
      const signature = leadSignature(leads);
      const currentState = stateRef.current;

      if (signature && signature !== currentState.signature) {
        applyImportedLeads(leads, 'Ponte local');
      } else if (!options.quiet) {
        setSyncStatus(`Ponte local: ${leads.length} leads ja estao carregados`);
      }
    } catch {
      if (!options.quiet) setSyncStatus('Ponte local offline');
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const leads = normalizeLeads(parseCsv(text));
    updateState({
      leads,
      index: 0,
      sent: {},
      nextAt: 0,
      importedAt: new Date().toISOString(),
      importedFrom: file.name,
      signature: leadSignature(leads),
    });
    setSyncStatus(`${file.name}: ${leads.length} leads carregados`);
  }

  function markSent() {
    if (!lead) return;
    const key = lead.telefone_digits || lead.telefone;
    updateState({
      ...state,
      index: Math.min(state.index + 1, Math.max(state.leads.length - 1, 0)),
      nextAt: Date.now() + DEFAULT_INTERVAL_MS,
      sent: { ...state.sent, [key]: new Date().toISOString() },
    });
  }

  function skipLead() {
    updateState({ ...state, index: Math.min(state.index + 1, Math.max(state.leads.length - 1, 0)) });
  }

  function reset() {
    updateState({ leads: [], index: 0, sent: {}, nextAt: 0 });
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
  }

  return (
    <section style={styles.layout}>
      <div className="section-heading">
        <MessageCircle size={28} />
        <div>
          <p className="eyebrow">Venda assistida</p>
          <h1>Cockpit de WhatsApp</h1>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.metrics}>
          <div style={styles.metric}>
            <span style={styles.label}>Leads</span>
            <strong style={styles.value}>{state.leads.length}</strong>
          </div>
          <div style={styles.metric}>
            <span style={styles.label}>Enviados</span>
            <strong style={styles.value}>{sentCount}</strong>
          </div>
          <div style={styles.metric}>
            <span style={styles.label}>Atual</span>
            <strong style={styles.value}>{state.leads.length ? `${state.index + 1}/${state.leads.length}` : '0/0'}</strong>
          </div>
          <div style={styles.metric}>
            <span style={styles.label}>Proximo</span>
            <strong style={styles.value}>{minutes}:{seconds}</strong>
          </div>
        </div>

        <div style={styles.actions}>
          <label className="primary-button" style={{ cursor: 'pointer' }}>
            <FileUp size={18} />
            Importar CSV
            <input accept=".csv,text/csv" onChange={importCsv} style={{ display: 'none' }} type="file" />
          </label>
          <button className="secondary-button" onClick={() => loadFromLocalBridge()} type="button">
            <RefreshCw size={18} />
            Sincronizar ponte
          </button>
          <button className="secondary-button" onClick={reset} type="button">
            <RotateCcw size={18} />
            Limpar fila
          </button>
        </div>
        <p style={styles.muted}>{syncStatus}</p>
      </div>

      <div style={styles.card}>
        {lead ? (
          <>
            <div style={styles.leadTop}>
              <div>
                <span style={styles.pill}>{lead.segmento || 'lead'} | score {lead.prioridade || '-'}</span>
                <h1 style={styles.title}>{lead.nome}</h1>
                <p style={styles.muted}>{lead.telefone}</p>
              </div>
              {lead.google_maps && (
                <a className="secondary-button" href={lead.google_maps} rel="noreferrer" target="_blank">
                  <MapPin size={18} />
                  Mapa
                </a>
              )}
            </div>

            <textarea onChange={(event) => setMessage(event.target.value)} style={styles.textarea} value={message} />

            <div style={styles.actions}>
              <button className="primary-button" onClick={copyMessage} type="button">
                <Copy size={18} />
                Copiar
              </button>
              <a className="primary-button" href={whatsAppUrl} rel="noreferrer" target="_blank">
                <MessageCircle size={18} />
                Abrir WhatsApp
              </a>
              <button className="secondary-button" onClick={markSent} type="button">
                <CheckCircle2 size={18} />
                Marcar enviado
              </button>
              <button className="secondary-button" onClick={skipLead} type="button">
                <SkipForward size={18} />
                Pular
              </button>
            </div>
          </>
        ) : (
          <p style={styles.muted}>
            Importe o arquivo ataque-hoje-telefone-pronto.csv para carregar a fila. A lista fica salva apenas neste
            navegador.
          </p>
        )}
      </div>

      {state.leads.length > 0 && (
        <div style={styles.queue}>
          {state.leads.slice(0, 80).map((item, index) => (
            <button
              key={`${item.telefone_digits}-${index}`}
              onClick={() => updateState({ ...state, index })}
              style={{ ...styles.mini, opacity: state.sent[item.telefone_digits] ? 0.45 : 1 }}
              type="button"
            >
              <strong>{item.nome}</strong>
              <p style={styles.muted}>{item.segmento || 'lead'} | {item.telefone}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

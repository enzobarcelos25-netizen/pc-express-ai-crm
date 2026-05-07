import {
  AlarmClock,
  CheckCircle2,
  Copy,
  FileUp,
  MapPin,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Send,
  SkipForward,
  Target,
  Trophy,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'pc-express-cockpit-v2';
const LEGACY_STORAGE_KEY = 'pc-express-cockpit-v1';
const DEFAULT_INTERVAL_MS = 6 * 60 * 1000;
const LOCAL_BRIDGE_URL = 'http://127.0.0.1:8787/leads';

const STATUS_META = {
  novo: { label: 'Novo', tone: '#9eb1c7' },
  enviado: { label: 'Enviado', tone: '#86e7ff' },
  respondeu: { label: 'Respondeu', tone: '#c9ffcf' },
  orcamento: { label: 'Orcamento', tone: '#ffd166' },
  fechado: { label: 'Fechado', tone: '#7cff6b' },
  perdido: { label: 'Perdido', tone: '#ff7b7b' },
  pulado: { label: 'Pulado', tone: '#c0c4d1' },
};

const BLOCKED_STATUSES = new Set(['enviado', 'respondeu', 'orcamento', 'fechado', 'perdido', 'pulado']);
const FOLLOW_UP_BLOCKED_STATUSES = new Set(['respondeu', 'orcamento', 'fechado', 'perdido', 'pulado']);

const styles = {
  layout: {
    margin: '0 auto',
    maxWidth: 1180,
    padding: '48px 20px 72px',
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
  heroGrid: {
    alignItems: 'stretch',
    display: 'grid',
    gap: 18,
    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 0.8fr)',
  },
  metrics: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
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
    fontSize: 34,
    lineHeight: 1.05,
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
    minHeight: 92,
    padding: 12,
    textAlign: 'left',
  },
  statusPill: {
    borderRadius: 999,
    display: 'inline-flex',
    fontSize: 11,
    fontWeight: 900,
    marginTop: 8,
    padding: '5px 8px',
    textTransform: 'uppercase',
  },
  followList: {
    display: 'grid',
    gap: 10,
  },
  compactRow: {
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#eff7ff',
    display: 'grid',
    gap: 8,
    gridTemplateColumns: '1fr auto',
    padding: 12,
    textAlign: 'left',
  },
};

function defaultState() {
  return {
    leads: [],
    index: 0,
    sent: {},
    statuses: {},
    followups: {},
    activity: [],
    nextAt: 0,
    signature: '',
  };
}

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

function leadKey(lead) {
  if (!lead) return '';
  return normalizePhone(lead.telefone_digits || lead.telefone || lead.whatsapp || lead.phone) || lead.id || lead.nome;
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

function buildFollowUpMessage(lead, stage) {
  const name = lead.nome || 'sua empresa';
  if (stage === 1) {
    return `Oi, passando rapidinho. Conseguiu ver se tem algum PC lento ou travando ai na ${name}? Se quiser, faco uma avaliacao rapida hoje.`;
  }
  if (stage === 2) {
    return `Bom dia, tudo bem? Sou o Enzo da PC Express. So retomando meu contato sobre revisao de computador lento/travando na ${name}. Se tiver algo atrapalhando o atendimento, consigo te orientar.`;
  }
  return `Ultimo toque por aqui: se algum computador da ${name} estiver precisando de formatacao, limpeza ou upgrade, posso te passar um diagnostico simples sem compromisso.`;
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

function normalizeState(raw) {
  const next = { ...defaultState(), ...(raw || {}) };
  next.sent = next.sent || {};
  next.statuses = next.statuses || {};
  next.followups = next.followups || {};
  next.activity = Array.isArray(next.activity) ? next.activity : [];

  Object.keys(next.sent).forEach((key) => {
    if (!next.statuses[key]) {
      next.statuses[key] = {
        status: 'enviado',
        updatedAt: next.sent[key],
      };
    }
  });

  return next;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

function getLeadStatus(state, lead) {
  const key = leadKey(lead);
  return state.statuses?.[key]?.status || 'novo';
}

function isFreshLead(state, lead) {
  return !BLOCKED_STATUSES.has(getLeadStatus(state, lead));
}

function findNextFreshIndex(leads, statuses, start = 0) {
  const state = { statuses };
  if (!leads.length) return 0;

  for (let index = start; index < leads.length; index += 1) {
    if (isFreshLead(state, leads[index])) return index;
  }
  for (let index = 0; index < Math.min(start, leads.length); index += 1) {
    if (isFreshLead(state, leads[index])) return index;
  }
  return Math.min(start, leads.length - 1);
}

function addActivity(state, lead, action) {
  const entry = {
    action,
    lead: lead?.nome || 'Lead',
    phone: leadKey(lead),
    at: new Date().toISOString(),
  };
  return [entry, ...(state.activity || [])].slice(0, 80);
}

function tomorrowAt(hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function createFollowups(lead) {
  const now = Date.now();
  const key = leadKey(lead);
  return [
    {
      id: `${key}-2h-${now}`,
      stage: 1,
      label: '2 horas',
      dueAt: now + 2 * 60 * 60 * 1000,
      status: 'pendente',
      message: buildFollowUpMessage(lead, 1),
    },
    {
      id: `${key}-amanha-${now}`,
      stage: 2,
      label: 'Amanha cedo',
      dueAt: tomorrowAt(9, 30),
      status: 'pendente',
      message: buildFollowUpMessage(lead, 2),
    },
    {
      id: `${key}-3d-${now}`,
      stage: 3,
      label: '3 dias',
      dueAt: now + 3 * 24 * 60 * 60 * 1000,
      status: 'pendente',
      message: buildFollowUpMessage(lead, 3),
    },
  ];
}

function formatShortDate(timestamp) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(new Date(timestamp));
}

function getDueFollowups(state, now) {
  return Object.entries(state.followups || {}).flatMap(([key, followups]) => {
    const lead = state.leads.find((item) => leadKey(item) === key);
    if (!lead || FOLLOW_UP_BLOCKED_STATUSES.has(getLeadStatus(state, lead))) return [];
    return (followups || [])
      .filter((item) => item.status === 'pendente' && item.dueAt <= now)
      .map((item) => ({ ...item, key, lead }));
  });
}

function getUpcomingFollowups(state, now) {
  return Object.entries(state.followups || {})
    .flatMap(([key, followups]) => {
      const lead = state.leads.find((item) => leadKey(item) === key);
      if (!lead || FOLLOW_UP_BLOCKED_STATUSES.has(getLeadStatus(state, lead))) return [];
      return (followups || [])
        .filter((item) => item.status === 'pendente' && item.dueAt > now)
        .map((item) => ({ ...item, key, lead }));
    })
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, 5);
}

function statusStyle(status) {
  const tone = STATUS_META[status]?.tone || '#9eb1c7';
  return {
    ...styles.statusPill,
    background: `${tone}18`,
    border: `1px solid ${tone}55`,
    color: tone,
  };
}

export function Cockpit() {
  const [state, setState] = useState(loadState);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState('Ponte local aguardando');
  const [activeFollowup, setActiveFollowup] = useState(null);
  const stateRef = useRef(state);

  const lead = state.leads[Math.min(state.index, Math.max(state.leads.length - 1, 0))] || null;
  const leadStatus = lead ? getLeadStatus(state, lead) : 'novo';
  const freshLeads = useMemo(() => state.leads.filter((item) => isFreshLead(state, item)), [state]);
  const dueFollowups = useMemo(() => getDueFollowups(state, now), [state, now]);
  const upcomingFollowups = useMemo(() => getUpcomingFollowups(state, now), [state, now]);
  const sentCount = Object.values(state.statuses || {}).filter((item) => item.status === 'enviado').length;
  const responseCount = Object.values(state.statuses || {}).filter((item) =>
    ['respondeu', 'orcamento', 'fechado'].includes(item.status),
  ).length;
  const closedCount = Object.values(state.statuses || {}).filter((item) => item.status === 'fechado').length;
  const remainingMs = Math.max(0, (state.nextAt || 0) - now);
  const minutes = String(Math.floor(remainingMs / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0');
  const cadenceLabel = remainingMs ? `${minutes}:${seconds}` : 'Liberado';

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
    if (activeFollowup?.leadKey === leadKey(lead)) return;
    setMessage(lead ? buildMessage(lead) : '');
    setActiveFollowup(null);
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
    const normalized = normalizeState(next);
    setState(normalized);
    stateRef.current = normalized;
    saveState(normalized);
  }

  function applyImportedLeads(leads, sourceLabel) {
    const currentState = stateRef.current;
    if (!leads.length) {
      setSyncStatus(`${sourceLabel}: nenhum lead valido`);
      return;
    }

    const currentPhone = leadKey(currentState.leads[currentState.index]);
    const currentIndex = currentPhone ? leads.findIndex((item) => leadKey(item) === currentPhone) : -1;
    const preferredIndex =
      currentIndex >= 0 && isFreshLead(currentState, leads[currentIndex])
        ? currentIndex
        : findNextFreshIndex(leads, currentState.statuses, 0);

    updateState({
      ...currentState,
      leads,
      index: preferredIndex,
      importedAt: new Date().toISOString(),
      importedFrom: sourceLabel,
      signature: leadSignature(leads),
    });
    setSyncStatus(`${sourceLabel}: ${leads.length} leads carregados`);
  }

  async function loadFromLocalBridge(options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);

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
      ...stateRef.current,
      leads,
      index: findNextFreshIndex(leads, stateRef.current.statuses, 0),
      importedAt: new Date().toISOString(),
      importedFrom: file.name,
      signature: leadSignature(leads),
    });
    setSyncStatus(`${file.name}: ${leads.length} leads carregados`);
  }

  function setLeadOutcome(status, actionLabel, options = {}) {
    if (!lead) return;
    const key = leadKey(lead);
    const currentState = stateRef.current;
    const statuses = {
      ...currentState.statuses,
      [key]: {
        ...(currentState.statuses[key] || {}),
        status,
        updatedAt: new Date().toISOString(),
      },
    };
    const sent = status === 'enviado' ? { ...currentState.sent, [key]: new Date().toISOString() } : currentState.sent;
    const followups =
      status === 'enviado' && !currentState.followups[key]?.length
        ? { ...currentState.followups, [key]: createFollowups(lead) }
        : currentState.followups;

    const nextState = {
      ...currentState,
      statuses,
      sent,
      followups,
      nextAt: options.setCadence ? Date.now() + DEFAULT_INTERVAL_MS : currentState.nextAt,
      activity: addActivity(currentState, lead, actionLabel),
    };

    nextState.index = findNextFreshIndex(nextState.leads, nextState.statuses, currentState.index + 1);
    updateState(nextState);
  }

  function markSent() {
    setLeadOutcome('enviado', 'Mensagem enviada', { setCadence: true });
  }

  function skipLead() {
    setLeadOutcome('pulado', 'Pulou hoje');
  }

  function markOutcome(status) {
    const labels = {
      respondeu: 'Respondeu',
      orcamento: 'Virou orcamento',
      fechado: 'Venda fechada',
      perdido: 'Perdido',
    };
    completeActiveFollowup();
    setLeadOutcome(status, labels[status] || status);
  }

  function reset() {
    updateState(defaultState());
    setMessage('');
    setSyncStatus('Fila limpa');
    setActiveFollowup(null);
  }

  function nextFreshLead() {
    const nextIndex = findNextFreshIndex(state.leads, state.statuses, state.index + 1);
    updateState({ ...state, index: nextIndex });
  }

  function openFollowup(item) {
    const index = state.leads.findIndex((candidate) => leadKey(candidate) === item.key);
    if (index >= 0) {
      updateState({ ...state, index });
      setMessage(item.message);
      setActiveFollowup({ id: item.id, leadKey: item.key });
    }
  }

  function completeActiveFollowup() {
    if (!activeFollowup) return;
    const currentState = stateRef.current;
    const list = currentState.followups[activeFollowup.leadKey] || [];
    updateState({
      ...currentState,
      followups: {
        ...currentState.followups,
        [activeFollowup.leadKey]: list.map((item) =>
          item.id === activeFollowup.id ? { ...item, status: 'feito', doneAt: new Date().toISOString() } : item,
        ),
      },
    });
    setActiveFollowup(null);
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
  }

  return (
    <section style={styles.layout}>
      <div className="section-heading">
        <Target size={28} />
        <div>
          <p className="eyebrow">Modo Venda Hoje</p>
          <h1>Cockpit de WhatsApp</h1>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.metrics}>
          <div style={styles.metric}>
            <span style={styles.label}>Novos na fila</span>
            <strong style={styles.value}>{freshLeads.length}</strong>
          </div>
          <div style={styles.metric}>
            <span style={styles.label}>Enviados</span>
            <strong style={styles.value}>{sentCount}</strong>
          </div>
          <div style={styles.metric}>
            <span style={styles.label}>Respostas</span>
            <strong style={styles.value}>{responseCount}</strong>
          </div>
          <div style={styles.metric}>
            <span style={styles.label}>Fechados</span>
            <strong style={styles.value}>{closedCount}</strong>
          </div>
          <div style={styles.metric}>
            <span style={styles.label}>Follow-ups</span>
            <strong style={styles.value}>{dueFollowups.length}</strong>
          </div>
          <div style={styles.metric}>
            <span style={styles.label}>Cadencia</span>
            <strong style={styles.value}>{cadenceLabel}</strong>
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
          <button className="secondary-button" onClick={nextFreshLead} type="button">
            <SkipForward size={18} />
            Proximo lead
          </button>
          <button className="secondary-button" onClick={reset} type="button">
            <RotateCcw size={18} />
            Limpar fila
          </button>
        </div>
        <p style={styles.muted}>{syncStatus}</p>
      </div>

      <div style={styles.heroGrid}>
        <div style={styles.card}>
          {lead ? (
            <>
              <div style={styles.leadTop}>
                <div>
                  <span style={styles.pill}>{lead.segmento || 'lead'} | score {lead.prioridade || '-'}</span>
                  <h1 style={styles.title}>{lead.nome}</h1>
                  <p style={styles.muted}>{lead.telefone}</p>
                  <span style={statusStyle(leadStatus)}>{STATUS_META[leadStatus]?.label || leadStatus}</span>
                </div>
                {lead.google_maps && (
                  <a className="secondary-button" href={lead.google_maps} rel="noreferrer" target="_blank">
                    <MapPin size={18} />
                    Mapa
                  </a>
                )}
              </div>

              {activeFollowup && <span style={styles.pill}>Follow-up ativo</span>}

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
                  <Send size={18} />
                  Marcar enviado
                </button>
                {activeFollowup && (
                  <button className="secondary-button" onClick={completeActiveFollowup} type="button">
                    <CheckCircle2 size={18} />
                    Follow-up feito
                  </button>
                )}
                <button className="secondary-button" onClick={() => markOutcome('respondeu')} type="button">
                  <CheckCircle2 size={18} />
                  Respondeu
                </button>
                <button className="secondary-button" onClick={() => markOutcome('orcamento')} type="button">
                  <AlarmClock size={18} />
                  Orcamento
                </button>
                <button className="secondary-button" onClick={() => markOutcome('fechado')} type="button">
                  <Trophy size={18} />
                  Fechou
                </button>
                <button className="secondary-button" onClick={skipLead} type="button">
                  <SkipForward size={18} />
                  Pular hoje
                </button>
              </div>
            </>
          ) : (
            <p style={styles.muted}>
              Ligue a ponte local ou importe o arquivo ataque-hoje-telefone-pronto.csv para carregar a fila.
            </p>
          )}
        </div>

        <div style={styles.card}>
          <div>
            <span style={styles.label}>Follow-ups vencidos</span>
            <strong style={styles.value}>{dueFollowups.length}</strong>
          </div>
          <div style={styles.followList}>
            {dueFollowups.slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => openFollowup(item)} style={styles.compactRow} type="button">
                <span>
                  <strong>{item.lead.nome}</strong>
                  <p style={styles.muted}>{item.label} | venceu {formatShortDate(item.dueAt)}</p>
                </span>
                <MessageCircle size={18} />
              </button>
            ))}
            {dueFollowups.length === 0 && <p style={styles.muted}>Nenhum follow-up vencido agora.</p>}
          </div>

          <div>
            <span style={styles.label}>Proximos</span>
            <div style={styles.followList}>
              {upcomingFollowups.slice(0, 3).map((item) => (
                <div key={item.id} style={styles.compactRow}>
                  <span>
                    <strong>{item.lead.nome}</strong>
                    <p style={styles.muted}>{item.label} | {formatShortDate(item.dueAt)}</p>
                  </span>
                  <AlarmClock size={18} />
                </div>
              ))}
              {upcomingFollowups.length === 0 && <p style={styles.muted}>Sem follow-ups agendados.</p>}
            </div>
          </div>
        </div>
      </div>

      {state.leads.length > 0 && (
        <div style={styles.queue}>
          {state.leads.slice(0, 120).map((item, index) => {
            const status = getLeadStatus(state, item);
            return (
              <button
                key={`${item.telefone_digits}-${index}`}
                onClick={() => updateState({ ...state, index })}
                style={{ ...styles.mini, opacity: BLOCKED_STATUSES.has(status) ? 0.58 : 1 }}
                type="button"
              >
                <strong>{item.nome}</strong>
                <p style={styles.muted}>{item.segmento || 'lead'} | {item.telefone}</p>
                <span style={statusStyle(status)}>{STATUS_META[status]?.label || status}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

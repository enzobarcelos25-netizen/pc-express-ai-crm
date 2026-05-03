import { BarChart3, CheckCircle2, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { clearLeads, getLeads, updateLeadStatus } from '../services/leads.js';

const statuses = ['novo', 'contato', 'fechado'];

export function Admin({ nav }) {
  const [leads, setLeads] = useState(() => getLeads());

  const metrics = useMemo(
    () => ({
      total: leads.length,
      novos: leads.filter((lead) => lead.status === 'novo').length,
      fechados: leads.filter((lead) => lead.status === 'fechado').length,
    }),
    [leads],
  );

  function changeStatus(id, status) {
    const updated = updateLeadStatus(id, status);
    setLeads(updated);
    nav.refreshLeads();
  }

  function removeAll() {
    clearLeads();
    setLeads([]);
    nav.refreshLeads();
  }

  return (
    <section className="admin-layout">
      <div className="admin-header">
        <div className="section-heading">
          <BarChart3 size={28} />
          <div>
            <p className="eyebrow">Painel admin</p>
            <h1>Leads e vendas</h1>
          </div>
        </div>
        {leads.length > 0 && (
          <button className="icon-button danger" type="button" onClick={removeAll} title="Limpar leads">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="metric-grid">
        <Metric label="Total" value={metrics.total} />
        <Metric label="Novos" value={metrics.novos} />
        <Metric label="Fechados" value={metrics.fechados} />
      </div>

      {leads.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={32} />
          <h2>Nenhum lead salvo ainda</h2>
          <button className="primary-button" type="button" onClick={nav.goDiagnostic}>
            Criar primeiro lead
          </button>
        </div>
      ) : (
        <div className="lead-list">
          {leads.map((lead) => (
            <article className="lead-card" key={lead.id}>
              <div>
                <h2>{lead.nome}</h2>
                <p>{lead.problema}</p>
                <strong>{lead.recomendacao}</strong>
                {lead.telefone && <small>{lead.telefone}</small>}
              </div>

              <select value={lead.status} onChange={(event) => changeStatus(lead.id, event.target.value)}>
                {statuses.map((status) => (
                  <option value={status} key={status}>
                    {status}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const STORAGE_KEY = 'pc-express-leads';

export async function syncLeadRemote(lead) {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: lead.id,
      nome: lead.nome,
      telefone: lead.telefone,
      problema: lead.problema,
      recomendacao: lead.recomendacao,
      explicacao: lead.explicacao,
      consent: lead.consent,
      answers: lead.answers,
      source: 'site_diagnostico_pc_express',
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok && response.status !== 207) {
    throw new Error(data?.error || 'Falha ao sincronizar lead');
  }
  return data;
}

export function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function saveLead(lead) {
  const leads = getLeads();
  const newLead = {
    ...lead,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify([newLead, ...leads]));

  syncLeadRemote(newLead)
    .then((result) => {
      const current = getLeads();
      const updated = current.map((item) =>
        item.id === newLead.id ? { ...item, syncStatus: 'sincronizado', syncResult: result } : item,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    })
    .catch((error) => {
      const current = getLeads();
      const updated = current.map((item) =>
        item.id === newLead.id ? { ...item, syncStatus: 'erro', syncError: error.message } : item,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    });

  return newLead;
}

export function updateLeadStatus(id, status) {
  const updated = getLeads().map((lead) => (lead.id === id ? { ...lead, status } : lead));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearLeads() {
  localStorage.removeItem(STORAGE_KEY);
}

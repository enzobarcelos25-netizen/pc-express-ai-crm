const STORAGE_KEY = 'pc-express-leads';

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

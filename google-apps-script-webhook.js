function doPost(e) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads') ||
    SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'created_at',
      'nome',
      'telefone',
      'telefone_normalizado',
      'problema',
      'recomendacao',
      'score',
      'consent',
      'source',
      'page_url',
      'status',
    ]);
  }

  const payload = JSON.parse(e.postData.contents || '{}');
  const leads = Array.isArray(payload.leads) ? payload.leads : [payload];

  leads.forEach(function (lead) {
    sheet.appendRow([
      new Date(),
      lead.nome || '',
      lead.telefone || '',
      lead.telefone_normalizado || '',
      lead.problema || '',
      lead.recomendacao || '',
      lead.score || '',
      lead.consent === true,
      lead.source || '',
      lead.page_url || '',
      lead.status || 'novo',
    ]);
  });

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

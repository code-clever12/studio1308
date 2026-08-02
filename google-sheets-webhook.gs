/**
 * Deployment steps:
 * 1. Open (or create) the Google Sheet you want leads to land in.
 * 2. Extensions -> Apps Script. Delete any starter code and paste this in.
 * 3. Click Deploy -> New deployment -> type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Click Deploy, authorize it, and copy the Web App URL it gives you
 *    (ends in /exec). Paste that URL into lead-form.js as GOOGLE_SHEETS_URL.
 * 5. Re-run Deploy -> Manage deployments -> New version any time you edit this file.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  // Write header row once, if the sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Date', 'Name', 'Phone', 'Email', 'Form Name', 'Form Slug',
      'Is Partial', 'Preferred Date', 'Preferred Time', 'Preferred Slot',
      'URL', 'UTM Term', 'UTM Content', 'Ad Group ID', 'GAD Campaign ID', 'GCLID'
    ]);
  }

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.phone || '',
    data.email || '',
    data.form_name || '',
    data.form_slug || '',
    data.is_partial || false,
    data.preferred_date || '',
    data.preferred_time || '',
    data.preferred_slot_display || '',
    data.url || '',
    data.utm_term || '',
    data.utm_content || '',
    data.utm_adgroupid || '',
    data.utm_gad_campaignid || '',
    data.utm_gclid || ''
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

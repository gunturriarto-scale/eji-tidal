/**
 * Clear metrics from KOL spreadsheet columns I–N and T
 * Usage: node scripts/clear-metrics.js
 */
import { google } from 'googleapis';
import 'dotenv/config';

const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
  keyFile: '/home/digitaldecade/eji-kol/service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

async function clearMetrics() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const allSheets = meta.data.sheets
    .map(s => ({ title: s.properties.title, id: s.properties.sheetId }))
    .filter(s => /^\[(TT|YC|IG)\]/.test(s.title));

  console.log(`Clearing ${allSheets.length} sheets...`);

  for (const { title, id } of allSheets) {
    try {
      // Read row count first
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${title}'!A:A`,
      });
      const rows = resp.data.values?.length || 0;
      if (rows < 2) {
        console.log(`  [${title}] empty, skipping`);
        continue;
      }

      const lastRow = rows;
      // Clear columns I-N (9-14) and T (20)
      const range = `'${title}'!I2:N${lastRow}`;
      const clearResp = await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range,
      });
      console.log(`  ✓ [${title}] cleared I:N (${lastRow - 1} rows)`);

      // Clear column T
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${title}'!T2:T${lastRow}`,
      });
      console.log(`  ✓ [${title}] cleared T`);
    } catch (err) {
      console.error(`  ✗ [${title}] failed: ${err.message}`);
    }
  }

  console.log('\n✅ All metrics cleared!');
}

clearMetrics().catch(console.error);
import https from 'https';
import Papa from 'papaparse';

const sheet_id = '1jl0wFIfNEWYofEHN27Wb9UM1bdmoxzt5e2NUGyFijHY';
const urls = {
  TIKTOK: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=TIKTOK`,
  META:   `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=META`,
  GOOGLE: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=GOOGLE%20ADS`,
  OFFSITE: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=OFFSITE`
};

async function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchCSV(res.headers.location));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', err => reject(err));
    });
}

async function main() {
    for (const [key, url] of Object.entries(urls)) {
        console.log(`\n--- ${key} ---`);
        try {
            const csvData = await fetchCSV(url);
            const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
            if (parsed.data.length > 0) {
                console.log("Columns:", Object.keys(parsed.data[0]));
            } else {
                console.log("No data");
            }
        } catch (e) {
            console.log("Error:", e);
        }
    }
}

main();

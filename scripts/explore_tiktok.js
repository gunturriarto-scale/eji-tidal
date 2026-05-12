import { BigQuery } from '@google-cloud/bigquery';

const keyFilePath = '/Users/mgrmediaads/Downloads/big-data-494007-f6751e5fec47.json';

async function exploreTikTokTables() {
  const bigquery = new BigQuery({ keyFilename: keyFilePath });

  try {
    const projectId = 'big-data-494007';
    const [datasets] = await bigquery.getDatasets();
    console.log(`Found ${datasets.length} datasets`);

    for (const dataset of datasets) {
      const [tables] = await dataset.getTables();
      for (const table of tables) {
        const name = table.id.toLowerCase();
        if (name.includes('tiktok') || name.includes('ttads') || name.includes('tt_ads')) {
          console.log(`\n🎯 FOUND: ${dataset.id}.${table.id}`);
          const [metadata] = await table.getMetadata();
          console.log(`Schema: ${metadata.schema.fields.map(f => f.name).join(', ')}`);

          try {
            const [rows] = await bigquery.query({
              query: `SELECT * FROM \`${projectId}.${dataset.id}.${table.id}\` LIMIT 3`
            });
            if (rows.length > 0) {
              console.log(`Sample: ${JSON.stringify(rows[0]).substring(0, 400)}`);
            }
          } catch (e) {
            console.log(`Query error: ${e.message}`);
          }
        }
      }
    }

    // Also look in bigdata dataset specifically
    console.log('\n\n--- CHECKING bigdata dataset ---');
    const [bigdataTables] = await bigquery.dataset('bigdata').getTables();
    for (const table of bigdataTables) {
      const name = table.id.toLowerCase();
      if (name.includes('tiktok') || name.includes('ttads') || name.includes('tt_ads')) {
        console.log(`\n🎯 FOUND: bigdata.${table.id}`);
        const [metadata] = await table.getMetadata();
        console.log(`Schema: ${metadata.schema.fields.map(f => f.name).join(', ')}`);
      }
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

exploreTikTokTables();

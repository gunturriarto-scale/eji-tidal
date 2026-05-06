import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';

const keyFilePath = '/Users/mgrmediaads/Downloads/big-data-494007-f6751e5fec47.json';

async function exploreBigQuery() {
  const bigquery = new BigQuery({
    keyFilename: keyFilePath,
  });

  try {
    console.log('--- PROJECT INFO ---');
    const [datasets] = await bigquery.getDatasets();
    console.log(`Found ${datasets.length} datasets:`);
    
    for (const dataset of datasets) {
      console.log(`\n📂 Dataset: ${dataset.id}`);
      const [tables] = await dataset.getTables();
      
      for (const table of tables) {
        console.log(`  - 📄 Table: ${table.id}`);
        
        // Show schema for Meta/Ads related tables
        if (table.id.toLowerCase().includes('meta') || table.id.toLowerCase().includes('ads')) {
          const [metadata] = await table.getMetadata();
          console.log(`    Columns: ${metadata.schema.fields.map(f => f.name).join(', ')}`);
          
          // Sample 1 row to see data quality (optional, but good for feedback)
          try {
            const [rows] = await table.getRows({ maxResults: 1 });
            if (rows.length > 0) {
              console.log(`    Sample Data: ${JSON.stringify(rows[0]).substring(0, 200)}...`);
            }
          } catch (e) {
            console.log(`    (Could not fetch sample data: ${e.message})`);
          }
        }
      }
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
}

exploreBigQuery();

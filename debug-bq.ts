import { createBigQueryClient } from './src/shared/vendors/google/bigquery/bigquery';

async function main() {
    const bq = createBigQueryClient();
    const query = "SELECT * FROM `signals.active_pmax_campaign_monitor` LIMIT 5";
    try {
        const [rows] = await bq.query(query);
        console.log('Rows:', JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();

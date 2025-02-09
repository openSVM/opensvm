const { Flipside } = require('@flipsidecrypto/sdk');
require('dotenv').config();

const FLIPSIDE_API_KEY = process.env.FLIPSIDE_API_KEY;
if (!FLIPSIDE_API_KEY) {
  throw new Error('FLIPSIDE_API_KEY environment variable is required');
}

const flipside = new Flipside(FLIPSIDE_API_KEY, 'https://api-v2.flipsidecrypto.xyz');

async function queryFlipside(query: string) {
  console.log('\nExecuting query:', query);
  try {
    const result = await flipside.query.run({
      sql: query,
      ttlMinutes: 10,
      cached: true,
      timeoutMinutes: 10,
      pageSize: 100,
      pageNumber: 1,
    });
    return result;
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

async function testQueries() {
  const address = 'DcLAENJhVEPmfPMZn4vqQoaHjCBWL3JzcRnrhXCGoVp4';
  const mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
  
  // Test account transfers query
  const accountQuery = `
    WITH transfer_windows AS (
      SELECT 
        DATE_TRUNC('minute', block_timestamp) as minute,
        COUNT(*) as transfers
      FROM solana.core.fact_transfers
      WHERE block_timestamp >= DATEADD('hour', -1, CURRENT_TIMESTAMP())
      AND (tx_to = '${address}' OR tx_from = '${address}')
      GROUP BY 1
      
      UNION ALL
      
      SELECT 
        DATE_TRUNC('hour', block_timestamp) as hour,
        COUNT(*) as transfers
      FROM solana.core.fact_transfers
      WHERE block_timestamp >= DATEADD('hour', -24, CURRENT_TIMESTAMP())
      AND block_timestamp < DATEADD('hour', -1, CURRENT_TIMESTAMP())
      AND (tx_to = '${address}' OR tx_from = '${address}')
      GROUP BY 1
    )
    SELECT SUM(transfers) as transfer_count
    FROM transfer_windows
  `.trim();

  console.log('\nTesting account transfers query...');
  console.time('Account Query');
  try {
    const result = await queryFlipside(accountQuery);
    console.timeEnd('Account Query');
    console.log('Result:', result);
  } catch (error) {
    console.log('Account query failed:', error);
  }

  // Test token stats query
  const tokenQuery = `
    WITH transfer_windows AS (
      -- Recent transfers (last hour, minute granularity)
      SELECT 
        DATE_TRUNC('minute', block_timestamp) as ts,
        COUNT(DISTINCT tx_id) as tx_count,
        SUM(CASE 
          WHEN amount > 0 AND amount < 1e12 
          THEN amount / POW(10, 6) -- USDC has 6 decimals
          ELSE 0 
        END) as volume
      FROM solana.core.fact_transfers
      WHERE block_timestamp >= DATEADD('hour', -1, CURRENT_TIMESTAMP())
      AND mint = '${mint}'
      AND (tx_to = '${address}' OR tx_from = '${address}')
      GROUP BY 1
      
      UNION ALL
      
      -- Historical transfers (last 24 hours, hour granularity)
      SELECT 
        DATE_TRUNC('hour', block_timestamp) as ts,
        COUNT(DISTINCT tx_id) as tx_count,
        SUM(CASE 
          WHEN amount > 0 AND amount < 1e12 
          THEN amount / POW(10, 6) -- USDC has 6 decimals
          ELSE 0 
        END) as volume
      FROM solana.core.fact_transfers
      WHERE block_timestamp >= DATEADD('hour', -24, CURRENT_TIMESTAMP())
      AND block_timestamp < DATEADD('hour', -1, CURRENT_TIMESTAMP())
      AND mint = '${mint}'
      AND (tx_to = '${address}' OR tx_from = '${address}')
      GROUP BY 1
    ),
    aggregated_stats AS (
      SELECT 
        SUM(tx_count) as total_tx_count,
        SUM(volume) as total_volume
      FROM transfer_windows
    )
    SELECT 
      '${mint}' as mint,
      COALESCE(total_tx_count, 0) as total_tx_count,
      COALESCE(total_volume, 0) as total_volume
    FROM aggregated_stats
  `.trim();

  console.log('\nTesting token stats query...');
  console.time('Token Query');
  try {
    const result = await queryFlipside(tokenQuery);
    console.timeEnd('Token Query');
    console.log('Result:', result);
  } catch (error) {
    console.log('Token query failed:', error);
  }
}

async function main() {
  console.log('Starting Flipside API tests...');
  
  try {
    await testQueries();
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\nAll tests completed');
}

// Run the tests
main().catch(console.error);

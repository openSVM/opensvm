/**
 * Test script for unified search functionality
 * 
 * This script tests all search sources and the unified search interface
 * to ensure they work correctly and return expected results.
 */

import { unifiedSearch } from '../lib/unified-search';
import { enrichSearchResultsWithMoralisData } from '../lib/moralis-api';
import { searchTelegramChats } from '../lib/telegram-search';
import { searchDuckDuckGo } from '../lib/duckduckgo-search';
import { searchXCom } from '../lib/xcom-search';

// Test queries
const TEST_QUERIES = [
  'Solana NFT',
  'DeFi staking',
  'SPL token',
  'transaction signature',
  'Solana wallet'
];

// Test function for Moralis API
async function testMoralisAPI() {
  console.log('Testing Moralis API integration...');
  
  try {
    // Mock search results to enrich
    const mockResults = [
      { address: 'So11111111111111111111111111111111111111112', type: 'token' },
      { address: 'kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs', type: 'account' }
    ];
    
    // Test enrichment function
    const enrichedResults = await enrichSearchResultsWithMoralisData('Solana', mockResults);
    
    console.log('Moralis API test results:');
    console.log(`- Enriched ${enrichedResults.length} results`);
    console.log('- Moralis data structure:', Object.keys(enrichedResults[0]?.moralisData || {}).join(', '));
    
    return true;
  } catch (error) {
    console.error('Moralis API test failed:', error);
    return false;
  }
}

// Test function for Telegram search
async function testTelegramSearch() {
  console.log('Testing Telegram search integration...');
  
  try {
    // Test with first query
    const results = await searchTelegramChats(TEST_QUERIES[0], 5);
    
    console.log('Telegram search test results:');
    console.log(`- Found ${results.length} results for "${TEST_QUERIES[0]}"`);
    console.log('- Result structure:', Object.keys(results[0] || {}).join(', '));
    
    return results.length > 0;
  } catch (error) {
    console.error('Telegram search test failed:', error);
    return false;
  }
}

// Test function for DuckDuckGo search
async function testDuckDuckGoSearch() {
  console.log('Testing DuckDuckGo search integration...');
  
  try {
    // Test with second query
    const results = await searchDuckDuckGo(TEST_QUERIES[1], 5);
    
    console.log('DuckDuckGo search test results:');
    console.log(`- Found ${results.length} results for "${TEST_QUERIES[1]}"`);
    console.log('- Result structure:', Object.keys(results[0] || {}).join(', '));
    
    return results.length > 0;
  } catch (error) {
    console.error('DuckDuckGo search test failed:', error);
    return false;
  }
}

// Test function for X.com search
async function testXComSearch() {
  console.log('Testing X.com search integration...');
  
  try {
    // Test with third query
    const results = await searchXCom(TEST_QUERIES[2], 5);
    
    console.log('X.com search test results:');
    console.log(`- Found ${results.length} results for "${TEST_QUERIES[2]}"`);
    console.log('- Result structure:', Object.keys(results[0] || {}).join(', '));
    
    return results.length > 0;
  } catch (error) {
    console.error('X.com search test failed:', error);
    return false;
  }
}

// Test function for unified search
async function testUnifiedSearch() {
  console.log('Testing unified search integration...');
  
  try {
    // Test with fourth query and all sources
    const results = await unifiedSearch(TEST_QUERIES[3], {
      sources: ['all'],
      limit: 5,
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
    
    console.log('Unified search test results:');
    console.log(`- Query: "${TEST_QUERIES[3]}"`);
    console.log(`- SVM results: ${results.sources.svm.length}`);
    console.log(`- Telegram results: ${results.sources.telegram.length}`);
    console.log(`- DuckDuckGo results: ${results.sources.duckduckgo.length}`);
    console.log(`- X.com results: ${results.sources.xcom.length}`);
    console.log(`- Combined results: ${results.combined.length}`);
    
    // Test with fifth query and specific sources
    const specificResults = await unifiedSearch(TEST_QUERIES[4], {
      sources: ['telegram', 'xcom'],
      limit: 3,
      sortBy: 'date',
      sortOrder: 'asc'
    });
    
    console.log('Specific sources search test results:');
    console.log(`- Query: "${TEST_QUERIES[4]}"`);
    console.log(`- Telegram results: ${specificResults.sources.telegram.length}`);
    console.log(`- X.com results: ${specificResults.sources.xcom.length}`);
    console.log(`- Combined results: ${specificResults.combined.length}`);
    
    return results.combined.length > 0 && specificResults.combined.length > 0;
  } catch (error) {
    console.error('Unified search test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting search functionality tests...');
  console.log('----------------------------------------');
  
  const testResults = {
    moralisAPI: await testMoralisAPI(),
    telegramSearch: await testTelegramSearch(),
    duckDuckGoSearch: await testDuckDuckGoSearch(),
    xComSearch: await testXComSearch(),
    unifiedSearch: await testUnifiedSearch()
  };
  
  console.log('----------------------------------------');
  console.log('Test Summary:');
  console.log(`- Moralis API: ${testResults.moralisAPI ? 'PASSED' : 'FAILED'}`);
  console.log(`- Telegram Search: ${testResults.telegramSearch ? 'PASSED' : 'FAILED'}`);
  console.log(`- DuckDuckGo Search: ${testResults.duckDuckGoSearch ? 'PASSED' : 'FAILED'}`);
  console.log(`- X.com Search: ${testResults.xComSearch ? 'PASSED' : 'FAILED'}`);
  console.log(`- Unified Search: ${testResults.unifiedSearch ? 'PASSED' : 'FAILED'}`);
  
  const overallResult = Object.values(testResults).every(result => result);
  console.log('----------------------------------------');
  console.log(`Overall Test Result: ${overallResult ? 'PASSED' : 'FAILED'}`);
  console.log('----------------------------------------');
  
  return overallResult;
}

// Execute tests
runAllTests()
  .then(result => {
    console.log(`Tests completed with ${result ? 'success' : 'failures'}.`);
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });

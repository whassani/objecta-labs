/**
 * Test script for Data Source Sync functionality
 * 
 * Usage:
 *   node test-data-source-sync.js
 * 
 * Prerequisites:
 *   - Backend server running on http://localhost:3000
 *   - Valid JWT token set in environment or hardcoded below
 *   - GitHub personal access token (for GitHub tests)
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

// Test data - Update these with your own values
const TEST_CONFIG = {
  github: {
    sourceType: 'github',
    name: 'Test GitHub Repository',
    description: 'Testing GitHub sync adapter',
    authType: 'api_key',
    credentials: {
      accessToken: process.env.GITHUB_TOKEN || 'ghp_YOUR_TOKEN_HERE',
    },
    config: {
      owner: 'octocat',  // Change to your username/org
      repo: 'Hello-World',  // Change to your repo
      branch: 'master',
      path: '',  // Empty for root
      fileExtensions: ['.md'],
    },
    syncFrequency: 'manual',
  },
  confluence: {
    sourceType: 'confluence',
    name: 'Test Confluence Space',
    description: 'Testing Confluence sync adapter',
    authType: 'api_key',
    credentials: {
      baseUrl: process.env.CONFLUENCE_URL || 'https://your-domain.atlassian.net',
      username: process.env.CONFLUENCE_USERNAME || 'your-email@example.com',
      apiToken: process.env.CONFLUENCE_API_TOKEN || 'YOUR_API_TOKEN',
    },
    config: {
      spaceKey: 'MYSPACE',
      includeArchived: false,
    },
    syncFrequency: 'manual',
  },
  notion: {
    sourceType: 'notion',
    name: 'Test Notion Workspace',
    description: 'Testing Notion sync adapter',
    authType: 'api_key',
    credentials: {
      integrationToken: process.env.NOTION_TOKEN || 'secret_YOUR_TOKEN',
    },
    config: {
      includeArchived: false,
    },
    syncFrequency: 'manual',
  },
};

// API Client
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Test Functions
async function testGetSupportedSources() {
  console.log('\n📋 Test: Get Supported Sources');
  console.log('='.repeat(50));
  
  try {
    const response = await api.get('/knowledge-base/sync/supported-sources');
    console.log('✅ Success!');
    console.log('Supported sources:', response.data.map(s => s.name).join(', '));
    console.log(`Total: ${response.data.length} adapters`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return [];
  }
}

async function testGetAdapterSchema(sourceType) {
  console.log(`\n📄 Test: Get ${sourceType} Schema`);
  console.log('='.repeat(50));
  
  try {
    const response = await api.get(`/knowledge-base/sync/adapters/${sourceType}/schema`);
    console.log('✅ Success!');
    console.log('Name:', response.data.name);
    console.log('Required Credentials:', response.data.requiredCredentials.join(', '));
    console.log('Config Schema:', JSON.stringify(response.data.configSchema, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testConnection(sourceType) {
  console.log(`\n🔌 Test: Connection to ${sourceType}`);
  console.log('='.repeat(50));
  
  const config = TEST_CONFIG[sourceType];
  if (!config) {
    console.log('⚠️  No test config for', sourceType);
    return false;
  }
  
  try {
    const response = await api.post('/knowledge-base/sync/test-connection', {
      sourceType: config.sourceType,
      credentials: config.credentials,
      config: config.config,
    });
    
    if (response.data.success) {
      console.log('✅ Connection successful!');
      return true;
    } else {
      console.log('❌ Connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateDataSource(sourceType) {
  console.log(`\n➕ Test: Create ${sourceType} Data Source`);
  console.log('='.repeat(50));
  
  const config = TEST_CONFIG[sourceType];
  if (!config) {
    console.log('⚠️  No test config for', sourceType);
    return null;
  }
  
  try {
    const response = await api.post('/knowledge-base/data-sources', config);
    console.log('✅ Data source created!');
    console.log('ID:', response.data.id);
    console.log('Name:', response.data.name);
    console.log('Status:', response.data.status);
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSyncDataSource(dataSourceId) {
  console.log(`\n🔄 Test: Sync Data Source ${dataSourceId}`);
  console.log('='.repeat(50));
  
  try {
    console.log('Starting sync... (this may take a minute)');
    const response = await api.post(`/knowledge-base/sync/data-sources/${dataSourceId}`);
    console.log('✅ Sync completed!');
    console.log('Results:');
    console.log('  - Processed:', response.data.documentsProcessed);
    console.log('  - Added:', response.data.documentsAdded);
    console.log('  - Updated:', response.data.documentsUpdated);
    console.log('  - Deleted:', response.data.documentsDeleted);
    
    if (response.data.errors.length > 0) {
      console.log('  - Errors:', response.data.errors.length);
      console.log('    Errors:', response.data.errors);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testListDataSources() {
  console.log('\n📚 Test: List Data Sources');
  console.log('='.repeat(50));
  
  try {
    const response = await api.get('/knowledge-base/data-sources');
    console.log('✅ Success!');
    console.log(`Found ${response.data.length} data sources:`);
    
    response.data.forEach(ds => {
      console.log(`\n  - ${ds.name} (${ds.sourceType})`);
      console.log(`    Status: ${ds.status}`);
      console.log(`    Last Synced: ${ds.lastSyncedAt || 'Never'}`);
      console.log(`    Enabled: ${ds.isEnabled}`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return [];
  }
}

async function testListDocuments() {
  console.log('\n📄 Test: List Documents');
  console.log('='.repeat(50));
  
  try {
    const response = await api.get('/knowledge-base/documents');
    console.log('✅ Success!');
    console.log(`Found ${response.data.length} documents`);
    
    // Show first 5 documents
    const preview = response.data.slice(0, 5);
    preview.forEach(doc => {
      console.log(`\n  - ${doc.title}`);
      console.log(`    Type: ${doc.contentType}`);
      console.log(`    Chunks: ${doc.chunkCount}`);
      console.log(`    Status: ${doc.processingStatus}`);
    });
    
    if (response.data.length > 5) {
      console.log(`\n  ... and ${response.data.length - 5} more`);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return [];
  }
}

async function testDeleteDataSource(dataSourceId) {
  console.log(`\n🗑️  Test: Delete Data Source ${dataSourceId}`);
  console.log('='.repeat(50));
  
  try {
    const response = await api.delete(`/knowledge-base/data-sources/${dataSourceId}`);
    console.log('✅ Data source deleted!');
    console.log('Documents processed:', response.data.documentsProcessed);
    console.log('Vectors deleted:', response.data.vectorsDeleted);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Main Test Runner
async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 Data Source Sync Test Suite');
  console.log('='.repeat(50));
  
  // Check JWT token
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.error('\n❌ Please set JWT_TOKEN environment variable or update the script');
    console.log('\nExample:');
    console.log('  export JWT_TOKEN="your-token-here"');
    console.log('  node test-data-source-sync.js');
    return;
  }
  
  // Test 1: Get supported sources
  const sources = await testGetSupportedSources();
  
  if (sources.length === 0) {
    console.error('\n❌ Cannot continue: No supported sources found');
    return;
  }
  
  // Test 2: Get schema for each source
  for (const source of sources) {
    await testGetAdapterSchema(source.type);
  }
  
  // Test 3: Test connections (skip if no valid config)
  console.log('\n' + '='.repeat(50));
  console.log('Testing Connections');
  console.log('='.repeat(50));
  
  const testSourceType = process.env.TEST_SOURCE || 'github';
  console.log(`\nTesting with: ${testSourceType}`);
  console.log('(Set TEST_SOURCE env var to test different source)');
  
  const connectionOk = await testConnection(testSourceType);
  
  if (!connectionOk) {
    console.log('\n⚠️  Connection test failed. Update credentials in TEST_CONFIG.');
    console.log('Skipping create/sync tests.');
    return;
  }
  
  // Test 4: Create data source
  const dataSource = await testCreateDataSource(testSourceType);
  
  if (!dataSource) {
    console.error('\n❌ Cannot continue: Failed to create data source');
    return;
  }
  
  // Test 5: List data sources
  await testListDataSources();
  
  // Test 6: Sync data source
  const syncResult = await testSyncDataSource(dataSource.id);
  
  if (!syncResult) {
    console.error('\n❌ Sync failed');
  }
  
  // Test 7: List documents
  await testListDocuments();
  
  // Test 8: Cleanup (optional)
  console.log('\n' + '='.repeat(50));
  console.log('Cleanup');
  console.log('='.repeat(50));
  
  const shouldCleanup = process.env.CLEANUP === 'true';
  
  if (shouldCleanup) {
    await testDeleteDataSource(dataSource.id);
  } else {
    console.log('\n⚠️  Skipping cleanup (set CLEANUP=true to auto-delete)');
    console.log(`\nTo manually delete: DELETE /knowledge-base/data-sources/${dataSource.id}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests Complete!');
  console.log('='.repeat(50));
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});

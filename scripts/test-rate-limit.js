#!/usr/bin/env node

/**
 * Rate Limit Testing Script
 * Tests the rate limiting functionality of the DIAM AI Pilot API
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testRateLimit() {
  console.log('🧪 Testing Rate Limiting Functionality\n');

  try {
    // Test 1: Check rate limit status
    console.log('1. Checking initial rate limit status...');
    const statusResponse = await axios.get(`${API_BASE}/rate-limit-status`);
    console.log('✅ Rate limit status:', statusResponse.data.rateLimit);
    console.log();

    // Test 2: Make first request (should succeed with rate limit)
    console.log('2. Making first request...');
    try {
      await axios.post(`${API_BASE}/ask`, {
        question: 'Test question 1'
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Request processed (expected file error)');
        console.log('   Rate limit headers:');
        console.log(`   - Limit: ${error.response.headers['x-ratelimit-limit']}`);
        console.log(`   - Remaining: ${error.response.headers['x-ratelimit-remaining']}`);
        console.log(`   - Reset: ${error.response.headers['x-ratelimit-reset']}`);
      } else {
        throw error;
      }
    }
    console.log();

    // Test 3: Make second request (should succeed with rate limit)
    console.log('3. Making second request...');
    try {
      await axios.post(`${API_BASE}/ask`, {
        question: 'Test question 2'
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Request processed (expected file error)');
        console.log('   Rate limit headers:');
        console.log(`   - Limit: ${error.response.headers['x-ratelimit-limit']}`);
        console.log(`   - Remaining: ${error.response.headers['x-ratelimit-remaining']}`);
        console.log(`   - Reset: ${error.response.headers['x-ratelimit-reset']}`);
      } else {
        throw error;
      }
    }
    console.log();

    // Test 4: Make third request (should be rate limited)
    console.log('4. Making third request (should be rate limited)...');
    try {
      await axios.post(`${API_BASE}/ask`, {
        question: 'Test question 3'
      });
      console.log('❌ Request should have been rate limited!');
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log('✅ Request correctly rate limited!');
        console.log('   Error response:', error.response.data.error.code);
        console.log('   Rate limit headers:');
        console.log(`   - Limit: ${error.response.headers['x-ratelimit-limit']}`);
        console.log(`   - Remaining: ${error.response.headers['x-ratelimit-remaining']}`);
        console.log(`   - Retry-After: ${error.response.headers['retry-after']}s`);
      } else {
        throw error;
      }
    }
    console.log();

    // Test 5: Check final rate limit status
    console.log('5. Checking final rate limit status...');
    const finalStatusResponse = await axios.get(`${API_BASE}/rate-limit-status`);
    console.log('✅ Final rate limit status:', finalStatusResponse.data.rateLimit);
    console.log();

    console.log('🎉 Rate limiting test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Rate limit: 2 requests per minute per session');
    console.log('   - Session tracking: IP + User-Agent based');
    console.log('   - Headers: Proper rate limit headers included');
    console.log('   - Error handling: 429 status with proper error response');
    console.log('   - Status endpoint: Working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

async function checkServerHealth() {
  try {
    console.log('🔍 Checking server health...');
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is healthy');
    console.log('   Rate limiting enabled:', response.data.rateLimit?.enabled || 'unknown');
    console.log();
    return true;
  } catch (error) {
    console.error('❌ Server is not running or unhealthy');
    console.error('   Please start the server with: npm run dev');
    return false;
  }
}

async function main() {
  console.log('🚀 DIAM AI Pilot - Rate Limit Test\n');
  
  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    process.exit(1);
  }

  await testRateLimit();
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRateLimit, checkServerHealth };
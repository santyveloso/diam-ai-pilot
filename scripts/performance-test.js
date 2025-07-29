#!/usr/bin/env node

/**
 * Performance testing script for DIAM AI Pilot
 * Tests the application with realistic file sizes and content
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_FILES_DIR = path.join(__dirname, 'test-files');

// Ensure test files directory exists
if (!fs.existsSync(TEST_FILES_DIR)) {
  fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
}

// Create test PDF files of different sizes
function createTestPDF(size, filename) {
  const sizeInBytes = size * 1024 * 1024; // Convert MB to bytes
  const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length ${sizeInBytes - 200}
>>
stream
BT
/F1 12 Tf
72 720 Td
(Performance Test Document - ${size}MB)
Tj
ET
${'A'.repeat(Math.max(0, sizeInBytes - 300))}
endstream
endobj
xref
0 5
0000000000 65535 f 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;

  const filePath = path.join(TEST_FILES_DIR, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Test function
async function testFileProcessing(filePath, question, expectedMaxTime) {
  const startTime = Date.now();
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('question', question);

    const response = await axios.post(`${API_BASE_URL}/api/ask`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 60000, // 60 second timeout
    });

    const duration = Date.now() - startTime;
    const fileSize = fs.statSync(filePath).size;

    console.log(`✅ File: ${path.basename(filePath)}`);
    console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Within expected time: ${duration <= expectedMaxTime ? 'Yes' : 'No'}`);
    
    if (duration > expectedMaxTime) {
      console.log(`   ⚠️  Warning: Processing took longer than expected (${expectedMaxTime}ms)`);
    }
    
    return {
      success: true,
      duration,
      fileSize,
      withinExpectedTime: duration <= expectedMaxTime
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ File: ${path.basename(filePath)}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Error: ${error.message}`);
    
    return {
      success: false,
      duration,
      error: error.message
    };
  }
}

// Health check
async function checkHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('🏥 Health Check:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return false;
  }
}

// Main test runner
async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests for DIAM AI Pilot\n');
  
  // Check if server is running
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    console.log('Server is not running. Please start the backend server first.');
    process.exit(1);
  }

  console.log('\n📁 Creating test files...');
  
  // Create test files of different sizes
  const testFiles = [
    { size: 0.5, filename: 'small-test.pdf', maxTime: 5000 },
    { size: 2, filename: 'medium-test.pdf', maxTime: 15000 },
    { size: 5, filename: 'large-test.pdf', maxTime: 25000 },
    { size: 8, filename: 'very-large-test.pdf', maxTime: 30000 },
  ];

  const createdFiles = [];
  for (const testFile of testFiles) {
    try {
      const filePath = createTestPDF(testFile.size, testFile.filename);
      createdFiles.push({ ...testFile, filePath });
      console.log(`   Created: ${testFile.filename} (${testFile.size}MB)`);
    } catch (error) {
      console.log(`   Failed to create ${testFile.filename}: ${error.message}`);
    }
  }

  console.log('\n🧪 Running performance tests...\n');

  const results = [];
  const questions = [
    'What is this document about?',
    'Summarize the main points of this document.',
    'What are the key topics covered?'
  ];

  for (const file of createdFiles) {
    const question = questions[Math.floor(Math.random() * questions.length)];
    const result = await testFileProcessing(file.filePath, question, file.maxTime);
    results.push({ ...file, ...result });
    console.log(''); // Empty line for readability
  }

  // Test file size limit
  console.log('🚫 Testing file size limit...');
  try {
    const oversizedFile = createTestPDF(12, 'oversized-test.pdf'); // 12MB - should be rejected
    const result = await testFileProcessing(oversizedFile, 'Test question', 5000);
    if (!result.success) {
      console.log('✅ File size limit working correctly\n');
    } else {
      console.log('⚠️  File size limit may not be working\n');
    }
  } catch (error) {
    console.log(`Error testing file size limit: ${error.message}\n`);
  }

  // Summary
  console.log('📊 Performance Test Summary:');
  console.log('================================');
  
  const successful = results.filter(r => r.success);
  const withinTime = results.filter(r => r.success && r.withinExpectedTime);
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Within expected time: ${withinTime.length}`);
  console.log(`Success rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`Average processing time: ${avgDuration.toFixed(0)}ms`);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test files...');
  for (const file of createdFiles) {
    try {
      fs.unlinkSync(file.filePath);
    } catch (error) {
      console.log(`Failed to delete ${file.filename}: ${error.message}`);
    }
  }

  // Clean up oversized test file
  try {
    fs.unlinkSync(path.join(TEST_FILES_DIR, 'oversized-test.pdf'));
  } catch (error) {
    // File might not exist, ignore
  }

  console.log('✅ Performance tests completed!');
}

// Run the tests
if (require.main === module) {
  runPerformanceTests().catch(error => {
    console.error('Performance test failed:', error);
    process.exit(1);
  });
}

module.exports = { runPerformanceTests };
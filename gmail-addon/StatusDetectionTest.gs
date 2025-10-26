/**
 * AI Status Detection Test Suite
 * 
 * This file contains comprehensive test functions for the AI-powered
 * job status detection system. Use these functions to test and validate
 * the status detection capabilities.
 */

/**
 * Test AI status detection with various email types
 * This function demonstrates the AI status detection with different scenarios
 */
function testAIStatusDetection() {
  console.log('🧪 Starting comprehensive AI status detection tests...');
  
  const testCases = [
    {
      name: 'Application Confirmation',
      email: {
        subject: 'Thank you for applying to Google',
        sender: 'noreply@google.com',
        htmlBody: 'Hi Prince, Thank you for applying to Google! We\'ve received your application for the Software Engineer position and will review it as quickly as we can.',
        company: 'Google',
        position: 'Software Engineer'
      },
      expectedStatus: 'applied'
    },
    {
      name: 'Interview Invitation',
      email: {
        subject: 'Interview Invitation - Microsoft',
        sender: 'recruiting@microsoft.com',
        htmlBody: 'Hi Prince, We would like to schedule an interview with you for the Software Engineer position at Microsoft. Please let us know your availability for next week.',
        company: 'Microsoft',
        position: 'Software Engineer'
      },
      expectedStatus: 'interview_scheduled'
    },
    {
      name: 'Job Offer',
      email: {
        subject: 'Job Offer - Amazon',
        sender: 'hr@amazon.com',
        htmlBody: 'Congratulations Prince! We are pleased to offer you the Software Engineer position at Amazon. Please review the attached offer letter and let us know your decision.',
        company: 'Amazon',
        position: 'Software Engineer'
      },
      expectedStatus: 'offer_received'
    },
    {
      name: 'Rejection Email',
      email: {
        subject: 'Application Update - Facebook',
        sender: 'noreply@facebook.com',
        htmlBody: 'Hi Prince, Thank you for your interest in Facebook. Unfortunately, we have decided to go with another candidate for the Software Engineer position. We wish you the best in your job search.',
        company: 'Facebook',
        position: 'Software Engineer'
      },
      expectedStatus: 'rejected'
    },
    {
      name: 'Interview Follow-up',
      email: {
        subject: 'Interview Feedback - Netflix',
        sender: 'talent@netflix.com',
        htmlBody: 'Hi Prince, Thank you for your time during the interview. We were impressed with your technical skills. We will be in touch soon with next steps.',
        company: 'Netflix',
        position: 'Software Engineer'
      },
      expectedStatus: 'interview_completed'
    },
    {
      name: 'Non-Job Related Email',
      email: {
        subject: 'Your Amazon Order',
        sender: 'orders@amazon.com',
        htmlBody: 'Your order #12345 has been shipped and will arrive tomorrow.',
        company: 'Amazon',
        position: 'Customer'
      },
      expectedStatus: 'not_job_related'
    }
  ];
  
  const results = [];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test Case ${index + 1}: ${testCase.name} ---`);
    
    try {
      const result = detectJobApplicationStatus(
        testCase.email.htmlBody,
        testCase.email.subject,
        testCase.email.sender,
        testCase.email.company,
        testCase.email.position
      );
      
      console.log('Result:', result);
      
      const testResult = {
        testCase: testCase.name,
        expected: testCase.expectedStatus,
        actual: result.status,
        confidence: result.confidence,
        isJobRelated: result.isJobRelated,
        urgency: result.urgency,
        method: result.method,
        passed: result.status === testCase.expectedStatus,
        indicators: result.indicators,
        reasoning: result.reasoning
      };
      
      results.push(testResult);
      
      console.log(`✅ Test ${testCase.name}: ${testResult.passed ? 'PASSED' : 'FAILED'}`);
      if (!testResult.passed) {
        console.log(`   Expected: ${testCase.expectedStatus}, Got: ${result.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Test ${testCase.name} failed with error:`, error.message);
      results.push({
        testCase: testCase.name,
        error: error.message,
        passed: false
      });
    }
  });
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);
  
  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ ${result.testCase}: ${result.actual} (${result.confidence}% confidence)`);
    } else if (result.error) {
      console.log(`❌ ${result.testCase}: ERROR - ${result.error}`);
    } else {
      console.log(`❌ ${result.testCase}: Expected ${result.expected}, got ${result.actual}`);
    }
  });
  
  return {
    summary: { passed, total, successRate: (passed / total) * 100 },
    results: results
  };
}

/**
 * Test OpenAI API key status and functionality
 */
function testOpenAIStatus() {
  console.log('🔑 Testing OpenAI API key status...');
  
  const status = getOpenAIAPIKeyStatus();
  console.log('OpenAI Status:', status);
  
  if (status.hasKey && status.valid) {
    console.log('✅ OpenAI API key is valid and ready');
    
    // Test a simple AI call
    try {
      const testResult = detectJobApplicationStatus(
        'Thank you for applying to our company!',
        'Application Received',
        'hr@company.com',
        'Test Company',
        'Software Engineer'
      );
      
      console.log('✅ AI detection test successful:', testResult);
      return { status: 'ready', testResult: testResult };
      
    } catch (error) {
      console.log('❌ AI detection test failed:', error.message);
      return { status: 'error', error: error.message };
    }
    
  } else {
    console.log('⚠️ OpenAI API key not available or invalid');
    return { status: 'not_ready', message: status.message };
  }
}

/**
 * Test fallback status detection (when AI is not available)
 */
function testFallbackStatusDetection() {
  console.log('🔄 Testing fallback status detection...');
  
  const testEmails = [
    {
      subject: 'Thank you for applying to Tesla',
      body: 'We have received your application for the Software Engineer position.',
      expected: 'applied'
    },
    {
      subject: 'Interview Invitation',
      body: 'We would like to schedule an interview with you.',
      expected: 'interview_scheduled'
    },
    {
      subject: 'Job Offer',
      body: 'Congratulations! We are pleased to offer you the position.',
      expected: 'offer_received'
    },
    {
      subject: 'Application Update',
      body: 'Unfortunately, we have decided to go with another candidate.',
      expected: 'rejected'
    }
  ];
  
  const results = testEmails.map(email => {
    const result = fallbackStatusDetection(
      email.body,
      email.subject,
      'test@company.com',
      'Test Company',
      'Software Engineer'
    );
    
    return {
      subject: email.subject,
      expected: email.expected,
      actual: result.status,
      confidence: result.confidence,
      passed: result.status === email.expected
    };
  });
  
  console.log('Fallback detection results:', results);
  return results;
}

/**
 * Performance test for status detection
 */
function testStatusDetectionPerformance() {
  console.log('⚡ Testing status detection performance...');
  
  const testEmail = {
    subject: 'Thank you for applying to Google',
    sender: 'noreply@google.com',
    htmlBody: 'Hi Prince, Thank you for applying to Google! We\'ve received your application for the Software Engineer position.',
    company: 'Google',
    position: 'Software Engineer'
  };
  
  const iterations = 5;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = new Date().getTime();
    
    try {
      detectJobApplicationStatus(
        testEmail.htmlBody,
        testEmail.subject,
        testEmail.sender,
        testEmail.company,
        testEmail.position
      );
      
      const endTime = new Date().getTime();
      const duration = endTime - startTime;
      times.push(duration);
      
      console.log(`Iteration ${i + 1}: ${duration}ms`);
      
    } catch (error) {
      console.log(`Iteration ${i + 1} failed:`, error.message);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`📊 Performance Results:`);
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
    
    return {
      average: avgTime,
      min: minTime,
      max: maxTime,
      times: times
    };
  }
  
  return null;
}

/**
 * Comprehensive test suite runner
 * Run all tests and generate a detailed report
 */
function runComprehensiveStatusDetectionTests() {
  console.log('🚀 Starting comprehensive status detection test suite...');
  
  const report = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test 1: OpenAI Status
  console.log('\n=== Test 1: OpenAI API Status ===');
  report.tests.openaiStatus = testOpenAIStatus();
  
  // Test 2: AI Status Detection
  console.log('\n=== Test 2: AI Status Detection ===');
  report.tests.aiDetection = testAIStatusDetection();
  
  // Test 3: Fallback Detection
  console.log('\n=== Test 3: Fallback Status Detection ===');
  report.tests.fallbackDetection = testFallbackStatusDetection();
  
  // Test 4: Performance
  console.log('\n=== Test 4: Performance Test ===');
  report.tests.performance = testStatusDetectionPerformance();
  
  // Test 5: System Stats
  console.log('\n=== Test 5: System Statistics ===');
  report.tests.systemStats = getStatusDetectionStats();
  
  console.log('\n📋 Comprehensive Test Report:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}



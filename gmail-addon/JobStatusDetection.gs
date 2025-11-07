function buildNotJobRelatedResult(reason) {
  return {
    status: 'not_job_related',
    confidence: 30,
    indicators: [reason],
    reasoning: reason,
    isJobRelated: false,
    urgency: 'low',
    method: 'Job_Listings_Filter',
    details: {
      fallback: true,
      analysisType: 'job_status_detection'
    }
  };
}

function isJobListingEmail(text, subject, sender) {
  const senderLower = (sender || '').toLowerCase();
  const subjectLower = (subject || '').toLowerCase();

  const explicitApplicationPhrases = [
    'thank you for applying',
    'we have received your application',
    'application received',
    'update on your application',
    'application status',
    'reviewing your application'
  ];

  if (explicitApplicationPhrases.some(phrase => text.includes(phrase))) {
    return false;
  }

  const jobAlertIndicators = [
    'job alert',
    'new jobs',
    'jobs posted',
    'job matches',
    'matched the following jobs',
    'top jobs',
    'job board',
    'career news',
    'job opportunities',
    'job newsletter'
  ];

  const aggregatorDomains = [
    'jobs2web',
    'lensa.com',
    'noreply.jobs',
    'huntingtoningalls',
    'jobvite',
    'lever.co',
    'greenhouse.io',
    'smartrecruiters'
  ];

  const hasAlertPhrase = jobAlertIndicators.some(indicator => text.includes(indicator));
  const isAggregatorSender = aggregatorDomains.some(domain => senderLower.includes(domain));
  const hasManyLinks = (text.match(/https?:\/\//g) || []).length >= 5;

  return (
    (hasAlertPhrase && (isAggregatorSender || hasManyLinks)) ||
    (hasAlertPhrase && senderLower.includes('jobs2web')) ||
    (hasManyLinks && senderLower.includes('jobs2web'))
  );
}

function normalizeStatusForJobListings(result, htmlBody, subject, sender) {
  const text = (subject + ' ' + htmlBody).toLowerCase();
  if (result.isJobRelated === false) {
    return result;
  }
  
  // CRITICAL: Don't filter out emails that contain rejection/interview/offer phrases
  // These are legitimate job application emails, not job listings
  const jobApplicationPhrases = [
    'decided to pursue other candidates',
    'decided to move forward with other candidates',
    'not selected',
    'unfortunately',
    'we have reviewed your resume',
    'interview',
    'offer',
    'congratulations',
    'thank you for applying',
    'application received',
    'we have received your application'
  ];
  
  const hasJobApplicationPhrase = jobApplicationPhrases.some(phrase => text.includes(phrase));
  
  // If it contains job application phrases, it's definitely job-related
  if (hasJobApplicationPhrase) {
    return result;
  }
  
  // Only filter as job listing if it doesn't have application phrases
  if (isJobListingEmail(text, subject, sender)) {
    return buildNotJobRelatedResult('Detected job newsletter/broadcast email');
  }
  return result;
}
/**
 * AI-Powered Job Status Detection System
 * 
 * This file contains advanced AI-powered email analysis to detect job application
 * status updates using OpenAI GPT. It can automatically categorize emails into
 * different job application statuses like rejection, interview, offer, etc.
 * 
 * Features:
 * - OpenAI GPT-3.5-turbo integration for intelligent status detection
 * - Comprehensive status categorization
 * - High accuracy email analysis
 * - Automatic status updates to backend
 * - Robust error handling and fallbacks
 */

/**
 * AI-Powered Job Status Detection using OpenAI GPT
 * 
 * @param {string} htmlBody - Email HTML content
 * @param {string} subject - Email subject
 * @param {string} sender - Email sender
 * @param {string} company - Company name (if known)
 * @param {string} position - Position title (if known)
 * @return {Object} Detected job status with confidence and details
 */
function detectJobStatusWithAI(htmlBody, subject, sender, company = null, position = null) {
  console.log('🤖 Starting AI-powered job status detection...');
  
  try {
    // Get OpenAI API key from user properties
    const userProperties = PropertiesService.getUserProperties();
    const apiKey = userProperties.getProperty('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.log('⚠️ No OpenAI API key found, using fallback status detection');
      return fallbackStatusDetection(htmlBody, subject, sender, company, position);
    }
    
    // Test API key validity first
    if (!testOpenAIAPIKey(apiKey)) {
      console.log('⚠️ OpenAI API key invalid, using fallback status detection');
      return fallbackStatusDetection(htmlBody, subject, sender, company, position);
    }
    
    // Prepare context for AI analysis
    const context = {
      subject: subject,
      sender: sender,
      company: company || 'Unknown',
      position: position || 'Unknown',
      emailContent: htmlBody
    };
    
    // Make OpenAI API call with enhanced prompt for status detection
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert job application status analyzer. Your task is to analyze emails and determine the job application status.

Available statuses:
- applied: Initial application confirmation ("thank you for applying", "application received")
- interview_scheduled: Interview invitation ("we'd like to schedule", "next steps", "interview")
- interview_completed: Post-interview follow-up ("thank you for your time", "interview went well")
- offer_received: Job offer or acceptance ("congratulations", "we are pleased to offer", "job offer")
- rejected: Rejection or not selected ("we have decided to pursue another candidate", "not selected", "unfortunately", "not moving forward")
- withdrawn: Application withdrawn

CRITICAL: Look for rejection phrases like:
- "we have decided to pursue another candidate"
- "not selected" 
- "unfortunately"
- "not moving forward"
- "decided to go with another candidate"
- "not the right fit"
- "not chosen"

Analyze the email content and determine:
1. The most likely job application status
2. Confidence level (0-100)
3. Key indicators that led to this conclusion
4. Any additional context or notes

Return ONLY a JSON object with these fields:
{
  "status": "one of the statuses above",
  "confidence": number between 0-100,
  "indicators": ["list of key phrases or indicators"],
  "reasoning": "brief explanation of the decision",
  "isJobRelated": boolean,
  "urgency": "low|medium|high"
}`
          },
          {
            role: 'user',
            content: `Analyze this job application email:

Subject: ${context.subject}
From: ${context.sender}
Company: ${context.company}
Position: ${context.position}

Email Content:
${context.emailContent}

Determine the job application status and provide detailed analysis.`
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      }),
      muteHttpExceptions: true
    });
    
    const responseData = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      console.log('❌ OpenAI API error:', responseData.error?.message);
      return fallbackStatusDetection(htmlBody, subject, sender, company, position);
    }
    
    // Parse AI response
    const aiContent = responseData.choices[0].message.content;
    const parsed = JSON.parse(aiContent);
    
    console.log('✅ AI status detection successful:', parsed);

    const aiResult = {
      status: parsed.status || 'applied',
      confidence: parsed.confidence || 85,
      indicators: parsed.indicators || [],
      reasoning: parsed.reasoning || 'AI analysis completed',
      isJobRelated: parsed.isJobRelated !== false,
      urgency: parsed.urgency || 'medium',
      method: 'OpenAI_AI_Detection',
      details: {
        aiResponse: aiContent,
        fallback: false,
        analysisType: 'job_status_detection'
      }
    };

    return normalizeStatusForJobListings(aiResult, htmlBody, subject, sender);
    
  } catch (error) {
    console.log('❌ AI status detection failed:', error.message);
    return fallbackStatusDetection(htmlBody, subject, sender, company, position);
  }
}

/**
 * Fallback status detection using pattern matching
 * Used when AI is unavailable or fails
 */
function fallbackStatusDetection(htmlBody, subject, sender, company = null, position = null) {
  console.log('🔄 Using fallback status detection...');
  
  const text = (subject + ' ' + htmlBody).toLowerCase();

  if (isJobListingEmail(text, subject, sender)) {
    return buildNotJobRelatedResult('Detected job newsletter/broadcast email');
  }
  
  // Define status patterns with confidence levels
  const statusPatterns = {
    'rejected': {
      patterns: [
        'we have decided to move forward with other candidates', // EXACT PHRASE - highest priority
        'decided to move forward with other candidates',
        'move forward with other candidates',
        'moved forward with other candidates',
        'we have decided to pursue other candidates', // EXACT PHRASE from Martin Marietta email
        'decided to pursue other candidates',
        'pursue other candidates',
        'pursued other candidates',
        'not selected', 'unfortunately', 'not moving forward', 'not a good fit',
        'decided to go with another candidate', 'not chosen', 'rejection',
        'not proceed', 'not advance', 'not selected for', 'not move forward',
        'not the right fit', 'not move to the next stage', 'not advance to',
        'not selected to continue', 'not selected for the next round',
        'we have decided to pursue another candidate', 'decided to pursue another',
        'pursue another candidate', 'another candidate',
        'not advance to the next stage',
        'better match the qualifications', // Often appears with rejections
        'we have reviewed your resume and have carefully considered', // Martin Marietta pattern
        'decided to pursue other candidates for this position' // Full Martin Marietta phrase
      ],
      confidence: 95
    },
    'interview_scheduled': {
      patterns: [
        'interview', 'schedule an interview', 'next steps', 'phone screen',
        'video interview', 'technical interview', 'onsite interview',
        'interview process', 'interviewing', 'interview call', 'interview round',
        'first round', 'second round', 'final round', 'panel interview'
      ],
      confidence: 85
    },
    'offer_received': {
      patterns: [
        'offer', 'congratulations', 'we are pleased to offer', 'job offer',
        'employment offer', 'we would like to offer', 'offer letter',
        'welcome to the team', 'excited to have you join', 'offer you the position'
      ],
      confidence: 95
    },
    'interview_completed': {
      patterns: [
        'thank you for your time', 'interview went well', 'next steps',
        'we will be in touch', 'decision will be made', 'interview feedback',
        'interview process', 'candidate evaluation'
      ],
      confidence: 80
    },
    'applied': {
      patterns: [
        'thank you for applying', 'application received', 'we have received your application',
        'application submitted', 'application confirmation', 'thank you for your interest'
      ],
      confidence: 85
    }
  };
  
  // Check for job-related content first
  const jobRelatedKeywords = [
    'job', 'application', 'career', 'position', 'role', 'employment',
    'hiring', 'recruitment', 'candidate', 'interview', 'offer'
  ];
  
  const isJobRelated = jobRelatedKeywords.some(keyword => text.includes(keyword));
  
  if (!isJobRelated) {
    return buildNotJobRelatedResult('No job-related keywords detected');
  }
  
  // Check each status pattern
  let bestMatch = { status: 'applied', confidence: 50 };
  
  for (const [status, config] of Object.entries(statusPatterns)) {
    const matchedPatterns = config.patterns.filter(pattern => text.includes(pattern));
    
    if (matchedPatterns.length > 0) {
      const confidence = Math.min(config.confidence + (matchedPatterns.length * 5), 95);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          status: status,
          confidence: confidence,
          indicators: matchedPatterns,
          reasoning: `Matched ${matchedPatterns.length} patterns: ${matchedPatterns.join(', ')}`
        };
      }
    }
  }
  
  // Determine urgency based on status
  let urgency = 'medium';
  if (bestMatch.status === 'offer_received') urgency = 'high';
  else if (bestMatch.status === 'rejected') urgency = 'low';
  else if (bestMatch.status === 'interview_scheduled') urgency = 'high';
  
  const fallbackResult = {
    status: bestMatch.status,
    confidence: bestMatch.confidence,
    indicators: bestMatch.indicators || [],
    reasoning: bestMatch.reasoning || 'Pattern matching analysis',
    isJobRelated: true,
    urgency: urgency,
    method: 'Fallback_Pattern_Matching',
    details: {
      fallback: true,
      analysisType: 'job_status_detection'
    }
  };

  return normalizeStatusForJobListings(fallbackResult, htmlBody, subject, sender);
}

/**
 * Enhanced job status detection with company and position context
 * This is the main function that should be called from the Gmail add-on
 */
function detectJobApplicationStatus(htmlBody, subject, sender, company = null, position = null) {
  console.log('🎯 Starting enhanced job status detection...');
  console.log(`Company: ${company || 'Unknown'}, Position: ${position || 'Unknown'}`);
  
  try {
    // Try AI detection first
    const aiResult = detectJobStatusWithAI(htmlBody, subject, sender, company, position);
    
    // If AI detection was successful (not fallback), return it
    if (aiResult.method === 'OpenAI_AI_Detection') {
      console.log('✅ AI status detection successful');
      return aiResult;
    }
    
    // Otherwise, use enhanced fallback
    console.log('🔄 Using enhanced fallback status detection...');
    return fallbackStatusDetection(htmlBody, subject, sender, company, position);
    
  } catch (error) {
    console.log('❌ Error in job status detection:', error.message);
    return fallbackStatusDetection(htmlBody, subject, sender, company, position);
  }
}

/**
 * Test function for job status detection
 * Call this function to test the status detection system
 */
function testJobStatusDetection() {
  const testEmails = [
    {
      subject: "Thank you for applying to Google",
      sender: "noreply@google.com",
      htmlBody: "Hi Prince, Thank you for applying to Google! We've received your application for the Software Engineer position and will review it as quickly as we can.",
      company: "Google",
      position: "Software Engineer"
    },
    {
      subject: "Interview Invitation - Microsoft",
      sender: "recruiting@microsoft.com",
      htmlBody: "Hi Prince, We would like to schedule an interview with you for the Software Engineer position at Microsoft. Please let us know your availability.",
      company: "Microsoft",
      position: "Software Engineer"
    },
    {
      subject: "Job Offer - Amazon",
      sender: "hr@amazon.com",
      htmlBody: "Congratulations Prince! We are pleased to offer you the Software Engineer position at Amazon. Please review the attached offer letter.",
      company: "Amazon",
      position: "Software Engineer"
    },
    {
      subject: "Application Update - Facebook",
      sender: "noreply@facebook.com",
      htmlBody: "Hi Prince, Thank you for your interest in Facebook. Unfortunately, we have decided to go with another candidate for the Software Engineer position.",
      company: "Facebook",
      position: "Software Engineer"
    }
  ];
  
  console.log('🧪 Testing job status detection with sample emails...');
  
  const results = testEmails.map((email, index) => {
    console.log(`\n--- Test Email ${index + 1} ---`);
    const result = detectJobApplicationStatus(
      email.htmlBody,
      email.subject,
      email.sender,
      email.company,
      email.position
    );
    console.log(`Result:`, result);
    return result;
  });
  
  return results;
}

/**
 * Get status detection statistics
 * Returns information about the detection system performance
 */
function getStatusDetectionStats() {
  const userProperties = PropertiesService.getUserProperties();
  const apiKey = userProperties.getProperty('OPENAI_API_KEY');
  
  return {
    aiAvailable: !!apiKey && testOpenAIAPIKey(apiKey),
    fallbackAvailable: true,
    supportedStatuses: [
      'applied', 'interview_scheduled', 'interview_completed', 
      'offer_received', 'rejected', 'withdrawn'
    ],
    lastTest: new Date().toISOString()
  };
}


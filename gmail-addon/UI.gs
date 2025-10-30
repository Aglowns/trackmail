/**
 * CardService UI Components
 * 
 * This file contains all the UI building functions for the Gmail Add-on.
 * Uses CardService to create interactive cards that display in Gmail's sidebar.
 */

/**
 * Build the sign-in card shown when user is not authenticated.
 * 
 * @return {Card} Sign-in card
 */
function buildSignInCard() {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Track job applications from Gmail')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>Welcome to TrackMail!</b><br><br>Automatically track job application emails and manage your job search from Gmail.')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('Click the button below to get started - no additional setup required!')
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('🚀 Get Started')
            .setBackgroundColor('#667eea')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('openTokenPageAction')
            )
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>TrackMail will connect automatically and start working with your Gmail.</i></font>')
        )
    )
    .build();
  
  return card;
}

/**
 * Build the main tracking card for an authenticated user.
 * 
 * @param {string} messageId - Gmail message ID
 * @param {string} accessToken - Gmail API access token
 * @return {Card} Tracking card
 */
function buildTrackingCard(messageId, accessToken) {
  const userEmail = getUserEmail() || 'Unknown user';
  
  // Fetch basic email data for preview (lightweight)
  let emailPreview = '';
  let sender = '';
  let subject = '';
  let date = '';
  let parsingResults = null;
  let isJobRelated = true;
  
  try {
    console.log('Fetching email data for preview...');
    const emailData = fetchEmailData(messageId, accessToken);
    
    if (!emailData) {
      throw new Error('No email data returned');
    }
    
    console.log('Email data fetched:', {
      has_sender: !!emailData.sender,
      has_subject: !!emailData.subject,
      has_html_body: !!emailData.html_body
    });
    
    sender = emailData.sender || 'Unknown';
    subject = emailData.subject || 'No Subject';
    
    // Parse date
    if (emailData.received_at) {
      try {
        date = new Date(emailData.received_at).toLocaleDateString();
      } catch (e) {
        date = emailData.received_at;
      }
    }
    
    // Use advanced AI parsing for accurate classification
    console.log('Starting advanced AI parsing...');
    try {
      // Try ultra-accurate parsing first (with OpenAI)
      parsingResults = ultraAccurateEmailParsing(emailData.html_body || '', subject, emailData.sender || '');
      console.log('Advanced parsing results:', parsingResults);
    } catch (parseError) {
      console.error('Advanced parsing failed, using fallback:', parseError);
      // Fallback to quick parsing
      try {
        parsingResults = quickEmailParsing(emailData.html_body || '', subject, emailData.sender || '');
        console.log('Fallback parsing results:', parsingResults);
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        parsingResults = {
          company: 'Unknown Company',
          position: 'Unknown Position',
          emailType: 'unknown',
          isJobRelated: true,
          jobUrl: null
        };
      }
    }
    
    // Extract data from parsing results
    const companyName = parsingResults.company || 'Unknown Company';
    const jobPosition = parsingResults.position || 'Unknown Position';
    const emailType = parsingResults.emailType || 'unknown';
    jobUrl = normalizeJobUrl(
      parsingResults.jobUrl || parsingResults.job_url || parsingResults.jobURL
    );
    isJobRelated = parsingResults.isJobRelated !== false && emailType !== 'not_job_related';
    
    // Build email preview with accurate classification
    let emailTypeIcon = '📧';
    let emailTypeText = 'Job Application';
    
    // Check for rejection first (highest priority)
    if (!isJobRelated || emailType === 'not_job_related') {
      emailTypeIcon = '📰';
      emailTypeText = 'Not Job Related';
    } else if (emailType === 'rejected' || emailType === 'rejection') {
      emailTypeIcon = '❌';
      emailTypeText = 'Rejection';
    } else if (emailType === 'interview_scheduled' || emailType === 'interview') {
      emailTypeIcon = '📞';
      emailTypeText = 'Interview Scheduled';
    } else if (emailType === 'offer_received' || emailType === 'offer') {
      emailTypeIcon = '🎉';
      emailTypeText = 'Job Offer';
    } else if (emailType === 'applied' || emailType === 'new_application') {
      emailTypeIcon = '✅';
      emailTypeText = 'Application Confirmation';
    } else if (emailType === 'follow_up') {
      emailTypeIcon = '📞';
      emailTypeText = 'Follow-up';
    }
    
    emailPreview = '<b>' + emailTypeIcon + ' Type:</b> ' + emailTypeText + '<br>' +
                   '<b>Company:</b> ' + (isJobRelated ? companyName : 'N/A') + '<br>' +
                   '<b>Position:</b> ' + (isJobRelated ? jobPosition : 'N/A') + '<br>' +
                   (jobUrl && isJobRelated
                      ? ('<b>Job Link:</b> <a href="' + jobUrl + '" target="_blank">Open Posting</a><br>')
                      : ''
                   ) +
                   '<b>From:</b> ' + sender + '<br>' +
                   '<b>Subject:</b> ' + subject + '<br>' +
                   (isJobRelated
                      ? '<font color="#6b7280"><i>Click "Track This Application" or "Test Parsing" for detailed analysis</i></font>'
                      : '<font color="#6b7280"><i>This email does not appear to be job-related.</i></font>'
                   );
  } catch (error) {
    console.error('Error fetching email preview:', error);
    
    // Fallback: try to get basic email info without complex parsing
    try {
      const message = GmailApp.getMessageById(messageId);
      if (message) {
        const basicSender = message.getFrom() || 'Unknown';
        const basicSubject = message.getSubject() || 'No Subject';
        
        emailPreview = '<b>📧 Type:</b> Job Application<br>' +
                       '<b>Company:</b> Unknown Company<br>' +
                       '<b>Position:</b> Unknown Position<br>' +
                       '<b>From:</b> ' + basicSender + '<br>' +
                       '<b>Subject:</b> ' + basicSubject + '<br>' +
                       '<font color="#6b7280"><i>Preview parsing failed - click buttons below for full analysis</i></font>';
      } else {
        throw new Error('Cannot access email message');
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      emailPreview = '<font color="#991b1b">Error loading email preview</font><br>' +
                     '<font color="#6b7280"><i>Error: ' + error.message + '</i></font><br>' +
                     '<font color="#6b7280"><i>This is normal for the first time - try the buttons below to test functionality.</i></font>';
    }
  }
  
  const actionsSection = CardService.newCardSection().setHeader('Actions');

  if (isJobRelated) {
    actionsSection
      .addWidget(
        CardService.newTextButton()
          .setText('📌 Track This Application')
          .setBackgroundColor('#667eea')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('trackApplicationAction')
              .setParameters({
                'messageId': messageId,
                'accessToken': accessToken
              })
          )
      )
      .addWidget(
        CardService.newTextButton()
          .setText('🔍 Test Parsing')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('testParsingAction')
              .setParameters({
                'messageId': messageId,
                'accessToken': accessToken
              })
          )
      );
  } else {
    actionsSection
      .addWidget(
        CardService.newTextParagraph()
          .setText('<font color="#1f2937"><b>This email is not related to a job application.</b></font><br>' +
                   '<font color="#4b5563">No further action is needed.</font>')
      )
      .addWidget(
        CardService.newTextButton()
          .setText('🔄 Refresh')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onGmailMessageOpen')
          )
      );
  }

  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Signed in as: ' + userEmail)
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Email Preview')
        .addWidget(
          CardService.newTextParagraph()
            .setText(emailPreview)
        )
    )
    .addSection(actionsSection)
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Sign Out')
            .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('signOutAction')
            )
        )
    )
    .build();
  
  return card;
}

/**
 * Build success card after successful application tracking.
 * 
 * @param {Object} result - Ingestion result from backend
 * @return {Card} Success card
 */
function buildSuccessCard(result) {
  console.log('Building success card with result:', JSON.stringify(result));
  
  let message = '✅ Application tracked successfully!';
  
  if (result && result.duplicate) {
    message = '✅ This email was already tracked.';
  }
  
  let detailText = '';
  if (result && result.message) {
    detailText = result.message;
  }
  if (result && result.application_id) {
    detailText += '<br><br><font color="#6b7280"><i>Application ID: ' + result.application_id + '</i></font>';
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Success!')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>' + message + '</b>')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText(detailText)
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('← Back')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('onGmailMessageOpen')
            )
        )
    )
    .build();
  
  return card;
}

/**
 * Build error card when something goes wrong.
 * 
 * @param {string} errorMessage - Error message to display
 * @return {Card} Error card
 */
function buildErrorCard(errorMessage) {
  // Determine error type and provide appropriate guidance
  let errorType = 'Error';
  let guidanceText = '';
  let showRetryButton = false;
  
  if (errorMessage.includes('Authentication') || errorMessage.includes('sign in')) {
    errorType = 'Authentication Error';
    guidanceText = 'Please sign in again to continue using TrackMail.';
  } else if (errorMessage.includes('Backend service unavailable') || errorMessage.includes('502')) {
    errorType = 'Service Unavailable';
    guidanceText = 'Our servers are temporarily unavailable. Please try again in a few minutes.';
    showRetryButton = true;
  } else if (errorMessage.includes('Unable to connect') || errorMessage.includes('internet connection')) {
    errorType = 'Connection Error';
    guidanceText = 'Please check your internet connection and try again.';
    showRetryButton = true;
  } else if (errorMessage.includes('Too many requests')) {
    errorType = 'Rate Limited';
    guidanceText = 'Please wait a moment before trying again.';
    showRetryButton = true;
  } else if (errorMessage.includes('Validation error')) {
    errorType = 'Invalid Data';
    guidanceText = 'The email data could not be processed. Please try with a different email.';
  } else {
    errorType = 'Unexpected Error';
    guidanceText = 'An unexpected error occurred. Please try again or contact support if the issue persists.';
    showRetryButton = true;
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle(errorType)
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>⚠️ ' + errorType + '</b>')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#991b1b">' + errorMessage + '</font>')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>' + guidanceText + '</i></font>')
        )
    );
  
  // Add retry button if appropriate
  if (showRetryButton) {
    card.addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('🔄 Try Again')
            .setBackgroundColor('#667eea')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('onGmailMessageOpen')
            )
        )
    );
  }
  
  // Add back button
  card.addSection(
    CardService.newCardSection()
      .addWidget(
        CardService.newTextButton()
          .setText('← Back')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onGmailMessageOpen')
          )
      )
  );
  
  return card.build();
}

/**
 * Build test results card after testing email parsing.
 * 
 * @param {Object} result - Test result from backend
 * @return {Card} Test results card
 */
function buildTestResultsCard(result) {
  let resultsText = '';
  
  // Check if we have a successful result
  if (result.success !== false && (result.parsed || result.company || result.position)) {
    const parsed = result.parsed || result;
    
    // Format email type for display
    let emailTypeDisplay = parsed.emailType || parsed.status || '<i>Not found</i>';
    if (emailTypeDisplay === 'rejected') {
      emailTypeDisplay = '❌ Rejection';
    } else if (emailTypeDisplay === 'interview_scheduled') {
      emailTypeDisplay = '📞 Interview Scheduled';
    } else if (emailTypeDisplay === 'offer_received') {
      emailTypeDisplay = '🎉 Job Offer';
    } else if (emailTypeDisplay === 'applied') {
      emailTypeDisplay = '✅ Application Confirmation';
    } else if (emailTypeDisplay === 'follow_up') {
      emailTypeDisplay = '📞 Follow-up';
    }
    
    resultsText = '<b>✅ Parsing Results:</b><br><br>' +
                  '<b>Company:</b> ' + (parsed.company || '<i>Not found</i>') + '<br>' +
                  '<b>Position:</b> ' + (parsed.position || '<i>Not found</i>') + '<br>' +
                  '<b>Email Type:</b> ' + emailTypeDisplay + '<br>' +
                  '<b>Confidence:</b> ' + (parsed.confidence ? parsed.confidence + '%' : '<i>N/A</i>') + '<br>' +
                  '<b>Method:</b> ' + (parsed.method || '<i>Unknown</i>');
    
    if (result.would_create_duplicate) {
      resultsText += '<br><br><font color="#b45309">⚠️ This email was already tracked</font>';
    }
  } else {
    // Handle parsing failure
    resultsText = '<font color="#991b1b">❌ Failed to parse email</font>';
    
    if (result.message) {
      resultsText += '<br><br><b>Error:</b> ' + result.message;
    }
    
    // Add troubleshooting tips
    resultsText += '<br><br><b>💡 Troubleshooting:</b><br>' +
                   '• Make sure this is a job application email<br>' +
                   '• Try with a different email<br>' +
                   '• Check your internet connection<br>' +
                   '• The email might not contain job application information';
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Test Results')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText(resultsText)
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>This was a test - no data was saved</i></font>')
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('← Back')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('onGmailMessageOpen')
            )
        )
    )
    .build();
  
  return card;
}

/**
 * Build authentication success card.
 * 
 * @return {Card} Auth success card
 */
function buildAuthSuccessCard() {
  const userEmail = getUserEmail() || 'Unknown';
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Authentication Successful')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>✅ Successfully signed in!</b>')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('Signed in as: ' + userEmail)
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('You can now track job application emails. Open any email to get started!')
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Continue')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('onGmailMessageOpen')
            )
        )
    )
    .build();
  
  return card;
}

/**
 * Build settings card for authenticated users.
 * 
 * @param {string} userEmail - User's email address
 * @return {Card} Settings card
 */
function buildSettingsCard(userEmail) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Settings')
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Account Information')
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>Signed in as:</b> ' + (userEmail || 'Unknown'))
        )
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Actions')
        .addWidget(
          CardService.newTextButton()
            .setText('Sign Out')
            .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('signOutAction')
            )
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>TrackMail helps you manage job applications directly from Gmail. Open any email to track it as a job application.</i></font>')
        )
    )
    .build();
  
  return card;
}

/**
 * Build a loading card to show while processing.
 * 
 * @param {string} message - Loading message to display
 * @return {Card} Loading card
 */
function buildLoadingCard(message) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Processing...')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>⏳ ' + message + '</b>')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>Please wait while we process your request...</i></font>')
        )
    )
    .build();
  
  return card;
}

/**
 * Build a card for displaying application details.
 * This could be used for a future feature to browse applications from Gmail.
 * 
 * @param {Object} application - Application object from API
 * @return {Card} Application details card
 */
function buildApplicationDetailsCard(application) {
  let statusColor = '#6b7280'; // default gray
  if (application.status === 'interviewing') statusColor = '#2563eb'; // blue
  else if (application.status === 'offer') statusColor = '#16a34a'; // green
  else if (application.status === 'rejected') statusColor = '#dc2626'; // red
  
  const detailsText = '<b>Company:</b> ' + application.company + '<br>' +
                      '<b>Position:</b> ' + application.position + '<br>' +
                      '<b>Status:</b> <font color="' + statusColor + '">' + application.status + '</font><br>';
  
  let notesWidget = null;
  if (application.notes) {
    notesWidget = CardService.newTextParagraph()
      .setText('<b>Notes:</b><br>' + application.notes);
  }
  
  const section = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText(detailsText)
    );
  
  if (notesWidget) {
    section.addWidget(notesWidget);
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Application Details')
    )
    .addSection(section)
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('← Back')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('onGmailMessageOpen')
            )
        )
    )
    .build();
  
  return card;
}


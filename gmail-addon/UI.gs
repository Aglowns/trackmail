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
            .setText('To get started, you need to sign in with your TrackMail account.')
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Sign In with TrackMail')
            .setBackgroundColor('#667eea')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('openAuthPageAction')
            )
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>A new window will open for sign-in. After signing in, you\'ll receive a session code to paste here.</i></font>')
        )
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Already signed in?')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('sessionHandle')
            .setTitle('Session Handle')
            .setHint('Paste your session handle here')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Save Session')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('saveSessionHandleAction')
            )
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
  const userEmail = getUserEmail() || 'Signed In';
  
  // Fetch email data to preview
  let emailPreview = '';
  let sender = '';
  let subject = '';
  let date = '';
  
  try {
    const emailData = fetchEmailData(messageId, accessToken);
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
    
    emailPreview = '<b>From:</b> ' + sender + '<br>' +
                   '<b>Subject:</b> ' + subject + '<br>' +
                   '<b>Date:</b> ' + date;
  } catch (error) {
    console.error('Error fetching email preview:', error);
    emailPreview = '<font color="#991b1b">Error loading email preview</font>';
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
    .addSection(
      CardService.newCardSection()
        .setHeader('Actions')
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
        )
    )
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
  let message = '✅ Application tracked successfully!';
  
  if (result.duplicate) {
    message = '✅ This email was already tracked.';
  }
  
  let detailText = result.message || '';
  if (result.application_id) {
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
  
  if (result.parsed) {
    resultsText = '<b>Parsing Results:</b><br><br>' +
                  '<b>Company:</b> ' + (result.parsed.company || '<i>Not found</i>') + '<br>' +
                  '<b>Position:</b> ' + (result.parsed.position || '<i>Not found</i>') + '<br>' +
                  '<b>Status:</b> ' + (result.parsed.status || '<i>Not found</i>') + '<br>' +
                  '<b>Confidence:</b> ' + (result.parsed.confidence ? (result.parsed.confidence * 100).toFixed(0) + '%' : '<i>N/A</i>');
    
    if (result.would_create_duplicate) {
      resultsText += '<br><br><font color="#b45309">⚠️ This email was already ingested</font>';
    }
  } else {
    resultsText = '<font color="#991b1b">Failed to parse email</font>';
    if (result.message) {
      resultsText += '<br><br>' + result.message;
    }
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


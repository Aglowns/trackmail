/**
 * Test function to verify the parsing fix is working
 * Copy this function to your Google Apps Script project and run it
 */
function testParsingFix() {
  console.log('Testing parsing fix...');
  
  // Test email content similar to your Zipcar email
  const testHtml = `
    <html>
      <body>
        <p>Hello Prince,</p>
        <p>Thank you for applying for our Software Engineer Co-Op- Billing role at Zipcar!</p>
        <p>We're reviewing your experience, skills, and qualifications, and will shortly be in touch to talk about what's next.</p>
        <p>You can check your application status by logging into your Candidate Home page.</p>
        <p>Best regards,<br>Zipcar Team</p>
      </body>
    </html>
  `;
  
  const testSubject = 'Thank you for Applying';
  const testSender = 'avisbudget@myworkday.com';
  
  console.log('Testing with Zipcar email...');
  console.log('Subject:', testSubject);
  console.log('Sender:', testSender);
  
  // Test the parsing
  const result = enhancedFallbackParsing(testHtml, testSubject, testSender);
  
  console.log('Parsing result:', result);
  console.log('Company:', result.company);
  console.log('Position:', result.position);
  
  // Check if it's correct
  if (result.company === 'Zipcar' && result.position === 'Software Engineer Co-Op') {
    console.log('✅ PARSING FIX IS WORKING!');
  } else {
    console.log('❌ Parsing still has issues');
    console.log('Expected: Company=Zipcar, Position=Software Engineer Co-Op');
    console.log('Got: Company=' + result.company + ', Position=' + result.position);
  }
  
  return result;
}

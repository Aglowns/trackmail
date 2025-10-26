/**
 * Test function to verify Wells Fargo parsing is working
 * Copy this function to your Google Apps Script project and run it
 */
function testWellsFargoParsing() {
  console.log('Testing Wells Fargo parsing...');
  
  // Test email content similar to your Wells Fargo email
  const testHtml = `
    <html>
      <body>
        <div style="background-color: red; color: white; padding: 10px;">
          <h1>WELLS FARGO</h1>
        </div>
        <div style="background-color: yellow; padding: 5px;">
          <p>Human Resources</p>
        </div>
        <p>Dear Prince,</p>
        <p>Thank you for your interest in Wells Fargo. We have received your application for the following position: R-498519 2026 Technology Summer Internship - Early Careers (Software Engineer)</p>
        <p>Best regards,<br>Wells Fargo Talent Acquisition</p>
      </body>
    </html>
  `;
  
  const testSubject = 'Wells Fargo Careers: Thank you for applying';
  const testSender = 'WellsFargoHR <wf@myworkday.com>';
  
  console.log('Testing with Wells Fargo email...');
  console.log('Subject:', testSubject);
  console.log('Sender:', testSender);
  
  // Test the parsing
  const result = quickEmailParsing(testHtml, testSubject, testSender);
  
  console.log('Parsing result:', result);
  console.log('Company:', result.company);
  console.log('Position:', result.position);
  
  // Check if it's correct
  if (result.company === 'Wells Fargo' && result.position === 'Technology Summer Internship') {
    console.log('✅ WELLS FARGO PARSING IS WORKING!');
  } else {
    console.log('❌ Wells Fargo parsing still has issues');
    console.log('Expected: Company=Wells Fargo, Position=Technology Summer Internship');
    console.log('Got: Company=' + result.company + ', Position=' + result.position);
  }
  
  return result;
}

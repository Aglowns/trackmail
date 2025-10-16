# TrackMail Gmail Add-on

A Gmail Add-on for automatically tracking job application emails.

## Features

- 📧 **One-click tracking**: Track job application emails directly from Gmail
- 🔍 **Smart parsing**: Automatically extracts company, position, and status
- 🔐 **Secure authentication**: Uses session-based authentication via Auth Bridge
- 📊 **Test mode**: Preview parsing results before saving
- 💾 **Automatic deduplication**: Prevents duplicate applications

## Project Structure

```
gmail-addon/
├── Code.gs           # Main entry points and triggers
├── Auth.gs           # Authentication and session management
├── API.gs            # Backend API communication
├── UI.gs             # CardService UI components
├── appsscript.json   # Manifest and configuration
└── README.md         # This file
```

## Setup Instructions

### Prerequisites

1. **TrackMail Backend**: Running backend API (see main project README)
2. **Auth Bridge Service**: Deployed auth bridge service (see auth-bridge/README.md)
3. **Google Account**: For developing and testing the add-on

### Step 1: Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Name it "TrackMail"

### Step 2: Add the Code Files

1. In the Apps Script editor, delete the default `Code.gs` content
2. Create the following files (File > New > Script file):
   - `Code.gs`
   - `Auth.gs`
   - `API.gs`
   - `UI.gs`
3. Copy the contents of each `.gs` file from this directory into the corresponding file in the editor
4. Update the manifest:
   - Click on **Project Settings** (gear icon)
   - Check "Show appsscript.json manifest file in editor"
   - Go back to **Editor**
   - Click on `appsscript.json` in the file list
   - Replace its contents with the contents of `appsscript.json` from this directory

### Step 3: Configure URLs

In `Auth.gs`, update these constants with your deployed URLs:

```javascript
const AUTH_BRIDGE_URL = 'https://your-auth-bridge.com'; // Your deployed Auth Bridge URL
const BACKEND_API_URL = 'https://your-api.com/v1';      // Your backend API URL
```

### Step 4: Enable Gmail API

1. In the Apps Script editor, click on **Services** (+ icon)
2. Find "Gmail API" and click **Add**
3. The service should now appear in your editor

### Step 5: Deploy as Test Add-on

1. Click **Deploy > Test deployments**
2. Click **Install**
3. A new Gmail window will open with your add-on installed

### Step 6: Test the Add-on

1. Open Gmail in the window that was just opened
2. Open any email (preferably a job application email)
3. Look for the TrackMail icon in the right sidebar
4. Click it to open the add-on
5. Click **Sign In with TrackMail**
6. A new window will open for authentication
7. Sign in and copy your session handle
8. Paste it into the add-on
9. Click **Track This Application**

## Usage

### First Time Setup

1. **Sign In**:
   - Click "Sign In with TrackMail"
   - Complete authentication in the browser window
   - Copy your session handle
   - Paste it into the add-on and click "Save Session"

2. **Tracking Emails**:
   - Open any job application email
   - The add-on will show an email preview
   - Click "Track This Application" to save it
   - The backend will automatically extract company, position, and status

3. **Testing Parsing**:
   - Click "Test Parsing" to see what would be extracted
   - No data is saved in test mode
   - Useful for checking if emails are being parsed correctly

### Session Management

- **Session Duration**: Sessions last for 1 hour (configurable in Auth Bridge)
- **Automatic Refresh**: The add-on automatically fetches new tokens as needed
- **Sign Out**: Click "Sign Out" to clear your session

### Troubleshooting

**"Authentication required" error**:
- Your session may have expired
- Click "Sign Out" and sign in again

**"Failed to fetch email data"**:
- Check that Gmail API is enabled in Apps Script
- Ensure you have the correct permissions

**"Could not extract sufficient information"**:
- The email may not be a job application email
- Try "Test Parsing" to see what was extracted
- You can manually add applications via the main TrackMail app

**"API request failed"**:
- Check that your backend API is running
- Verify the `BACKEND_API_URL` in `Auth.gs` is correct
- Check the Apps Script logs (View > Logs) for details

## Development

### Testing Locally

To test with local backend and auth bridge:

1. In `Auth.gs`, set:
   ```javascript
   const AUTH_BRIDGE_URL = 'http://localhost:8001';
   const BACKEND_API_URL = 'http://localhost:8000/v1';
   ```

2. Note: Apps Script may have issues with localhost URLs due to CORS
3. For local testing, consider using ngrok or similar to expose local services

### Viewing Logs

1. In the Apps Script editor: **View > Logs** or **View > Executions**
2. Logs show all `console.log()` output
3. Executions show function calls and errors

### Debugging

1. Add `console.log()` statements throughout your code
2. Use the **View > Executions** page to see real-time logs
3. Test individual functions using the **Run** button in the editor

## Deployment to Marketplace (Future)

To publish the add-on to Google Workspace Marketplace:

1. **Prepare for Review**:
   - Create a privacy policy
   - Add app icon and screenshots
   - Complete OAuth consent screen
   - Document all permissions

2. **Submit for Review**:
   - Go to **Deploy > New deployment**
   - Choose "Editor Add-on"
   - Fill out the marketplace listing form
   - Submit for Google review

3. **Review Process**:
   - Typically takes 2-4 weeks
   - Google will test your add-on
   - You may need to answer questions or make changes

## API Reference

### Configuration Functions

- `getAuthBridgeUrl()` - Returns Auth Bridge URL
- `getBackendApiUrl()` - Returns backend API URL

### Authentication Functions

- `getSessionHandle()` - Get stored session handle
- `saveSessionHandle(handle)` - Save session handle
- `clearSessionHandle()` - Clear session (sign out)
- `getAccessToken()` - Get valid access token (auto-refreshes)
- `getUserEmail()` - Get signed-in user's email

### API Functions

- `ingestEmail(emailData)` - Track an email as application
- `testEmailParsing(emailData)` - Test parsing without saving
- `getApplications(skip, limit)` - Get all applications
- `getApplication(id)` - Get application by ID
- `createApplication(data)` - Create application manually
- `updateApplication(id, data)` - Update application
- `deleteApplication(id)` - Delete application

### UI Functions

- `buildSignInCard()` - Sign-in UI
- `buildTrackingCard(messageId, accessToken)` - Main tracking UI
- `buildSuccessCard(result)` - Success message
- `buildErrorCard(message)` - Error message
- `buildTestResultsCard(result)` - Test results

## License

Part of the TrackMail project. See main project README for license information.


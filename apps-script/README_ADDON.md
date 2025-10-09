# Job Tracker - Gmail Add-on

This Gmail Add-on automatically detects job application confirmation emails and syncs them with your Trackmail backend via the Vercel API.

## Features

- **Automatic Detection**: Recognizes job application emails from major ATS platforms (Greenhouse, Lever, Workday, LinkedIn, etc.)
- **Smart Parsing**: Extracts company name, job title, source, and status from email content
- **Context Cards**: Shows parsed application details when opening relevant emails
- **One-Click Save**: Save/update applications directly from Gmail
- **Hourly Scanning**: Automatically scans for new applications every hour
- **Settings UI**: Configure API credentials and test connection
- **Manual Scan**: Trigger on-demand scans for recent emails

## Architecture

### Modules

- **main.ts**: Entry point, builds UI cards and handles user actions
- **parser.ts**: Email parsing logic with deterministic rules
- **gmail.ts**: Gmail API interactions for reading emails
- **storage.ts**: Vercel API client with Bearer token authentication
- **scheduler.ts**: Time-driven triggers for automated scanning
- **settings.ts**: Configuration UI and management
- **util.ts**: Helper functions (domain parsing, HTML→text, etc.)

### Build System

- **TypeScript** → **esbuild** → **single bundle.js**
- **clasp** for deployment to Apps Script
- Source maps disabled for Apps Script compatibility

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. Google account with Gmail
3. Vercel API deployed and running (Stage 2)
4. `JOBMAIL_API_KEY` from backend

### Installation Steps

#### 1. Install Dependencies

```bash
cd apps-script
npm install
```

#### 2. Enable Google Apps Script API

1. Visit: https://script.google.com/home/usersettings
2. Enable "Google Apps Script API"

#### 3. Login to Clasp

```bash
npx clasp login
```

This will open a browser for Google authentication.

#### 4. Create New Apps Script Project

```bash
npx clasp create --title "Job Tracker Gmail Add-on" --type standalone
```

This will create a `.clasp.json` file with your `scriptId`.

**Alternative**: If you want to link to an existing project:

```bash
# Visit script.google.com and create a new project
# Copy the script ID from the URL
npx clasp clone <YOUR_SCRIPT_ID>
```

#### 5. Build and Deploy

```bash
npm run build     # Build TypeScript → JavaScript
npm run push      # Push to Apps Script
```

#### 6. Open Apps Script Editor

```bash
npm run open
```

This opens the Apps Script editor in your browser.

#### 7. Configure the Add-on

In the Apps Script editor:

1. **Add Scopes** (if not already in manifest):
   - The `appsscript.json` already includes required scopes
   
2. **Deploy as Add-on**:
   - Click "Deploy" → "Test deployments"
   - Click "Install"
   - Grant required permissions

3. **Configure API Settings**:
   - Open Gmail
   - Open any email
   - Click the add-on icon (right sidebar)
   - Click "Settings" or use the homepage
   - Enter your:
     - **Vercel API URL**: `https://yourapp.vercel.app`
     - **API Key**: Your `JOBMAIL_API_KEY`
     - **Dashboard URL**: (optional) Your frontend URL
   - Click "Save Configuration"
   - Click "Test Connection" to verify

#### 8. Setup Time-Driven Triggers

Run this **once** to install automated scanning:

1. In Apps Script editor, select `setupTriggers` function from dropdown
2. Click "Run"
3. Grant permissions if prompted
4. Check execution log to confirm triggers were created

This creates:
- **Hourly trigger**: Scans for new applications every hour
- **Daily trigger**: Comprehensive scan at 8 AM daily

**View Triggers**:
- Click "Triggers" (clock icon) in left sidebar
- You should see `hourlyScan` and `dailyDigestScan`

### Development Workflow

#### Build and Test

```bash
# Build once
npm run build

# Watch for changes (auto-rebuild)
npm run watch

# Push to Apps Script
npm run push

# Build + Push
npm run deploy
```

#### View Logs

```bash
npm run logs
```

Or in Apps Script editor: "Executions" tab.

#### Test the Add-on

1. Open Gmail
2. Find a job application confirmation email (or send yourself one)
3. Open the email
4. Click the add-on icon in the right sidebar
5. You should see the job application details card
6. Click "Save to Tracker" to send to API

#### Manual Testing

In Apps Script editor:

1. **Test Settings**:
   - Run `onHomepage()` function
   - Check logs for output

2. **Test Manual Scan**:
   - Run `hourlyScan()` or `dailyDigestScan()`
   - Check logs for results

3. **Test Email Parsing**:
   - Run `onGmailMessageOpen()` with a test event

## Configuration

### Script Properties

The add-on stores configuration in Script Properties:

- `VERCEL_API_URL`: Your Vercel deployment URL
- `JOBMAIL_API_KEY`: API key for authentication
- `DASHBOARD_URL`: Frontend dashboard URL

**Access Programmatically**:

```javascript
const props = PropertiesService.getScriptProperties();
props.setProperty('VERCEL_API_URL', 'https://yourapp.vercel.app');
props.setProperty('JOBMAIL_API_KEY', 'your-api-key');
```

### OAuth Scopes

Required scopes (in `appsscript.json`):

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/gmail.addons.execute",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.storage"
  ]
}
```

## API Integration

### Authentication

All API requests include:

```http
Authorization: Bearer ${JOBMAIL_API_KEY}
Idempotency-Key: ${messageId}
Content-Type: application/json
```

### Endpoints Used

#### POST /api/applications/upsert

Upsert job application:

```json
{
  "messageId": "gmail-message-id",
  "threadId": "gmail-thread-id",
  "company": "Acme Corp",
  "jobTitle": "Software Engineer",
  "jobUrl": "https://...",
  "source": "Greenhouse",
  "status": "applied",
  "appliedAt": "2025-01-15T10:30:00.000Z"
}
```

Response:

```json
{
  "id": "uuid",
  "messageId": "...",
  "company": "Acme Corp",
  ...
}
```

#### GET /api/applications

List applications (optional, for future use):

```
GET /api/applications?status=applied&limit=50
```

#### GET /api/applications/by-thread/:threadId

Check if email thread already saved:

```
GET /api/applications/by-thread/thread-123
```

#### GET /api/health

Test connection:

```
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

## Parsing Logic

### ATS Detection

The parser recognizes emails from:

- **Greenhouse** (greenhouse.io)
- **Lever** (lever.co)
- **Workday** (workday.com)
- **LinkedIn** (linkedin.com, jobs-noreply@linkedin.com)
- **Indeed** (indeed.com)
- **Glassdoor** (glassdoor.com)
- **ZipRecruiter** (ziprecruiter.com)
- And more...

### Confidence Levels

- **High**: Explicit confirmation subject line OR known ATS sender
- **Medium**: Contains "application" keywords
- **Low**: Generic or unclear

Only **high** confidence emails are processed in automated scans. **Medium** confidence can be manually saved from the UI.

### Status Mapping

Subject/body keywords → status:

- "application received" → `applied`
- "under review" → `screening`
- "interview" → `interview`
- "offer" → `offer`
- "unfortunately" → `rejected`

### Company Extraction

Priority order:

1. Sender name (if not generic like "noreply")
2. Domain name (if not ATS)
3. Subject line pattern: "Your application to [Company]"
4. Body text pattern: "application to [Company]"

### Job Title Extraction

Patterns:

- "for [Job Title] at..."
- "position: [Job Title]"
- "applied for [Job Title]"

## Troubleshooting

### Add-on Not Appearing

1. Verify deployment: "Deploy" → "Test deployments" → "Install"
2. Refresh Gmail completely (Ctrl+R or Cmd+R)
3. Check if add-on is enabled: Settings → Add-ons → Manage

### Configuration Errors

1. Verify API URL format: must start with `https://`
2. Verify API Key is correct (from backend `.env`)
3. Test connection from Settings UI
4. Check Apps Script logs: `npm run logs`

### API Requests Failing

1. Check backend is running: `curl https://yourapp.vercel.app/api/health`
2. Verify `JOBMAIL_API_KEY` matches backend
3. Check CORS settings in backend
4. View Apps Script execution logs

### Emails Not Being Detected

1. Check confidence level (might be "low")
2. Run manual scan to test: Settings → "Run Scan Now"
3. Check parser rules in `parser.ts`
4. View logs to see parsing results

### Triggers Not Running

1. Verify triggers exist: Apps Script editor → Triggers tab
2. Re-run `setupTriggers()` function
3. Check trigger execution history for errors
4. Ensure configuration is saved

### Permission Issues

1. Re-authorize the add-on:
   - Deploy → Test deployments → Install
   - Grant all requested permissions
2. Check OAuth scopes in `appsscript.json`
3. Verify Gmail Add-ons API is enabled

## Limitations

### Apps Script Quotas

- **UrlFetchApp calls**: 20,000/day
- **Trigger runtime**: 6 minutes max
- **Email read**: Subject to Gmail API quotas

### Gmail API

- **Search results**: Limited to ~500 threads per query
- **Message parsing**: HTML→text conversion may lose formatting

### Parsing Accuracy

- **Company extraction**: May fail for unusual email formats
- **Job title**: May miss if not in common patterns
- **Status**: Default to "applied" if unclear

## Extending the Add-on

### Add New ATS

Edit `parser.ts`:

```typescript
const ATS_DOMAINS: Record<string, string> = {
  'greenhouse.io': 'Greenhouse',
  'new-ats.com': 'NewATS', // Add here
};
```

### Add Custom Parsing Rules

Edit `parser.ts` functions:

- `extractCompany()`: Company name extraction
- `extractJobTitle()`: Job title patterns
- `determineStatus()`: Status keywords

### Add UI Features

Edit `main.ts`:

- `buildJobApplicationCard()`: Modify context card
- Add new action handlers
- Add custom widgets

### Add More Triggers

Edit `scheduler.ts`:

```typescript
// Add weekly digest
ScriptApp.newTrigger('weeklyDigest')
  .timeBased()
  .onWeekDay(ScriptApp.WeekDay.MONDAY)
  .atHour(9)
  .create();
```

## Security

### API Key Storage

- Stored in **Script Properties** (encrypted at rest)
- Never logged or exposed in UI
- Transmitted via HTTPS only

### OAuth Scopes

- **Minimal scopes**: Only what's needed
- **gmail.readonly**: Read emails only (no send/delete)
- **script.external_request**: API calls to Vercel
- **script.storage**: Store configuration

### Data Privacy

- No data stored in Apps Script (stateless)
- All data persists in your Vercel backend
- Emails are processed but not stored

## Publishing (Optional)

To publish as a public Gmail Add-on:

1. **Google Cloud Console**:
   - Create a new GCP project
   - Enable Gmail API
   - Configure OAuth consent screen
   - Add required scopes

2. **Apps Script**:
   - Link to GCP project: Project Settings → Google Cloud Platform (GCP) Project
   - Enter GCP project number

3. **Deploy**:
   - Deploy → New deployment → Add-on
   - Create deployment
   - Submit to Google Workspace Marketplace (requires verification)

**Note**: For personal use, "Test deployments" are sufficient.

## Support

### Useful Links

- [Apps Script Documentation](https://developers.google.com/apps-script)
- [Gmail Add-ons Guide](https://developers.google.com/gmail/add-ons)
- [Card Service Reference](https://developers.google.com/apps-script/reference/card-service)
- [Clasp Documentation](https://github.com/google/clasp)

### Debugging

1. **Apps Script Logs**:
   ```bash
   npm run logs
   ```

2. **Execution History**:
   - Apps Script editor → "Executions" tab
   - View recent runs, errors, and duration

3. **Console Logging**:
   ```javascript
   console.log('Debug info:', variable);
   ```

4. **Test in Editor**:
   - Select function from dropdown
   - Click "Run"
   - View logs and results

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes in `apps-script/src/`
4. Test thoroughly
5. Submit pull request

---

**Built for Trackmail Stage 3**  
No Google Sheets. Pure API integration. 🚀


# 📧 TrackMail Gmail Add-on

> **Track job applications directly from Gmail with one click**

The TrackMail Gmail Add-on brings powerful job application tracking right into your Gmail inbox. No more forwarding emails or manual data entry—just open an email and click "Track Application."

## ✨ Features

- 🎯 **One-Click Tracking** - Track job application emails instantly from Gmail
- 🤖 **Smart Parsing** - Automatically extracts company, position, and status
- 🔐 **Secure Authentication** - Session-based auth with Supabase integration
- 🔍 **Test Mode** - Preview what will be extracted before saving
- 📊 **Duplicate Detection** - Never create the same application twice
- 💬 **Real-time Feedback** - Clear success and error messages
- 📱 **Modern UI** - Beautiful card-based interface

## 🎬 How It Works

1. **Open a job application email** in Gmail
2. **Click the TrackMail icon** in the sidebar
3. **Click "Track This Application"**
4. **Done!** Application is saved to your TrackMail account

```
┌─────────────────────────────────────────────────────┐
│  Gmail                                               │
│  ┌────────────────┐  ┌─────────────────────────┐   │
│  │  Job Email     │  │  📧 TrackMail           │   │
│  │                │  │                          │   │
│  │  From: Acme    │  │  From: jobs@acme.com    │   │
│  │  Subject:      │  │  Subject: Application   │   │
│  │  Application   │  │                          │   │
│  │  Received      │  │  [Track Application]    │   │
│  │                │  │  [Test Parsing]         │   │
│  └────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────┘
          ↓                        ↓
          └────────────┬───────────┘
                       ↓
            TrackMail Backend API
                       ↓
          Application Saved to Database!
```

## 🏗️ Architecture

The Gmail Add-on consists of three integrated services:

### 1. **Gmail Add-on** (Apps Script)
- Runs in Gmail sidebar
- Extracts email data from Gmail API
- Provides user interface

### 2. **Auth Bridge** (FastAPI)
- Manages authentication sessions
- Exchanges session handles for JWT tokens
- Ensures secure communication

### 3. **Backend API** (FastAPI)
- Parses email content
- Creates job applications
- Stores data in Supabase

```
Gmail Add-on → Auth Bridge → Backend API → Supabase Database
```

## 🚀 Quick Start

### For Users

1. Install the TrackMail Gmail Add-on from [your deployment URL]
2. Click "Sign In" and authenticate with your TrackMail account
3. Start tracking job applications from any email!

### For Developers

See **[QUICK_START_GMAIL_ADDON.md](./QUICK_START_GMAIL_ADDON.md)** for a 15-minute setup guide.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICK_START_GMAIL_ADDON.md](./QUICK_START_GMAIL_ADDON.md)** | 15-minute setup guide |
| **[GMAIL_ADDON_SETUP.md](./GMAIL_ADDON_SETUP.md)** | Complete setup and deployment guide |
| **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** | Comprehensive testing instructions |
| **[GMAIL_ADDON_IMPLEMENTATION_SUMMARY.md](./GMAIL_ADDON_IMPLEMENTATION_SUMMARY.md)** | Technical implementation details |

## 📂 Project Structure

```
trackmail/
├── gmail-addon/              # Gmail Add-on (Apps Script)
│   ├── Code.gs              # Main entry points
│   ├── Auth.gs              # Authentication logic
│   ├── API.gs               # Backend API calls
│   ├── UI.gs                # User interface
│   └── appsscript.json      # Manifest
│
├── auth-bridge/             # Auth Bridge Service (FastAPI)
│   ├── main.py              # FastAPI application
│   ├── templates/
│   │   └── signin.html      # Sign-in page
│   └── requirements.txt     # Python dependencies
│
└── app/                     # Backend API (existing)
    └── schemas.py           # Updated with Gmail fields
```

## 🔐 Security

- ✅ **Session-based authentication** - No passwords stored in add-on
- ✅ **Short-lived tokens** - JWT tokens expire after 5 minutes
- ✅ **Rate limiting** - Prevents abuse of token endpoint
- ✅ **User isolation** - Row-level security in database
- ✅ **HTTPS only** - All services use secure connections

## 🎯 Use Cases

### Job Seeker
- Track applications as you send them
- Monitor responses and updates
- Keep everything organized in one place

### Career Counselor
- Help clients track their applications
- Monitor progress and follow-ups
- Provide data-driven advice

### Recruiter
- Track candidate communications
- Monitor application pipelines
- Never lose track of promising candidates

## 🛠️ Tech Stack

- **Gmail Add-on**: Google Apps Script, CardService
- **Auth Bridge**: Python, FastAPI, Jinja2
- **Backend API**: Python, FastAPI, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth

## 📊 Performance

| Metric | Target | Typical |
|--------|--------|---------|
| Card Render Time | < 1s | ~500ms |
| Track Application | < 3s | ~1.5s |
| Test Parsing | < 2s | ~1s |
| Token Fetch | < 100ms | ~50ms |

## 🧪 Testing

Run comprehensive tests with:

```bash
# Backend tests
pytest tests/ -v

# Auth Bridge tests
cd auth-bridge && pytest test_main.py -v

# Manual E2E tests
# See TESTING_GUIDE.md for detailed instructions
```

## 🐛 Troubleshooting

### Common Issues

**"Authentication required"**
- Solution: Click "Sign Out" then "Sign In" to refresh your session

**"Failed to fetch email data"**
- Solution: Ensure Gmail API is enabled in Apps Script

**"API request failed"**
- Solution: Check that your backend API is running and accessible

**"Could not extract sufficient information"**
- Solution: Email may not be a job application—try another email or add manually

See **[GMAIL_ADDON_SETUP.md](./GMAIL_ADDON_SETUP.md#troubleshooting)** for more.

## 🚦 Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Backend API | ⚙️ Configure | `https://your-backend.com` |
| Auth Bridge | ⚙️ Configure | `https://your-auth-bridge.com` |
| Gmail Add-on | ⚙️ Deploy | Apps Script Project |

Follow **[GMAIL_ADDON_SETUP.md](./GMAIL_ADDON_SETUP.md)** to deploy all components.

## 🎓 Learning Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Gmail Add-ons Guide](https://developers.google.com/gmail/add-ons)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📝 License

This project is part of TrackMail. See main README for license information.

## 🌟 Features Roadmap

### Current Features ✅
- [x] One-click email tracking
- [x] Automatic parsing
- [x] Duplicate detection
- [x] Test parsing mode
- [x] Secure authentication

### Planned Features 🚧
- [ ] Browse applications from Gmail
- [ ] Quick status updates
- [ ] Batch email tracking
- [ ] Mobile app optimization
- [ ] Advanced search filters
- [ ] Email templates
- [ ] Analytics dashboard

## 📞 Support

- 📖 **Documentation**: Check the docs in this directory
- 🐛 **Bug Reports**: Create an issue on GitHub
- 💬 **Questions**: See troubleshooting guides
- 📧 **Contact**: [Your contact info]

## 🎉 Getting Started

Ready to track your job applications from Gmail?

1. **Read the Quick Start**: [QUICK_START_GMAIL_ADDON.md](./QUICK_START_GMAIL_ADDON.md)
2. **Deploy the services**: Follow the setup guide
3. **Start tracking**: Open Gmail and try it out!

---

**Made with ❤️ for job seekers everywhere**

*Track smarter, not harder* 🎯


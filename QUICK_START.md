# 🚀 Trackmail Quick Start Guide

## ✅ You're All Set!

Your Trackmail web dashboard is now running at:

**http://localhost:3000**

---

## 📋 What Just Happened

1. ✅ **Environment configured** - Created `.env.local` with secure credentials
2. ✅ **Database ready** - Prisma Client generated
3. ✅ **Server started** - Next.js development server is running

---

## 🎯 Next Steps

### **1. Open the Dashboard**

Visit **http://localhost:3000** in your browser.

### **2. Set Up Authentication (Optional)**

Right now, you can access the dashboard directly. To add GitHub/Google login:

#### **For GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret
5. Edit `.env.local` and add:
   ```env
   GITHUB_ID="your-client-id"
   GITHUB_SECRET="your-client-secret"
   ```
6. Restart the server (Ctrl+C, then `npm run dev`)

#### **For Google OAuth:**
1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret
5. Edit `.env.local` and add:
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```
6. Restart the server

### **3. Test the Features**

- ✅ **View Applications** - See all your job applications in a table
- ✅ **Filter** - Use the filters to search by status, company, source, or date
- ✅ **View Details** - Click on any application to see full details
- ✅ **Update Status** - Change application statuses from the detail page
- ✅ **Timeline** - See the history of each application

---

## 🔧 Common Commands

```powershell
# Start development server
npm run dev

# Stop development server
# Press Ctrl+C in the terminal

# Build for production
npm run build

# Run production build
npm run start

# Open Prisma Studio (database UI)
npm run db:studio

# Run database migrations
npm run db:migrate:dev
```

---

## 📝 Current Configuration

Your `.env.local` file has these defaults:

- **Database**: `postgresql://postgres:postgres@localhost:5432/trackmail`
- **API Key**: `dev-key-12345`
- **NextAuth Secret**: Auto-generated secure key
- **OAuth**: Not configured (optional)

### **Update Configuration:**

Edit `.env.local` to change:
- Database connection string
- API key (must match your backend)
- OAuth credentials

---

## 🎨 Features Overview

### **Dashboard Homepage**
- **Applications Table**: All your job applications
- **Smart Filters**: 
  - Search by company or job title
  - Filter by status (Applied, Screening, Interview, Offer, Rejected)
  - Filter by source (LinkedIn, Greenhouse, Indeed, etc.)
  - Date range picker
- **Real-time Updates**: Changes reflect immediately
- **Loading States**: Smooth skeleton loaders

### **Application Details Page**
- **Full Information**: Company, title, source, dates
- **Status Management**: Update status with dropdown
- **Timeline**: Track all events and changes
- **External Links**: Quick access to job postings
- **Metadata**: Message IDs, thread IDs for debugging

---

## 🔄 Integration with Gmail Add-on

Your Gmail Add-on (from Stage 3) automatically:
1. Detects job application emails
2. Parses company, title, and details
3. Sends data to the API (Stage 2)
4. Dashboard displays the data (Stage 4 - this!)

It all works together seamlessly! 🎯

---

## 📊 What to Try

1. **Open a Job Application Email** in Gmail
   - Gmail Add-on will show parsed details
   - Click "Save to Tracker"
   
2. **Refresh the Dashboard**
   - New application appears in the table
   
3. **Filter the Applications**
   - Try different status filters
   - Search for company names
   
4. **Update a Status**
   - Click on an application
   - Change its status from the dropdown
   - See the timeline update

---

## 🐛 Troubleshooting

### **Can't access http://localhost:3000**
- Check if the server is running: `npm run dev`
- Check for port conflicts
- Try http://127.0.0.1:3000

### **Database connection error**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env.local`
- Run migrations: `npm run db:migrate:dev`

### **OAuth not working**
- Ensure callback URLs are correct
- Check credentials in `.env.local`
- Restart the server after adding OAuth

### **Changes not appearing**
- Hard refresh browser (Ctrl+F5)
- Check browser console for errors
- Check terminal for server errors

---

## 📚 Documentation

- **`README_WEB.md`** - Comprehensive setup and features guide
- **`DEPLOYMENT_GUIDE.md`** - Production deployment instructions
- **`STAGE4_COMPLETE.md`** - What was built and why

---

## 🚀 Deploy to Production

When you're ready to deploy:

1. **Push to GitHub**:
   ```powershell
   git add .
   git commit -m "Complete Stage 4: Web Dashboard"
   git push
   ```

2. **Deploy to Vercel**:
   - Visit https://vercel.com
   - Import your repository
   - Add environment variables
   - Deploy!

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## 🎉 You're Ready!

Your complete job application tracking system is now running:

- **✅ Gmail Add-on** - Captures applications from emails
- **✅ Backend API** - Stores and manages data
- **✅ Web Dashboard** - Beautiful interface for tracking

**Open http://localhost:3000 and start tracking! 🚀**

---

## 💡 Pro Tips

1. **Keyboard Shortcuts**: Use browser search (Ctrl+F) to quickly find applications
2. **Bookmarks**: Bookmark frequently used filters
3. **Multiple Tabs**: Open detail pages in new tabs to compare applications
4. **Mobile Access**: The dashboard works on your phone too!
5. **Data Export**: Use Prisma Studio (`npm run db:studio`) to export data

---

**Need help?** Check the documentation files or review the code comments! 📖

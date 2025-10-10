# Trackmail Deployment Guide

## 🚀 Quick Start - Running Locally

Follow these steps to get your Trackmail dashboard running on your local machine.

### **Step 1: Environment Variables**

First, let's set up your environment variables. You'll need to create a `.env.local` file.

### **Step 2: Generate NextAuth Secret**

You need a secure random string for NextAuth. We'll generate one for you.

### **Step 3: Configure OAuth (Optional)**

If you want GitHub/Google sign-in, you'll need to set up OAuth apps.

### **Step 4: Database Setup**

Ensure your database is running and migrations are applied.

### **Step 5: Start Development Server**

Run the Next.js development server.

---

## 📋 Detailed Setup Instructions

### **1. Create Environment File**

Create a `.env.local` file in the root directory with:

```env
# Database (should already exist from Stage 2)
DATABASE_URL="postgresql://username:password@localhost:5432/trackmail"

# NextAuth Configuration
NEXTAUTH_SECRET="[WILL BE GENERATED]"
NEXTAUTH_URL="http://localhost:3000"

# API Key (should match your backend)
JOBMAIL_API_KEY="your-existing-api-key"

# Frontend API URL
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### **2. Generate NextAuth Secret**

Run this command to generate a secure secret:

**PowerShell:**
```powershell
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and add it to your `.env.local` file.

### **3. OAuth Setup (Optional but Recommended)**

#### **Option A: GitHub OAuth**

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Trackmail
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**
6. Add to `.env.local`:
   ```env
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"
   ```

#### **Option B: Google OAuth**

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. Select "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**
9. Add to `.env.local`:
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

### **4. Database Migrations**

Ensure your database is up to date:

```powershell
npm run db:generate
npm run db:migrate:dev
```

### **5. Start Development Server**

```powershell
npm run dev
```

The dashboard will be available at: **http://localhost:3000**

---

## 🔧 Troubleshooting

### **Issue: "NextAuth configuration error"**
- **Solution**: Ensure `NEXTAUTH_SECRET` is set in `.env.local`
- Generate a new one if needed

### **Issue: "Database connection failed"**
- **Solution**: Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run migrations: `npm run db:migrate:dev`

### **Issue: "OAuth provider not showing"**
- **Solution**: Check that both `GITHUB_ID` and `GITHUB_SECRET` are set
- Restart the dev server after adding OAuth credentials

### **Issue: "API calls failing"**
- **Solution**: Ensure `JOBMAIL_API_KEY` matches your backend configuration
- Check that the API routes are accessible

---

## 📱 Testing the Dashboard

Once running, you can:

1. **Sign In**: Visit http://localhost:3000 and sign in with GitHub/Google
2. **View Applications**: See the dashboard with your job applications
3. **Filter**: Test the filtering by status, source, date range
4. **Details**: Click on an application to see details
5. **Update Status**: Try changing an application's status

---

## 🚀 Production Deployment

### **Vercel (Recommended)**

1. **Push to GitHub**:
   ```powershell
   git add .
   git commit -m "Add Stage 4 web dashboard"
   git push
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables** in Vercel dashboard:
   - `DATABASE_URL` (production database)
   - `NEXTAUTH_SECRET` (same as local or generate new)
   - `NEXTAUTH_URL` (your Vercel URL, e.g., `https://trackmail.vercel.app`)
   - `JOBMAIL_API_KEY`
   - `NEXT_PUBLIC_API_URL` (your Vercel URL + /api)
   - OAuth credentials (if using)

4. **Deploy**: Vercel will automatically deploy

5. **Update OAuth Callback URLs**:
   - GitHub: Add `https://yourdomain.vercel.app/api/auth/callback/github`
   - Google: Add `https://yourdomain.vercel.app/api/auth/callback/google`

### **Other Platforms**

The app can be deployed to:
- **Railway**: `railway up`
- **DigitalOcean App Platform**: Connect via GitHub
- **AWS Amplify**: Connect via GitHub
- **Netlify**: Connect via GitHub

---

## 🔐 Security Considerations

### **Production Checklist**

- ✅ Generate new `NEXTAUTH_SECRET` for production
- ✅ Use production database URL
- ✅ Set up proper OAuth apps for production domain
- ✅ Enable HTTPS (automatic on Vercel)
- ✅ Set proper CORS policies if needed
- ✅ Review and rotate API keys regularly

---

## 📊 Monitoring

### **What to Monitor**

1. **API Response Times**: Check `/api/applications` performance
2. **Authentication**: Monitor sign-in success rates
3. **Database Queries**: Ensure queries are optimized
4. **Error Rates**: Track client-side errors

### **Tools**

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: For error tracking (optional)
- **Prisma Studio**: For database inspection (`npm run db:studio`)

---

## 🎯 Next Features to Consider

1. **Pagination**: Add pagination for very large datasets
2. **Bulk Actions**: Select multiple applications and update status
3. **Advanced Search**: Full-text search across all fields
4. **Analytics Dashboard**: Charts and statistics
5. **Email Notifications**: Alert on status changes
6. **Export**: Download applications as CSV/PDF
7. **Dark Mode**: Toggle between light/dark themes
8. **Application Notes**: Add custom notes to applications

---

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Check the terminal for server errors
3. Verify environment variables are set correctly
4. Ensure database is accessible
5. Review `README_WEB.md` for detailed documentation

---

**Happy Tracking! 🎉**


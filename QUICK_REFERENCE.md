# 🎯 JobMail Quick Reference Card

**One-page reference for common commands and workflows**

---

## 🚀 Quick Deploy (15 minutes)

```powershell
# Deploy everything to production
.\scripts\quick-deploy.ps1 -NeonDatabaseUrl "postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require"
```

---

## 📦 Local Development

```powershell
# Start dev server
npm run dev                    # http://localhost:3000

# Database
npm run db:migrate:dev         # Run migrations
npm run db:seed                # Add sample data
npm run db:studio              # Open DB GUI (localhost:5555)

# Testing
npm test                       # Run tests
npm run test:coverage          # Coverage report
```

---

## 🌐 Production Commands

### Vercel

```powershell
# Deploy
vercel --prod

# Logs
vercel logs --follow

# Environment variables
vercel env ls                  # List
vercel env add KEY production  # Add
vercel env rm KEY production   # Remove

# Rollback
vercel rollback
```

### Database

```powershell
# Run migrations
npx prisma migrate deploy

# Studio (production)
vercel env pull .env.production
npx prisma studio
```

### Apps Script

```powershell
cd apps-script

# Build and deploy
npm run build                  # Build TypeScript
npx clasp push                 # Push to Google
npx clasp deploy              # Create deployment

# Manage
npx clasp open                # Open editor
npx clasp logs                # View logs
```

---

## 🧪 Testing

```powershell
# Smoke tests
.\scripts\smoke-test-api.ps1 -ApiUrl "https://your-app.vercel.app" -ApiKey "your-key"

# Health check
.\scripts\daily-health-check.ps1 -ApiUrl "https://your-app.vercel.app" -ApiKey "your-key"

# Manual API test
curl https://your-app.vercel.app/api/health
```

---

## 🔑 Generate Keys

```powershell
# API key
.\scripts\generate-api-key.ps1

# NextAuth secret
.\scripts\generate-nextauth-secret.ps1

# Or manually
openssl rand -base64 32
```

---

## 📊 Monitoring

```powershell
# Health check
curl https://your-app.vercel.app/api/health

# List applications
curl https://your-app.vercel.app/api/applications?limit=10 `
  -H "Authorization: Bearer YOUR_API_KEY"

# Vercel dashboard
# https://vercel.com/dashboard

# Neon console
# https://console.neon.tech
```

---

## 🐛 Troubleshooting

```powershell
# Check API health
curl https://your-app.vercel.app/api/health

# Check database
curl https://your-app.vercel.app/api/applications?limit=1 `
  -H "Authorization: Bearer YOUR_API_KEY"

# Vercel logs
vercel logs --follow

# Apps Script logs
cd apps-script && npx clasp logs

# Test database locally
$env:DATABASE_URL="your-production-url"
npx prisma db execute --stdin
# Then: SELECT 1;
```

---

## 📋 Environment Variables

### Required (Production)

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require
JOBMAIL_API_KEY=your-generated-api-key
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Optional

```env
GITHUB_ID=your-oauth-client-id
GITHUB_SECRET=your-oauth-client-secret
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

---

## 🔧 Apps Script Configuration

**Script Properties (Project Settings):**

| Key | Value |
|-----|-------|
| `VERCEL_API_URL` | `https://your-app.vercel.app` |
| `JOBMAIL_API_KEY` | Your API key |
| `DASHBOARD_URL` | `https://your-app.vercel.app` |

---

## 📖 Documentation Map

| Task | Document |
|------|----------|
| **Quick deploy** | QUICKSTART_PRODUCTION.md |
| **Local setup** | SETUP_LOCAL.md |
| **Full deployment** | STAGE5_DEPLOYMENT_GUIDE.md |
| **Troubleshooting** | STAGE5_TROUBLESHOOTING.md |
| **API reference** | README_BACKEND.md |
| **Dashboard guide** | README_WEB.md |
| **Add-on setup** | apps-script/README_ADDON.md |
| **Architecture** | ARCHITECTURE.md |
| **Project status** | STATUS.md |

---

## 🎯 Common Workflows

### First-Time Setup

1. Create Neon database → Copy DATABASE_URL
2. Run `.\scripts\quick-deploy.ps1 -NeonDatabaseUrl "..."`
3. Deploy Apps Script (see QUICKSTART_PRODUCTION.md)
4. Test: Open Gmail → Open job email → Check add-on

### Daily Use

1. Receive job application email
2. Gmail add-on automatically parses it (hourly scan)
3. View in dashboard: `https://your-app.vercel.app`
4. Drag & drop to update status

### Making Changes

1. Edit code locally
2. Test: `npm test`
3. Commit: `git add . && git commit -m "..."`
4. Push: `git push origin main`
5. Vercel auto-deploys

### Updating Add-on

1. Edit `apps-script/src/*.ts`
2. Build: `npm run build`
3. Push: `npx clasp push`
4. Test in Gmail

---

## 🔗 Important URLs

### Development

- Local API: http://localhost:3000
- Local DB GUI: http://localhost:5555 (after `npm run db:studio`)

### Production

- Your API: `https://your-project.vercel.app`
- Vercel Dashboard: https://vercel.com/dashboard
- Neon Console: https://console.neon.tech
- Apps Script: https://script.google.com

### Documentation

- Apps Script API: https://script.google.com/home/usersettings
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://prisma.io/docs

---

## 💡 Quick Tips

### Performance

- Neon free tier auto-pauses → first query is slow
- Use Vercel Edge for faster cold starts
- Enable Next.js caching: `export const revalidate = 60`

### Security

- Never commit `.env` files
- Rotate API keys regularly
- Use different keys for dev/prod
- Enable 2FA on Vercel/Neon/GitHub

### Cost Optimization

- Start with free tiers
- Monitor usage dashboards
- Upgrade only when hitting limits
- Use connection pooling

### Debugging

- Check health endpoint first
- Review Vercel logs for API errors
- Check Apps Script executions for trigger issues
- Use `npx prisma studio` to inspect database

---

## 🆘 Emergency Commands

```powershell
# Rollback Vercel deployment
vercel rollback

# Stop local server
# Find PID: netstat -ano | findstr :3000
# Kill: taskkill /PID <PID> /F

# Reset local database
npx prisma db push --force-reset
npm run db:seed

# Re-authorize Apps Script
# Visit: https://myaccount.google.com/permissions
# Remove "JobMail" → Re-deploy → Grant permissions again
```

---

## 📊 Quick Status Check

```powershell
# All-in-one status check
echo "API Health:" && curl https://your-app.vercel.app/api/health
echo "Database:" && curl https://your-app.vercel.app/api/applications?limit=1 -H "Authorization: Bearer YOUR_KEY"
echo "Vercel:" && vercel ls
```

---

## 🎓 Support

- **Full Guides:** See `docs/` folder
- **Troubleshooting:** STAGE5_TROUBLESHOOTING.md
- **GitHub Issues:** (if public repo)
- **Status Pages:**
  - Vercel: https://vercel-status.com
  - Neon: https://neon.tech/status
  - Google: https://www.google.com/appsstatus

---

**Print this page for quick reference! 📄**

---

**Last Updated:** October 10, 2025


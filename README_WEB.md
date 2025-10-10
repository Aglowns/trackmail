# Trackmail Web Dashboard

A modern Next.js dashboard for tracking job applications with real-time updates and comprehensive filtering.

## Features

- 🔐 **Authentication** - Secure login with GitHub/Google OAuth
- 📊 **Dashboard** - Overview of all job applications with filters
- 📝 **Details View** - Detailed application information with timeline
- 🔄 **Status Updates** - Change application status with real-time updates
- 🚀 **Performance** - Virtualized table for handling 1000+ applications
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Data Fetching**: TanStack Query (React Query)
- **Database**: PostgreSQL (via Prisma)
- **Virtualization**: react-window
- **Notifications**: Sonner
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- GitHub/Google OAuth apps (optional)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd trackmail
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

3. **Configure your `.env.local`**:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/trackmail"
   
   # NextAuth
   NEXTAUTH_SECRET="your-random-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # OAuth (optional - for social login)
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # API Key (matches backend)
   JOBMAIL_API_KEY="your-api-key-here"
   
   # Frontend API URL
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   ```

4. **Set up the database**:
   ```bash
   npm run db:migrate:dev
   npm run db:seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   ```
   http://localhost:3000
   ```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/trackmail` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | `your-random-secret-key` |
| `NEXTAUTH_URL` | Your app's base URL | `http://localhost:3000` |
| `JOBMAIL_API_KEY` | API key for backend authentication | `your-api-key` |

### Optional (OAuth Providers)

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_ID` | GitHub OAuth app client ID | `Ov23li...` |
| `GITHUB_SECRET` | GitHub OAuth app client secret | `your-github-secret` |
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID | `your-google-client-id` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app client secret | `your-google-secret` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api` |

## OAuth Setup (Optional)

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Trackmail
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── apps/[id]/         # Application detail pages
│   ├── auth/              # Authentication pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard home
│   └── providers.tsx      # React Query & NextAuth providers
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── applications-table.tsx
│   ├── applications-filters.tsx
│   ├── application-details.tsx
│   ├── timeline.tsx
│   └── header.tsx
├── lib/                  # Utilities and configurations
│   ├── api.ts           # API client
│   ├── auth.ts          # NextAuth configuration
│   ├── hooks/           # React Query hooks
│   └── utils.ts         # Utility functions
├── middleware.ts         # NextAuth middleware
└── components.json       # shadcn/ui configuration
```

## Key Features

### Dashboard

- **Applications Table**: View all job applications in a sortable, filterable table
- **Advanced Filters**: Filter by status, source, date range, and search terms
- **Virtualization**: Handles 1000+ applications smoothly with react-window
- **Real-time Updates**: Status changes reflect immediately across the interface

### Application Details

- **Comprehensive View**: See all application details in one place
- **Status Updates**: Change application status with dropdown
- **Timeline**: Track application progress with event history
- **External Links**: Quick access to job postings

### Authentication

- **OAuth Integration**: Sign in with GitHub or Google
- **Session Management**: Secure JWT-based sessions
- **Protected Routes**: All pages require authentication

### Performance

- **React Query**: Intelligent caching and background updates
- **Virtualization**: Efficient rendering of large datasets
- **Optimistic Updates**: UI updates immediately for better UX
- **Loading States**: Skeleton loaders and loading indicators

## API Integration

The dashboard integrates with the backend API from Stage 2:

- `GET /api/applications` - List applications with filters
- `GET /api/applications/[id]` - Get single application
- `PATCH /api/applications/[id]/status` - Update application status
- `GET /api/events` - Get application timeline events

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:migrate:dev  # Run database migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database with test data

# Testing
npm run test            # Run tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage
```

### Adding New Features

1. **Components**: Add to `components/` directory
2. **Pages**: Add to `app/` directory using App Router
3. **API Routes**: Add to `app/api/` directory
4. **Hooks**: Add to `lib/hooks/` directory
5. **Utilities**: Add to `lib/` directory

### Styling

- Uses Tailwind CSS for utility-first styling
- shadcn/ui components for consistent design system
- Custom components follow the same patterns

### State Management

- React Query for server state
- React hooks for local state
- NextAuth for authentication state

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure `DATABASE_URL` is correct
2. **OAuth Errors**: Check callback URLs match exactly
3. **API Errors**: Verify `JOBMAIL_API_KEY` matches backend
4. **Build Errors**: Run `npm run db:generate` after schema changes

### Debug Mode

Set `NEXTAUTH_DEBUG=true` in `.env.local` for detailed NextAuth logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

# 📧 TrackMail Backend

Job application tracking system with email parsing - built with FastAPI and Supabase.

## 🎯 Overview

TrackMail helps job seekers organize and track their job applications by forwarding application emails. The system automatically parses emails to extract relevant information and maintains a timeline of each application's status.

### Key Features

- 🔐 **Secure Authentication**: JWT-based auth with Supabase
- 🛡️ **Row-Level Security**: Users can only access their own data
- 📧 **Email Parsing**: Automatically extract application details from emails
- 📊 **Status Tracking**: Monitor application progress through various stages
- 🎯 **RESTful API**: Clean, documented API with FastAPI
- 🐳 **Docker Ready**: Containerized for easy deployment

## 🏗️ Architecture

```
FastAPI Backend
    ↓
Supabase (PostgreSQL + Auth)
    ↓
Row-Level Security Policies
```

**Tech Stack:**
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with JWT
- **ORM**: Direct SQL + Supabase Client
- **Type Safety**: Pydantic for validation

## 📋 Prerequisites

- Python 3.11 or higher
- A Supabase account and project ([sign up here](https://supabase.com))
- Git

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd trackmail

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"
```

### 2. Configure Supabase

Follow the detailed guide in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to:
1. Create a Supabase project
2. Get your API keys and database URL
3. Configure environment variables

### 3. Set Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# See SUPABASE_SETUP.md for where to find these values
```

Your `.env` should contain:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
JWT_AUDIENCE=authenticated
JWT_ISSUER=https://xxxxx.supabase.co/auth/v1
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Run Database Migrations

```bash
# Apply the database schema
python scripts/apply_migrations.py
```

This creates:
- Tables: `profiles`, `applications`, `application_events`, `email_messages`
- Row-Level Security policies
- Indexes for performance
- Triggers for automatic timestamp updates

### 5. Start the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload

# The API will be available at:
# - API: http://localhost:8000
# - Docs: http://localhost:8000/docs
# - Health: http://localhost:8000/health
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Available Endpoints

#### Public Endpoints
- `GET /` - API information
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status

#### Protected Endpoints (Require Authentication)
All protected endpoints require a JWT token from Supabase Auth.

**Applications:**
- `GET /applications` - List user's applications (with filters & pagination)
- `POST /applications` - Create new application
- `GET /applications/{id}` - Get application details
- `PATCH /applications/{id}` - Update application
- `DELETE /applications/{id}` - Delete application

**Events:**
- `GET /applications/{id}/events` - Get event history
- `POST /applications/{id}/events` - Create custom event

**Email Ingestion:**
- `POST /ingest/email` - Process forwarded email
- `POST /ingest/email/test` - Test email parsing (dry-run)

### Example API Calls

All protected endpoints require an Authorization header with a Supabase JWT token:
```bash
Authorization: Bearer <your-supabase-jwt-token>
```

#### Create an Application
```bash
curl -X POST http://localhost:8000/applications \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Acme Corp",
    "position": "Senior Software Engineer",
    "status": "applied",
    "location": "San Francisco, CA",
    "source_url": "https://acme.com/careers/123",
    "notes": "Found via LinkedIn, referral from John"
  }'
```

#### List Applications with Filters
```bash
# Get all applications
curl -X GET http://localhost:8000/applications \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"

# Filter by status
curl -X GET "http://localhost:8000/applications?status=interviewing" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"

# Search by company name
curl -X GET "http://localhost:8000/applications?company=acme" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"

# With pagination
curl -X GET "http://localhost:8000/applications?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"
```

#### Update an Application
```bash
# Partial update (only provided fields are updated)
curl -X PATCH http://localhost:8000/applications/APP_ID_HERE \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "interviewing",
    "notes": "First round interview scheduled for Monday"
  }'
```

#### Get Application Details
```bash
curl -X GET http://localhost:8000/applications/APP_ID_HERE \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"
```

#### Delete an Application
```bash
curl -X DELETE http://localhost:8000/applications/APP_ID_HERE \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"
```

#### Ingest an Email
```bash
# The Gmail Add-on or email forwarding service calls this endpoint
curl -X POST http://localhost:8000/ingest/email \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "jobs@acme.com",
    "subject": "Application Received - Software Engineer",
    "text_body": "Thank you for applying to Acme Corp for the Software Engineer position...",
    "html_body": "<html>...</html>",
    "received_at": "2025-10-13T10:00:00Z",
    "parsed_company": "Acme Corp",
    "parsed_position": "Software Engineer",
    "parsed_status": "applied"
  }'
```

#### Test Email Parsing (Dry Run)
```bash
# Test what would be extracted without creating an application
curl -X POST http://localhost:8000/ingest/email/test \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "jobs@example.com",
    "subject": "Thanks for applying - Backend Developer",
    "text_body": "We received your application..."
  }'
```

#### Create an Event
```bash
# Manually add an event to track interview, call, etc.
curl -X POST http://localhost:8000/applications/APP_ID_HERE/events \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "phone_screen",
    "status": "screening",
    "notes": "30min phone screen with recruiter Jane. Technical interview next week.",
    "metadata": {
      "interviewer": "Jane Smith",
      "duration_minutes": 30,
      "scheduled_next": "2025-10-20"
    }
  }'
```

#### Get Event History
```bash
# See all events for an application
curl -X GET http://localhost:8000/applications/APP_ID_HERE/events \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"
```

### Getting Your JWT Token

To get a Supabase JWT token for testing:

1. **Sign up a test user** in Supabase Dashboard → Authentication → Users
2. **Use the Supabase JS client** to get a token:
   ```javascript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'test@example.com',
     password: 'your-password'
   })
   
   const token = data.session.access_token
   console.log('JWT Token:', token)
   ```
3. **Or use the Supabase CLI** to generate a token for testing

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_health.py

# View coverage report
open htmlcov/index.html  # macOS
start htmlcov/index.html  # Windows
```

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the Docker image
docker build -t trackmail-backend .

# Run the container
docker run -p 8000:8000 --env-file .env trackmail-backend

# Run with multiple workers for production
docker run -p 8000:8000 --env-file .env -e WORKERS=4 trackmail-backend
```

### Docker Compose (Coming Soon)

```yaml
# docker-compose.yml example
services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    environment:
      - WORKERS=4
    restart: unless-stopped
```

## 🔧 Development

### Code Quality

```bash
# Format code with ruff
ruff format .

# Lint code
ruff check .

# Type check with mypy
mypy app/

# Run all checks
ruff check . && mypy app/ && pytest
```

### Project Structure

```
trackmail/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Configuration management
│   ├── auth.py           # JWT authentication
│   ├── deps.py           # Shared dependencies
│   ├── db.py             # Database connections
│   ├── models.py         # Data models (future)
│   ├── schemas.py        # Pydantic schemas
│   ├── routers/          # API route handlers
│   │   ├── health.py
│   │   ├── applications.py
│   │   ├── ingest.py
│   │   └── events.py
│   └── services/         # Business logic
│       ├── parsing.py
│       ├── applications.py
│       └── emails.py
├── db/
│   └── migrations/       # SQL migrations
│       └── 0001_init.sql
├── scripts/
│   └── apply_migrations.py
├── tests/                # Test suite
├── .env.example          # Environment template
├── .gitignore
├── Dockerfile
├── pyproject.toml        # Dependencies
├── ruff.toml             # Linter config
├── mypy.ini              # Type checker config
└── README.md
```

## 🔐 Security

### Row-Level Security (RLS)

All database tables have RLS policies ensuring:
- Users can only view their own data
- Queries automatically filter by user ID
- Direct database access is also protected

### Authentication Flow

1. User logs in via Supabase Auth (frontend)
2. Frontend receives JWT access token
3. Frontend includes token in requests: `Authorization: Bearer <token>`
4. Backend validates JWT signature and extracts user ID
5. Database enforces RLS based on user ID

### Best Practices

- ✅ Never commit `.env` files
- ✅ Use environment variables for secrets
- ✅ Rotate keys if exposed
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

## 🐛 Troubleshooting

### Common Issues

**Database connection fails**
- Verify `DATABASE_URL` is correct
- Check database password
- Ensure IP is allowed in Supabase (allowed by default)

**JWT validation fails**
- Verify `JWT_ISSUER` matches your Supabase project URL
- Check that `JWT_AUDIENCE` is set to `authenticated`
- Ensure the token hasn't expired (1 hour lifetime)

**Import errors**
- Make sure you installed with `pip install -e ".[dev]"`
- Activate your virtual environment

**Port already in use**
- Change port: `uvicorn app.main:app --port 8001`
- Or kill the process using port 8000

## 📖 Learning Resources

This project is built with educational comments throughout the code. Each file includes:
- **What**: Inline comments explaining what the code does
- **Why**: Docstrings explaining why we made certain choices
- **How**: Examples showing how to use the code

### Key Concepts to Understand

- **FastAPI**: Modern Python web framework with automatic API docs
- **Pydantic**: Data validation using Python type hints
- **JWT**: Secure token-based authentication
- **RLS**: Database-level security policies
- **Dependency Injection**: Clean code pattern for shared resources

### Recommended Reading

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Introduction](https://jwt.io/introduction)

## 🗺️ Roadmap

- [x] Stage 1: Project bootstrap and structure
- [x] Stage 2: Database schema with RLS
- [x] Stage 3: JWT authentication
- [ ] Stage 4: CRUD operations for applications
- [ ] Stage 5: Email ingestion and parsing
- [ ] Stage 6: Comprehensive testing
- [ ] Stage 7: Frontend integration
- [ ] Stage 8: Advanced features (search, analytics, notifications)

## 📝 License

[Your chosen license]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

- Documentation: Check [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup help
- Issues: Open an issue on GitHub
- Email: [your-email]

---

Built with ❤️ using FastAPI and Supabase

#   T r a c k M a i l   B a c k e n d   -   D e p l o y e d   o n   1 0 / 1 5 / 2 0 2 5   2 2 : 4 5 : 0 9  
 #   F u l l   T r a c k M a i l   B a c k e n d   -   D e p l o y e d   1 0 / 1 6 / 2 0 2 5   2 1 : 5 3 : 1 1  
 
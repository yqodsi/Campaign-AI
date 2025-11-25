# Email Campaign Automation - MVP

A SaaS application for automated, AI-powered email campaigns.

## Features

- ✅ Create email campaigns with daily/weekly schedules
- ✅ Configure duration, timezone, and AI agent per campaign
- ✅ Add leads manually or import via CSV
- ✅ AI-generated email content using OpenAI
- ✅ Pause/Resume/Cancel campaigns
- ✅ Idempotent email scheduling (no duplicates)
- ✅ Background job processing with BullMQ

## Quick Start (Docker)

```bash
# 1. Clone and setup
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 2. Start everything
docker-compose up --build

# 3. Open browser
open http://localhost:3000
```

## Development (Local)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start PostgreSQL and Redis (or use Docker)
# PostgreSQL should be running on localhost:5432
# Redis should be running on localhost:6379

# 4. Run migrations and seed
npx prisma migrate dev
npx prisma db seed

# 5. Start development servers
npm run dev:all
# This starts both Next.js dev server and BullMQ worker
```

## Architecture

### Scalability Considerations

1. **Queue-based processing**: BullMQ with Redis ensures reliable job processing
2. **Idempotency**: Unique constraints prevent duplicate emails
3. **Worker separation**: Workers run as separate processes, can scale horizontally
4. **Database indexes**: Optimized queries for status and date filtering

### For Production

- Add connection pooling (PgBouncer)
- Use Redis Cluster for high availability
- Deploy workers on separate containers/pods
- Add rate limiting for OpenAI API calls
- Implement proper email service (SendGrid, Resend)
- Add authentication and authorization
- Implement proper error monitoring (Sentry, etc.)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/campaigns | List campaigns |
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns/:id | Get campaign |
| PATCH | /api/campaigns/:id | Update campaign |
| DELETE | /api/campaigns/:id | Delete campaign |
| POST | /api/campaigns/:id/start | Activate campaign |
| POST | /api/campaigns/:id/pause | Pause campaign |
| POST | /api/campaigns/:id/resume | Resume campaign |
| POST | /api/campaigns/:id/cancel | Cancel campaign |
| GET | /api/campaigns/:id/leads | List leads |
| POST | /api/campaigns/:id/leads | Add lead |
| POST | /api/campaigns/:id/leads/import | CSV import |
| DELETE | /api/campaigns/:id/leads/:leadId | Delete lead |
| GET | /api/agents | List AI agents |
| POST | /api/agents | Create AI agent |
| GET | /api/agents/:id | Get agent |
| PATCH | /api/agents/:id | Update agent |
| DELETE | /api/agents/:id | Delete agent |
| POST | /api/emails/:id/regenerate | Regenerate email |
| POST | /api/emails/:id/approve | Approve and send email |
| POST | /api/cron/process | Trigger campaign processing |

## Tech Stack

- Next.js 14 (App Router)
- PostgreSQL + Prisma
- Redis + BullMQ
- OpenAI API
- Tailwind CSS + shadcn/ui
- Docker

## Testing the Flow

1. Create an AI Agent with a system prompt
2. Create a Campaign, select the agent, set schedule
3. Add leads to the campaign
4. Start the campaign
5. Watch emails get generated and "sent" in logs

## Manual Cron Trigger

For testing, you can manually trigger the campaign processor:

```bash
curl -X POST http://localhost:3000/api/cron/process
```

Or with authentication (if CRON_SECRET is set):

```bash
curl -X POST http://localhost:3000/api/cron/process \
  -H "Authorization: Bearer your-secret-key"
```

## Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Create a new migration
npm run db:migrate

# Seed the database
npm run db:seed
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── campaigns/         # Campaign pages
│   ├── agents/           # Agent pages
│   └── page.tsx          # Dashboard
├── components/           # React components
│   ├── ui/               # shadcn/ui components
│   ├── campaigns/        # Campaign components
│   ├── leads/            # Lead components
│   └── agents/           # Agent components
├── lib/                  # Library code
│   ├── services/         # Business logic
│   ├── validations/      # Zod schemas
│   └── constants/        # Constants
├── prisma/               # Prisma schema and migrations
└── worker.ts            # BullMQ worker (runs separately)
```

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key
- `CRON_SECRET`: Secret for cron endpoint authentication (optional)
- `NEXT_PUBLIC_APP_URL`: Public URL of the app

## License

MIT

# email_automation

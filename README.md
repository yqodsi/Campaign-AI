# Campaign AI - Email Automation Platform

A modern SaaS application for automated, AI-powered email campaigns with intelligent scheduling and personalization.

## ✨ Features

- 🤖 **AI-Powered Content** - Generate personalized emails using OpenAI
- 📅 **Smart Scheduling** - Daily/weekly schedules with timezone support
- 👥 **Lead Management** - Manual entry or CSV import
- 🎯 **Campaign Control** - Start, pause, resume, or cancel campaigns
- 📊 **Real-time Dashboard** - Monitor campaigns and email performance
- 🔄 **Background Processing** - Reliable job queue with BullMQ
- 🎨 **Modern UI** - Beautiful interface built with shadcn/ui

## 🚀 Quick Start

### Fast Test Run

```bash
docker-compose down -v
docker-compose up --build
```

### Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd campaign-ai

# 2. Setup environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Start all services
docker-compose up --build

# 4. Open in browser
http://localhost:3000
```

## 📖 How It Works

1. **Create AI Agents** - Define personality and writing style
2. **Create Campaigns** - Set schedule, timezone, and duration
3. **Add Leads** - Import from CSV or add manually
4. **Start Campaign** - Activate and let AI handle the rest
5. **Monitor Progress** - Track emails generated and sent

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis + BullMQ
- **AI**: OpenAI GPT-4
- **Deployment**: Docker

## 📁 Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── campaigns/        # Campaign pages
│   ├── agents/          # AI agent management
│   ├── leads/           # Lead management
│   └── page.tsx         # Dashboard
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── app-sidebar.tsx  # Navigation sidebar
│   └── site-header.tsx  # Header component
├── lib/
│   ├── services/        # Business logic
│   ├── validations/     # Zod schemas
│   └── constants/       # App constants
├── prisma/
│   └── schema.prisma    # Database schema
└── worker.ts           # Background job processor
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/campaign_ai"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI
OPENAI_API_KEY="sk-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Cron authentication
CRON_SECRET="your-secret-key"
```

## 🔌 API Endpoints

### Campaigns

- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PATCH /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/campaigns/:id/pause` - Pause campaign
- `POST /api/campaigns/:id/resume` - Resume campaign
- `POST /api/campaigns/:id/cancel` - Cancel campaign

### Leads

- `GET /api/leads` - List all leads
- `POST /api/leads` - Create lead
- `POST /api/leads/import` - Import leads from CSV
- `GET /api/campaigns/:id/leads` - Get campaign leads
- `POST /api/campaigns/:id/leads` - Add lead to campaign
- `DELETE /api/campaigns/:id/leads/:leadId` - Remove lead

### AI Agents

- `GET /api/agents` - List AI agents
- `POST /api/agents` - Create AI agent
- `GET /api/agents/:id` - Get agent details
- `PATCH /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Emails

- `POST /api/emails/:id/regenerate` - Regenerate email content
- `POST /api/emails/:id/approve` - Approve and send email

### System

- `GET /api/dashboard` - Dashboard statistics
- `POST /api/cron/process` - Trigger campaign processing



## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [BullMQ](https://docs.bullmq.io/)
- [OpenAI](https://openai.com/)

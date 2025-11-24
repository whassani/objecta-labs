# Objecta Labs - Multi-Tenant AI Agent Platform

🤖 Build, deploy, and manage AI agents with advanced capabilities including knowledge base integrations and action execution.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis (optional, for caching)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run start:dev
```

Backend will run on http://localhost:3001
API Documentation: http://localhost:3001/api/docs

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Frontend will run on http://localhost:3000

## 📚 Documentation

See the `/docs` folder and project markdown files for detailed documentation:
- [Architecture](./architecture/system-architecture.md)
- [Database Schema](./architecture/database-schema.sql)
- [Features](./product/features.md)
- [Tech Stack](./development/tech-stack.md)

## 🏗️ Project Structure

```
agentforge/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/   # Feature modules
│   │   ├── main.ts    # Application entry
│   │   └── app.module.ts
│   └── package.json
├── frontend/          # Next.js UI
│   ├── src/
│   │   ├── app/       # Next.js 14 app router
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   └── package.json
├── architecture/      # System design docs
├── product/          # Product specs
└── README.md
```

## 🔑 Key Features

- ✅ **Multi-tenant architecture** - Organization and workspace isolation
- ✅ **AI Agent Builder** - Create custom agents with system prompts
- ✅ **Knowledge Base** - Connect to GitHub, Confluence, Notion, Jira, etc.
- ✅ **Agent Actions** - Execute CRUD operations across systems
- ✅ **Conversations** - Chat with agents and maintain history
- ✅ **Fine-tuning** - Train custom models (planned)

## 🛠️ Tech Stack

**Backend:**
- NestJS (TypeScript)
- PostgreSQL + TypeORM
- LangChain for AI
- JWT Authentication
- Swagger API docs

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- TypeScript
- React Query

## 📦 Database Setup

```bash
# Create PostgreSQL database
createdb agentforge

# Run migrations (auto with synchronize in dev)
npm run start:dev
```

## 🔐 Environment Variables

### Backend (.env)
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=agentforge
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧪 Testing

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:3001/api/docs

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 🔗 Links

- [Product Roadmap](./product/roadmap.md)
- [Business Plan](./business/business-plan.md)
- [Go-to-Market Strategy](./marketing/go-to-market.md)

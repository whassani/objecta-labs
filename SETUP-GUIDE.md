# AgentForge Setup Guide

This guide will help you set up the complete AgentForge application (Backend + Frontend).

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed
- **PostgreSQL 14+** installed and running
- **Git** installed
- (Optional) **Redis** for caching

## Quick Setup

### 1. Run the Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install all backend dependencies
- Install all frontend dependencies
- Create `.env` files from examples

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Using psql
createdb agentforge

# Or using SQL
psql -U postgres
CREATE DATABASE agentforge;
\q
```

### 3. Configure Environment Variables

#### Backend (`backend/.env`)

Update the following variables:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=agentforge

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: Pinecone for vector storage
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX=agentforge

# Optional: Ollama for local models
USE_OLLAMA=false
OLLAMA_BASE_URL=http://localhost:11434
```

#### Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Running the Application

### Option 1: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using Start Script

Create `start.sh`:
```bash
#!/bin/bash
cd backend && npm run start:dev &
cd frontend && npm run dev &
wait
```

## Access the Application

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs (Swagger)

## Initial Setup Steps

1. **Open the Frontend**: Navigate to http://localhost:3000
2. **Register**: Click "Get Started" or "Sign up"
3. **Fill in the form**:
   - Email
   - Password (min 8 characters)
   - First Name
   - Last Name
   - Organization Name
4. **Login**: You'll be automatically logged in after registration
5. **Explore**: Start creating agents, adding knowledge bases, etc.

## Project Structure

```
agentforge/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── agents/      # AI Agents
│   │   │   ├── knowledge-base/  # Data sources
│   │   │   ├── tools/       # Agent tools
│   │   │   └── conversations/   # Chat
│   │   ├── main.ts          # Entry point
│   │   └── app.module.ts    # Root module
│   ├── package.json
│   └── .env
│
├── frontend/                 # Next.js UI
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   │   ├── (auth)/      # Auth pages
│   │   │   └── (dashboard)/ # Dashboard pages
│   │   ├── components/      # Reusable components
│   │   │   └── layout/      # Sidebar, Header
│   │   └── lib/             # Utilities
│   │       ├── api.ts       # API client
│   │       └── store.ts     # State management
│   ├── package.json
│   └── .env
│
└── architecture/             # Documentation
```

## Features Available in UI

### ✅ Completed
- User authentication (Login/Register)
- Dashboard with stats
- Agent management (Create, List, View, Edit, Delete)
- Knowledge Base (Data sources list)
- Tools & Actions (List)
- Conversations (List, Chat interface)
- Workspaces (List)
- Settings page

### 🔄 Backend Ready, Logic Pending
- Agent execution with LangChain
- Knowledge base sync (GitHub, Confluence, Notion, Jira, etc.)
- Tool execution (CRUD operations)
- Vector embeddings (Pinecone)
- Real AI responses in conversations

## Next Steps - Implementation

The UI is fully implemented. The backend structure is ready. Now you need to implement:

1. **LangChain Integration**
   - Connect OpenAI/Ollama models
   - Implement agent execution logic
   - Add conversation memory

2. **Knowledge Base Sync**
   - Implement GitHub integration
   - Implement Confluence integration
   - Implement Notion integration
   - Implement Jira integration
   - Document processing pipeline

3. **Vector Database**
   - Set up Pinecone
   - Implement embedding generation
   - Implement semantic search

4. **Agent Tools**
   - Implement database query tool
   - Implement API call tool
   - Implement file operations tool
   - Permission system

## Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -U postgres -h localhost -d agentforge
```

### Port Already in Use

```bash
# Find process using port 3001 (backend)
lsof -i :3001

# Find process using port 3000 (frontend)
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Reinstall dependencies
cd backend && rm -rf node_modules package-lock.json && npm install
cd frontend && rm -rf node_modules package-lock.json && npm install
```

## Development Tips

### Backend Development

- API docs auto-generated at `/api/docs`
- Hot reload enabled with `npm run start:dev`
- TypeORM auto-syncs schema in development

### Frontend Development

- Hot reload enabled
- React Query dev tools available
- Dark mode supported

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [LangChain Documentation](https://js.langchain.com/docs)
- [TypeORM Documentation](https://typeorm.io)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## Support

For issues or questions:
1. Check the documentation in `/docs` folder
2. Review the specs in `/product` folder
3. Check the architecture diagrams in `/architecture` folder

## License

Proprietary - All rights reserved

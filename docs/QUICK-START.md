# ⚡ Quick Start Guide

## Get Running in 10 Minutes

---

## Prerequisites

- Node.js 18+
- Docker Desktop
- 5GB free disk space

---

## Step 1: Clone & Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/objecta-labs
cd objecta-labs

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

---

## Step 2: Start Services (3 minutes)

```bash
# Start PostgreSQL, Qdrant, and Redis
docker-compose up -d

# Install and start Ollama (in new terminal)
# macOS
brew install ollama
ollama serve

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve

# Pull embedding model
ollama pull nomic-embed-text
```

---

## Step 3: Configure Environment (1 minute)

```bash
# Backend
cd backend
cp .env.example .env
# Edit if needed (defaults work for local dev)

# Frontend
cd ../frontend
cp .env.example .env
# Edit if needed (defaults work for local dev)
```

---

## Step 4: Start Applications (2 minutes)

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev
# Wait for: "Application is running on: http://localhost:3001"

# Terminal 2 - Frontend
cd frontend
npm run dev
# Wait for: "ready - started server on http://localhost:3000"
```

---

## Step 5: First Use (2 minutes)

### 1. Register Account
```
1. Open: http://localhost:3000
2. Click "Register"
3. Fill in details
4. Click "Create Account"
```

### 2. Upload Document
```
1. Go to: Knowledge Base
2. Click: Documents tab
3. Click: Upload Document
4. Drag & drop a PDF or text file
5. Wait for "completed" status
```

### 3. Create Agent
```
1. Go to: Agents
2. Click: New Agent
3. Fill in:
   - Name: "Doc Assistant"
   - System Prompt: "You help answer questions about our docs"
   - ☑ Enable Knowledge Base (RAG)
4. Click: Create
```

### 4. Chat!
```
1. Go to: Conversations
2. Click: New Conversation
3. Select: Your agent
4. Ask: "What's in the document?"
5. See magic! ✨ Sources appear!
```

---

## Verify Everything Works

### ✅ Checklist

- [ ] PostgreSQL running: `docker ps | grep postgres`
- [ ] Qdrant running: `docker ps | grep qdrant`
- [ ] Ollama running: `ollama list`
- [ ] Backend running: `curl http://localhost:3001/api/health`
- [ ] Frontend running: Open http://localhost:3000
- [ ] Can register/login
- [ ] Can upload document
- [ ] Document status: "completed"
- [ ] Can create agent with RAG
- [ ] Can start conversation
- [ ] Agent uses documents
- [ ] Sources appear in response

---

## Common Issues

### "Ollama connection refused"
```bash
# Start Ollama
ollama serve

# Verify
curl http://localhost:11434/api/tags
```

### "Model not found"
```bash
# Pull model
ollama pull nomic-embed-text

# Verify
ollama list
```

### "Database connection error"
```bash
# Check Docker
docker-compose ps

# Restart if needed
docker-compose restart postgres
```

---

## Next Steps

Now that everything works:

1. 📚 Read the [User Guide](./USER-GUIDE.md)
2. 🔌 Check the [API Reference](./API-REFERENCE.md)
3. 📊 Explore Analytics features
4. 🔍 Try different search modes
5. 🎨 Customize your agents

---

## Quick Commands

```bash
# Start everything
docker-compose up -d
ollama serve &
cd backend && npm run start:dev &
cd frontend && npm run dev

# Stop everything
pkill -f "npm run start:dev"
pkill -f "npm run dev"
docker-compose down
pkill ollama

# Reset database
docker-compose down -v
docker-compose up -d

# View logs
docker-compose logs -f
pm2 logs (if using PM2)
```

---

**⚡ You're ready to go! Start building intelligent agents!**

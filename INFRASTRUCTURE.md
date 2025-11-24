# Infrastructure Setup - Open Source Stack

This project uses **100% free and open-source** infrastructure components.

## 🎯 Technology Stack

### Core Services

| Service | Technology | Why | License |
|---------|-----------|-----|---------|
| **Database** | PostgreSQL 14 | Robust relational database | PostgreSQL License (Open Source) |
| **Vector DB** | Qdrant | Fast vector similarity search | Apache 2.0 |
| **Cache** | Redis | In-memory caching | BSD 3-Clause |
| **Backend** | NestJS | Enterprise Node.js framework | MIT |
| **Frontend** | Next.js 14 | React framework | MIT |
| **AI/ML** | LangChain | LLM orchestration | MIT |

### LLM Options

| Option | Cost | Best For | Setup |
|--------|------|----------|-------|
| **Ollama** | Free | Development, privacy | Local installation |
| **OpenAI** | Pay-per-use | Production, quality | API key required |
| **Anthropic Claude** | Pay-per-use | Production, long context | API key required |

---

## 🐳 Docker Setup (Recommended)

### Start All Services

```bash
# Start PostgreSQL + Qdrant + Redis
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Service URLs

- PostgreSQL: `localhost:5432`
- Qdrant: `http://localhost:6333`
- Qdrant Dashboard: `http://localhost:6333/dashboard`
- Redis: `localhost:6379`

---

## 📦 Qdrant Vector Database

### Why Qdrant?

✅ **100% Free and Open Source** (Apache 2.0 license)
✅ **No API keys required** for local development
✅ **Fast** - Written in Rust
✅ **Easy to use** - Simple REST and gRPC APIs
✅ **Scalable** - Production-ready
✅ **Multi-tenant** - Built-in payload filtering

### Docker Setup

```bash
# Using docker-compose (recommended)
docker-compose up -d qdrant

# Or standalone
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \
  qdrant/qdrant
```

### Manual Installation

```bash
# Download binary
wget https://github.com/qdrant/qdrant/releases/latest/download/qdrant

# Make executable
chmod +x qdrant

# Run
./qdrant
```

### Verify Installation

```bash
# Check if Qdrant is running
curl http://localhost:6333/collections

# Response: {"result":{"collections":[]}}
```

### Web Dashboard

Access the built-in dashboard at:
```
http://localhost:6333/dashboard
```

---

## 🦙 Ollama (Local LLM)

### Why Ollama?

✅ **Completely Free** - No API costs
✅ **Privacy** - Everything runs locally
✅ **Fast** - Optimized for local hardware
✅ **No Internet Required** - After model download
✅ **Multiple Models** - Llama 2, Mistral, CodeLlama, etc.

### Installation

```bash
# macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download/windows
```

### Download Models

```bash
# Download Llama 2 (7B)
ollama pull llama2

# Download Mistral (7B) - Good balance of speed/quality
ollama pull mistral

# Download CodeLlama (for code tasks)
ollama pull codellama

# Download smaller model for testing (1.5B)
ollama pull phi
```

### Test Ollama

```bash
# Run a test query
ollama run mistral "Hello, how are you?"

# Check running models
ollama list
```

### Configure in Backend

```env
# backend/.env
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

---

## 🗄️ PostgreSQL

### Using Docker (Recommended)

```bash
# Start with docker-compose
docker-compose up -d postgres

# Connect
psql -h localhost -U postgres -d objecta_labs
```

### Manual Installation

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb objecta_labs
```

**Ubuntu:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb objecta_labs
```

**Windows:**
```bash
# Download installer from postgresql.org
# Use pgAdmin or psql to create database
```

---

## 💾 Redis (Optional)

### Using Docker

```bash
# Start with docker-compose
docker-compose up -d redis

# Test connection
redis-cli ping
# Response: PONG
```

### Manual Installation

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

---

## 🚀 Complete Setup

### Option 1: Docker (Easiest)

```bash
# 1. Start all services
docker-compose up -d

# 2. Verify all services are running
docker-compose ps

# 3. Continue with backend/frontend setup
cd backend && npm install
cd frontend && npm install
```

### Option 2: Manual Setup

```bash
# 1. Install PostgreSQL
createdb objecta_labs

# 2. Install and start Qdrant
docker run -d -p 6333:6333 qdrant/qdrant

# 3. Install Ollama (optional)
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull mistral

# 4. Install Redis (optional)
# Platform-specific installation

# 5. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with service URLs

# 6. Start services
cd backend && npm run start:dev
cd frontend && npm run dev
```

---

## 🔧 Environment Configuration

### backend/.env

```env
# Database (Free - PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=objecta_labs

# Vector DB (Free - Qdrant)
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=objecta_labs

# LLM (Choose one)
# Option 1: Ollama (Free, Local)
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Option 2: OpenAI (Paid)
# USE_OLLAMA=false
# OPENAI_API_KEY=sk-your-key

# Cache (Free - Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 💰 Cost Comparison

### Our Open Source Stack (Objecta Labs)

| Component | Cost | Setup |
|-----------|------|-------|
| PostgreSQL | **FREE** | Docker or local |
| Qdrant | **FREE** | Docker or local |
| Redis | **FREE** | Docker or local |
| Ollama | **FREE** | Local installation |
| **Total** | **$0/month** | ✅ |

### Alternative (Paid Services)

| Component | Cost | Notes |
|-----------|------|-------|
| PostgreSQL (AWS RDS) | ~$15/month | Smallest instance |
| Pinecone | ~$70/month | Starter plan |
| Redis (AWS) | ~$13/month | Smallest instance |
| OpenAI API | Variable | ~$0.002 per 1K tokens |
| **Total** | **~$98+/month** | ❌ |

**Savings: $98+/month by using open source!**

---

## 📊 Performance Comparison

### Qdrant vs Pinecone

| Feature | Qdrant (Open Source) | Pinecone (Commercial) |
|---------|---------------------|----------------------|
| Cost | FREE | $70+/month |
| Setup | Docker one-liner | Account + API key |
| Speed | Very Fast (Rust) | Very Fast |
| Multi-tenant | ✅ Built-in | ✅ Namespaces |
| Self-hosted | ✅ Yes | ❌ No |
| API Keys | ❌ Not required | ✅ Required |
| Privacy | ✅ Full control | ⚠️ Data on cloud |

### Ollama vs OpenAI

| Feature | Ollama (Local) | OpenAI (API) |
|---------|---------------|--------------|
| Cost | FREE | ~$0.002/1K tokens |
| Privacy | ✅ Complete | ⚠️ Data sent to API |
| Speed | Fast (local GPU) | Fast |
| Quality | Good (7B-13B) | Excellent (GPT-4) |
| Internet | Not needed | Required |
| Setup | One command | API key |

---

## 🎓 Getting Started

### Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone <repo-url>
cd objecta-labs

# 2. Start infrastructure
docker-compose up -d

# 3. Install dependencies
./setup.sh

# 4. Configure
cp backend/.env.example backend/.env
# Edit if needed (defaults work!)

# 5. Start backend
cd backend && npm run start:dev

# 6. Start frontend (new terminal)
cd frontend && npm run dev

# 7. Open browser
open http://localhost:3000
```

---

## 🔍 Monitoring & Management

### Qdrant Dashboard
```
http://localhost:6333/dashboard
```

View collections, inspect vectors, test queries

### PostgreSQL
```bash
# Connect via psql
psql -h localhost -U postgres -d objecta_labs

# Or use GUI tools:
# - pgAdmin
# - DBeaver
# - TablePlus
```

### Redis
```bash
# Connect via redis-cli
redis-cli

# Or use GUI tools:
# - RedisInsight (free from Redis)
# - Medis
```

---

## 🐛 Troubleshooting

### Qdrant not starting
```bash
# Check if port is in use
lsof -i :6333

# Remove old container
docker rm -f objecta_labs_qdrant

# Restart
docker-compose up -d qdrant
```

### PostgreSQL connection error
```bash
# Check if running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Ollama model not found
```bash
# List downloaded models
ollama list

# Download missing model
ollama pull mistral
```

---

## 📚 Further Reading

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [LangChain Documentation](https://js.langchain.com/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✅ Summary

**Objecta Labs uses 100% free, open-source infrastructure:**

✅ No vendor lock-in
✅ No monthly fees
✅ Full data privacy
✅ Easy to deploy
✅ Production-ready
✅ Self-hosted option

**Total cost: $0/month** 🎉

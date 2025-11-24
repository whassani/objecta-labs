# 🚀 AgentForge Technology Stack Summary

## Complete TypeScript/JavaScript Stack

AgentForge is built entirely on modern TypeScript/JavaScript technologies for a unified, developer-friendly experience.

---

## 📦 Technology Overview

### Backend: NestJS
- **Framework**: NestJS 10+ (Enterprise TypeScript framework)
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5+
- **Architecture**: Modular, microservices-ready

### Database: TypeORM + PostgreSQL
- **ORM**: TypeORM 0.3+ (TypeScript-first)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Vector DB**: Pinecone or Weaviate

### AI/ML: LangChain.js
- **Framework**: LangChain.js 0.1+
- **Providers (Production)**: OpenAI, Anthropic, Hugging Face
- **Testing**: Ollama (local models - free!) ⭐ NEW
- **Features**: RAG, Agents, Memory, Streaming

### Frontend: Next.js
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 3+
- **State**: Zustand 4+

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (AWS EKS)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

---

## 🎯 Key Benefits

### 1. Unified Language Stack
- **One Language**: TypeScript everywhere
- **Code Sharing**: Types, utils, validation shared between FE/BE
- **Single Toolchain**: npm/pnpm, ESLint, Prettier, Jest
- **Easier Hiring**: Full-stack TypeScript developers

### 2. Modern Developer Experience
- **Type Safety**: End-to-end type checking
- **Auto-completion**: Excellent IDE support
- **Hot Reload**: Fast development iteration
- **Decorators**: Clean, readable code with NestJS decorators

### 3. Enterprise-Grade Architecture
- **Dependency Injection**: Built into NestJS
- **Modular Design**: Easy to scale and maintain
- **Testing**: Jest for everything (unit, integration, e2e)
- **Documentation**: Auto-generated with Swagger

### 4. AI-First Design
- **LangChain.js**: Full AI orchestration framework
- **Multi-LLM**: Easy to switch between providers
- **Streaming**: Real-time responses
- **RAG Ready**: Built-in vector store support

---

## 🔧 Core Technologies Detail

### Backend Stack

```json
{
  "dependencies": {
    "@nestjs/core": "^10.2.0",
    "@nestjs/common": "^10.2.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/swagger": "^7.1.0",
    "@nestjs/jwt": "^10.1.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/bull": "^10.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "ioredis": "^5.3.0",
    "bull": "^4.11.0",
    "langchain": "^0.1.0",
    "@langchain/openai": "^0.0.19",
    "@langchain/anthropic": "^0.0.5",
    "@pinecone-database/pinecone": "^1.1.0",
    "bcrypt": "^5.1.0",
    "passport-jwt": "^4.0.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "helmet": "^7.1.0"
  }
}
```

### Frontend Stack

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "langchain": "^0.1.0"
  }
}
```

---

## 🏗️ Architecture Patterns

### Backend (NestJS)

**Module Structure**:
```
src/
├── modules/
│   ├── auth/          # Authentication & authorization
│   ├── users/         # User management
│   ├── agents/        # AI agent management
│   ├── conversations/ # Chat & messaging
│   ├── documents/     # Knowledge base
│   ├── langchain/     # LangChain integration
│   └── billing/       # Payments (Stripe)
├── common/            # Shared utilities
├── config/            # Configuration
└── database/          # Migrations & seeds
```

**Key Patterns**:
- Dependency Injection (DI)
- Repository Pattern (TypeORM)
- DTO Validation (class-validator)
- Guards for Authorization
- Interceptors for Logging
- Pipes for Transformation

### Frontend (Next.js)

**App Structure**:
```
src/
├── app/              # Next.js 14 app directory
├── components/       # React components
│   ├── agents/      # Agent-specific
│   ├── chat/        # Chat interface
│   ├── dashboard/   # Dashboard views
│   └── ui/          # Reusable UI (shadcn/ui)
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── services/        # API clients
└── store/           # Zustand stores
```

**Key Patterns**:
- Server Components (Next.js 14)
- Client Components for interactivity
- React Query for server state
- Zustand for client state
- Custom hooks for reusable logic

---

## 🔐 Security & Authentication

### Authentication Flow
1. User registers/logs in
2. JWT token issued (15 min expiry)
3. Refresh token issued (7 days)
4. Token stored in httpOnly cookie
5. Guards protect routes

### Security Features
- **Helmet**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: @nestjs/throttler
- **Input Validation**: class-validator
- **Password Hashing**: bcrypt
- **SQL Injection Protection**: TypeORM parameterized queries
- **XSS Protection**: React escaping + helmet

---

## 🤖 AI Integration

### LangChain.js Architecture

```typescript
// Example: Creating an AI agent
import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';

const llm = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.7,
});

const memory = new BufferMemory();

const chain = new ConversationChain({
  llm,
  memory,
});

const response = await chain.call({
  input: 'Hello, how can you help me?',
});
```

### RAG (Retrieval Augmented Generation)

```typescript
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { RetrievalQAChain } from 'langchain/chains';

// Create vector store
const vectorStore = await PineconeStore.fromDocuments(
  documents,
  new OpenAIEmbeddings(),
  { pineconeIndex }
);

// Create RAG chain
const chain = RetrievalQAChain.fromLLM(
  llm,
  vectorStore.asRetriever()
);
```

---

## 📊 Database Schema

### TypeORM Entities

```typescript
@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  systemPrompt: string;

  @ManyToOne(() => User, user => user.agents)
  user: User;

  @OneToMany(() => Conversation, conversation => conversation.agent)
  conversations: Conversation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 🚀 Deployment

### Docker Setup

```dockerfile
# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentforge-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agentforge-backend
  template:
    metadata:
      labels:
        app: agentforge-backend
    spec:
      containers:
      - name: backend
        image: agentforge/backend:latest
        ports:
        - containerPort: 4000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest)
```typescript
describe('AgentsService', () => {
  it('should create an agent', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('Agents API', () => {
  it('should handle agent creation flow', async () => {
    // Test API endpoints
  });
});
```

### E2E Tests
```typescript
describe('User Journey', () => {
  it('should complete agent creation to deployment', async () => {
    // Test complete user flow
  });
});
```

---

## 📈 Performance Optimization

### Backend
- Connection pooling (TypeORM)
- Redis caching
- Bull queue for async tasks
- Horizontal scaling with Kubernetes
- Database query optimization

### Frontend
- Server-side rendering (Next.js)
- Static generation where possible
- Image optimization
- Code splitting
- React Query caching

---

## 📚 Documentation

### Auto-Generated Docs
- **Swagger UI**: `/api/docs` (from NestJS decorators)
- **OpenAPI Spec**: `/api/docs-json`
- **TypeScript Types**: Exported from packages

### Developer Guides
- [NestJS Getting Started](./development/nestjs-getting-started.md)
- [System Architecture](./architecture/system-architecture.md)
- [Tech Stack Details](./development/tech-stack.md)
- [MVP Specification](./product/mvp-spec.md)

---

## 🎓 Learning Path

### For New Developers

**Week 1**: Foundations
- TypeScript basics
- NestJS fundamentals
- TypeORM basics
- Next.js introduction

**Week 2**: Advanced Concepts
- NestJS modules & DI
- TypeORM relations
- LangChain.js basics
- React Query

**Week 3**: Project Setup
- Set up development environment
- Run the application
- Make first contribution
- Write first test

**Week 4**: Building Features
- Create a new module
- Add API endpoints
- Build UI components
- Deploy to staging

---

## 🔄 Migration from Python (If Applicable)

We've completely removed Python from the stack. If you need Python for specific use cases:

### When to Add Python
- Heavy ML training (not LLM inference)
- Data science workloads
- Specialized libraries only available in Python

### How to Add
- Create separate microservice
- Use REST API for communication
- Deploy independently
- Keep main application in TypeScript

---

## ✅ Why This Stack

### Compared to Python/FastAPI

| Aspect | NestJS/TypeScript | Python/FastAPI |
|--------|-------------------|----------------|
| **Type Safety** | ✅ Compile-time | ⚠️ Runtime only |
| **Frontend Integration** | ✅ Same language | ❌ Different language |
| **Code Sharing** | ✅ Types, utils | ❌ Separate |
| **Ecosystem** | ✅ NPM (2M+) | ✅ PyPI (400K+) |
| **AI/ML** | ✅ LangChain.js | ✅ More libraries |
| **Performance** | ✅ Node.js I/O | ✅ Fast async |
| **Hiring** | ✅ Full-stack TS | ⚠️ Two skillsets |
| **Deployment** | ✅ Single runtime | ⚠️ Two runtimes |

---

## 🎯 Next Steps

1. **Review Documentation**
   - [README.md](./README.md) - Project overview
   - [QUICK-START.md](./QUICK-START.md) - Get started guide
   - [development/nestjs-getting-started.md](./development/nestjs-getting-started.md)

2. **Set Up Environment**
   - Install Node.js 20 LTS
   - Clone repository
   - Install dependencies
   - Configure environment variables

3. **Start Building**
   - Run development servers
   - Create first endpoint
   - Build first feature
   - Write tests

---

## 📞 Resources

### Official Documentation
- [NestJS](https://docs.nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [LangChain.js](https://js.langchain.com/)
- [Next.js](https://nextjs.org/docs)

### Community
- [NestJS Discord](https://discord.gg/nestjs)
- [LangChain Discord](https://discord.gg/langchain)
- [TypeScript Community](https://discord.gg/typescript)

---

**Status**: ✅ Production Ready  
**Last Updated**: November 2024  
**Tech Stack**: 100% TypeScript/JavaScript

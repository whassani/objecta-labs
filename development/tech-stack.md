# AgentForge Technology Stack

## Overview

This document provides a detailed breakdown of all technologies used in AgentForge, rationale for choices, and alternatives considered.

---

## Backend Technologies

### Core Framework

#### NestJS 10+ (Node.js 20 LTS, TypeScript)
**Purpose**: Main backend web framework

**Why NestJS**:
- Enterprise-grade architecture (modular, scalable)
- TypeScript-first with excellent type safety
- Built-in dependency injection
- Comprehensive documentation
- Large ecosystem and active community
- Perfect integration with TypeORM and LangChain.js
- Unified JavaScript/TypeScript stack (backend + frontend)

**Alternatives Considered**:
- Express: Too minimalist, lacks structure for large apps
- Fastify: Good performance but smaller ecosystem
- Koa: Minimalist, requires more setup

**Key Libraries**:
```json
{
  "@nestjs/core": "^10.2.0",
  "@nestjs/common": "^10.2.0",
  "@nestjs/platform-express": "^10.2.0",
  "@nestjs/swagger": "^7.1.0",
  "@nestjs/config": "^3.1.0",
  "@nestjs/jwt": "^10.1.0",
  "@nestjs/passport": "^10.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### AI/ML Stack

#### LLM Orchestration (Primary)

**LangChain.js**:
```json
{
  "langchain": "^0.1.0",
  "@langchain/core": "^0.1.0",
  "@langchain/openai": "^0.0.19",
  "@langchain/anthropic": "^0.0.5",
  "@langchain/community": "^0.0.20"
}
```

**Why LangChain.js**:
- Unified interface for all LLM providers
- Built-in RAG (Retrieval Augmented Generation)
- Memory and conversation management
- Streaming support
- Agent frameworks
- Tool/function calling abstraction
- Vector store integrations
- Native TypeScript support

**Key Features**:
- Chain complex LLM workflows
- Document loaders and text splitters
- Multiple retriever strategies
- Output parsers
- Callbacks and monitoring

#### LLM Providers (via LangChain)

**For Testing/Development: Ollama** ⭐ NEW
```json
{
  "ollama": "^0.1.0",
  "@langchain/community": "^0.0.20"
}
```

**Why Ollama for Testing**:
- Zero cost (run models locally)
- Fast iteration (no API calls)
- Works offline
- Privacy (data never leaves machine)
- OpenAI-compatible API
- Perfect for CI/CD and development

**Recommended Models**:
- `mistral:7b` - Best balance (4.1GB)
- `llama2:7b` - Fast and reliable (3.8GB)
- `phi` - Very fast for tests (1.6GB)

#### LLM Providers (Production)

**OpenAI**:
- GPT-4, GPT-3.5-turbo, GPT-4-turbo
- Industry leading performance
- Function calling support
- Fast and reliable

**Anthropic Claude**:
- Claude 3 (Opus, Sonnet, Haiku)
- Constitutional AI
- 200K context window
- Strong at analysis and code

**Hugging Face**:
- Open-source models
- Self-hosting option
- Cost control
- Llama 2, Mistral, etc.

**Cohere** (optional):
- Specialized for embeddings
- Enterprise features

#### Vector Database

**Primary: Pinecone** (via LangChain):
```json
{
  "@pinecone-database/pinecone": "^1.1.0"
}
```
- Managed service
- High performance
- Auto-scaling
- Native LangChain integration

**Secondary: Weaviate** (via LangChain):
```json
{
  "weaviate-ts-client": "^1.5.0"
}
```
- Open-source option
- Hybrid search
- Self-hosting capability
- GraphQL API

**Alternatives**: 
- Qdrant (good performance, TypeScript SDK)
- Chroma (simple, embedded option)
- pgvector (PostgreSQL extension)

#### Embeddings

**OpenAI Embeddings** (via LangChain):
- text-embedding-3-small (fast, cheap)
- text-embedding-3-large (high quality)
- text-embedding-ada-002 (legacy)

**Alternatives**:
- Cohere embeddings
- Hugging Face transformers.js
- Local embedding models

### Database Layer

#### Primary Database: PostgreSQL 15

**Why PostgreSQL**:
- ACID compliance
- JSON/JSONB support (perfect for TypeORM)
- Excellent performance
- Mature ecosystem
- pgvector extension for embeddings (optional)

**Configuration**:
- Connection pooling (built-in TypeORM)
- Read replicas for scaling
- Automated backups
- Point-in-time recovery

#### TypeORM

**Why TypeORM**:
```json
{
  "typeorm": "^0.3.17",
  "pg": "^8.11.0",
  "@nestjs/typeorm": "^10.0.0"
}
```

**Benefits**:
- TypeScript-first ORM
- Decorators for entities
- Automatic migrations
- Query builder
- Excellent NestJS integration
- Active Record and Data Mapper patterns
- Repository pattern built-in

**Features**:
- Entity relationships
- Eager/lazy loading
- Transactions
- Query caching
- Database migrations
- Multiple database support

#### Cache: Redis 7

**Purpose**:
- Session storage
- Rate limiting
- Cache layer
- Bull queue backend

```json
{
  "ioredis": "^5.3.0",
  "@nestjs/cache-manager": "^2.1.0",
  "cache-manager-ioredis": "^2.1.0"
}
```

**Use Cases**:
- User sessions (TTL: 7 days)
- API rate limit counters
- Agent configuration cache
- Pub/sub for real-time updates
- Job queue backing store

#### Time-Series: TimescaleDB

**Purpose**: Analytics and metrics

**Why TimescaleDB**:
- PostgreSQL extension
- Optimized for time-series data
- SQL interface (works with TypeORM)
- Automatic data retention policies

### Job Queue

#### Bull Queue

**Purpose**:
- Async job processing
- Background tasks
- Scheduled jobs
- Retry logic

```json
{
  "@nestjs/bull": "^10.0.0",
  "bull": "^4.11.0"
}
```

**Why Bull over Kafka**:
- Simpler setup for MVP
- Redis-based (already using Redis)
- Excellent NestJS integration
- Built-in retry and failure handling
- Job prioritization
- Delayed jobs
- Can upgrade to Kafka later if needed

**Use Cases**:
- Document processing
- Email sending
- Embedding generation
- Report generation
- Webhook delivery

**Queues**:
- `documents` - Document processing
- `emails` - Email delivery
- `analytics` - Analytics aggregation
- `webhooks` - Webhook delivery

**Note**: Apache Kafka can be added later for:
- High-throughput event streaming
- Real-time analytics
- Event sourcing
- Cross-service communication at scale

### Authentication & Security

#### JWT Authentication

```json
{
  "@nestjs/jwt": "^10.1.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.0"
}
```

**Features**:
- JWT tokens (15 min expiry)
- Refresh tokens (7 days)
- Password hashing (bcrypt)
- Guard-based protection

#### OAuth Providers

```json
{
  "passport-google-oauth20": "^2.0.0",
  "passport-github2": "^0.1.12",
  "@nestjs/passport": "^10.0.0"
}
```
- Google OAuth
- GitHub OAuth
- Microsoft OAuth (via passport-azure-ad)

#### Security Libraries

```json
{
  "@nestjs/throttler": "^5.0.0",
  "helmet": "^7.1.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

**Features**:
- Rate limiting (@nestjs/throttler)
- Security headers (helmet)
- Input validation (class-validator)
- Request transformation (class-transformer)
- CORS protection
- CSRF protection

### API Documentation

#### Swagger/OpenAPI

Built into NestJS:
```json
{
  "@nestjs/swagger": "^7.1.0"
}
```

**Features**:
- Auto-generated documentation from decorators
- Interactive API testing (Swagger UI)
- OpenAPI 3.0 spec generation
- Type-safe client generation
- DTO to schema mapping

**Usage**:
```typescript
@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, type: AgentDto })
  @Post()
  create(@Body() createDto: CreateAgentDto) {
    // ...
  }
}
```

---

## Frontend Technologies

### Core Framework

#### Next.js 14 (React 18)

**Why Next.js**:
- Server-side rendering
- Excellent performance
- Built-in routing
- API routes
- Image optimization
- Strong TypeScript support

```json
{
  "next": "14.0.3",
  "react": "18.2.0",
  "react-dom": "18.2.0"
}
```

### Language

#### TypeScript 5.3

**Benefits**:
- Type safety
- Better IDE support
- Catch errors early
- Self-documenting code

### UI Framework

#### TailwindCSS 3.3

**Why Tailwind**:
- Utility-first
- Highly customizable
- Small bundle size
- Excellent developer experience

```json
{
  "tailwindcss": "3.3.5",
  "autoprefixer": "10.4.16",
  "postcss": "8.4.31"
}
```

#### shadcn/ui Components

Pre-built components:
- Accessible (ARIA)
- Customizable
- Copy-paste friendly
- Built on Radix UI

**Key Components**:
- Dialog
- Dropdown
- Button
- Form
- Toast notifications

### State Management

#### Zustand

```json
{
  "zustand": "^4.4.0"
}
```

**Why Zustand over Redux**:
- Simpler API and less boilerplate
- No providers needed
- Built-in TypeScript support
- Smaller bundle size
- Easier to learn
- Perfect for small to medium apps
- Can be used with middleware

**Example**:
```typescript
import { create } from 'zustand'

interface AgentStore {
  agents: Agent[]
  selectedAgent: Agent | null
  setAgents: (agents: Agent[]) => void
  selectAgent: (agent: Agent) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  selectedAgent: null,
  setAgents: (agents) => set({ agents }),
  selectAgent: (agent) => set({ selectedAgent: agent })
}))
```

**Alternative**: React Query handles most server state, Zustand for UI state

### Data Fetching

#### React Query (TanStack Query)

```json
{
  "@tanstack/react-query": "5.8.4"
}
```

**Features**:
- Caching
- Background updates
- Optimistic updates
- Automatic retries

### Forms

#### React Hook Form

```json
{
  "react-hook-form": "7.48.2",
  "zod": "3.22.4"
}
```

**Benefits**:
- Performance (uncontrolled forms)
- Easy validation with Zod
- TypeScript integration

### Real-Time Communication

#### Socket.io Client

```json
{
  "socket.io-client": "4.5.4"
}
```

**Use Cases**:
- Live chat
- Real-time notifications
- Presence indicators
- Collaborative editing

### Charts & Visualization

#### Recharts

```json
{
  "recharts": "2.10.3"
}
```

**Why Recharts**:
- React-friendly
- Responsive
- Customizable
- Good documentation

### Code Editor

#### Monaco Editor (VS Code editor)

```json
{
  "@monaco-editor/react": "4.6.0"
}
```

**Use Cases**:
- Prompt editing
- JSON configuration
- Custom function writing

### Markdown

#### MDX & React Markdown

```json
{
  "react-markdown": "9.0.1",
  "remark-gfm": "4.0.0"
}
```

**Use Cases**:
- Documentation
- Agent responses
- Rich text content

### Testing

#### Jest & React Testing Library

```json
{
  "jest": "29.7.0",
  "@testing-library/react": "14.1.2",
  "@testing-library/jest-dom": "6.1.5"
}
```

### Linting & Formatting

```json
{
  "eslint": "8.54.0",
  "prettier": "3.1.0",
  "eslint-config-next": "14.0.3",
  "eslint-config-prettier": "9.0.0"
}
```

---

## Infrastructure

### Container Orchestration

#### Kubernetes (EKS)

**Why Kubernetes**:
- Industry standard
- Excellent scaling
- Strong ecosystem
- Multi-cloud support

**Components**:
- Deployments
- Services
- Ingress (NGINX)
- Horizontal Pod Autoscaler
- Cert-manager (SSL)

### Infrastructure as Code

#### Terraform

**Why Terraform**:
- Multi-cloud
- Declarative
- State management
- Large provider ecosystem

**Providers**:
- AWS
- Cloudflare
- Stripe
- Datadog

### CI/CD

#### GitHub Actions

**Workflows**:
- Build & test
- Deploy to staging
- Deploy to production
- Database migrations
- Security scanning

**Why GitHub Actions**:
- Integrated with GitHub
- Free for public repos
- Good marketplace
- Simple YAML config

### Monitoring

#### Datadog

**Features**:
- APM (Application Performance Monitoring)
- Infrastructure monitoring
- Log management
- Real User Monitoring
- Synthetic monitoring

**Alternatives Considered**:
- New Relic (more expensive)
- Prometheus + Grafana (self-hosted complexity)

#### Error Tracking: Sentry

```json
{
  "@sentry/node": "^7.80.0",
  "@sentry/tracing": "^7.80.0"
}
```

**Features**:
- Error tracking
- Performance monitoring
- Release tracking
- User feedback
- Source map support

### Logging

#### ELK Stack (Elasticsearch, Logstash, Kibana)

**Why ELK**:
- Powerful search
- Real-time analysis
- Visualization
- Mature ecosystem

**Alternative**: Datadog Logs (considered for simplicity)

### CDN

#### CloudFront (AWS)

**Features**:
- Global edge locations
- SSL/TLS
- Origin failover
- Cache optimization

**Alternative**: Cloudflare (considered for DDoS protection)

---

## DevOps Tools

### Version Control

- **Git**: Source control
- **GitHub**: Repository hosting
- **Git LFS**: Large file storage

### API Testing

- **Postman**: API development
- **k6**: Load testing

### Database Tools

- **pgAdmin**: PostgreSQL GUI
- **DBeaver**: Universal database tool
- **Alembic**: Schema migrations

### Security

- **Snyk**: Dependency scanning
- **Trivy**: Container scanning
- **OWASP ZAP**: Security testing

---

## Third-Party Services

### AI/ML Services

- **OpenAI**: LLM provider
- **Anthropic**: Claude API
- **Hugging Face**: Model hosting
- **Pinecone**: Vector database

### Communication

- **SendGrid**: Email delivery
- **Twilio**: SMS (future)
- **Slack API**: Integration
- **Microsoft Graph**: Teams integration

### Payment

- **Stripe**: Payment processing
  - Subscriptions
  - Invoicing
  - Payment methods
  - Webhooks

### Analytics

- **Mixpanel**: Product analytics
- **Google Analytics**: Web analytics
- **Amplitude**: User behavior

### Support

- **Intercom**: Customer support chat
- **Zendesk**: Ticket management (alternative)

---

## Development Tools

### Code Quality

- **Prettier**: TypeScript/JavaScript formatter
- **ESLint**: TypeScript/JavaScript linter
- **TypeScript**: Static type checking
- **Husky**: Git hooks for pre-commit checks
- **Lint-staged**: Run linters on staged files

### Documentation

- **Swagger/OpenAPI**: API docs
- **Docusaurus**: Documentation site
- **Storybook**: Component library

### Collaboration

- **Slack**: Team communication
- **Linear**: Issue tracking
- **Notion**: Documentation
- **Figma**: Design

---

## Decision Criteria

When selecting technologies, we prioritize:

1. **Performance**: Must handle scale
2. **Developer Experience**: Easy to work with
3. **Community**: Active community and support
4. **Cost**: Total cost of ownership
5. **Flexibility**: Not locked into vendor
6. **Maturity**: Production-ready, stable
7. **Security**: Strong security features

---

## Technology Upgrade Policy

### Regular Updates
- **Security patches**: Within 48 hours
- **Minor versions**: Monthly review
- **Major versions**: Quarterly review

### Testing Requirements
- All updates tested in staging
- Breaking changes require migration plan
- Rollback plan for production updates

### Deprecation Policy
- 6 months notice for breaking changes
- Migration guides provided
- Support for old versions during transition

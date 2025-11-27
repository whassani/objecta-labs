# Ollama Setup for Testing & Development

## Overview

Use **Ollama** for local testing and development to avoid OpenAI costs. Switch to OpenAI/Anthropic for production deployments.

---

## Why Ollama for Testing?

### Benefits
- ✅ **Zero Cost** - Run models locally, no API fees
- ✅ **Fast Iteration** - No network latency, instant responses
- ✅ **Privacy** - All data stays on your machine
- ✅ **Offline** - Works without internet
- ✅ **Compatible** - OpenAI-compatible API (works with LangChain.js)
- ✅ **Multiple Models** - Llama 2, Mistral, CodeLlama, etc.

### Use Cases
- ✅ Local development
- ✅ Unit testing
- ✅ Integration testing
- ✅ CI/CD pipelines
- ✅ Demo environments
- ✅ Development without API keys

---

## 1. Installation

### macOS
```bash
# Install via Homebrew
brew install ollama

# Or download from website
# https://ollama.ai/download
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
```bash
# Download installer from:
# https://ollama.ai/download
```

### Docker (Recommended for CI/CD)
```bash
# Pull Ollama Docker image
docker pull ollama/ollama

# Run Ollama server
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  ollama/ollama
```

---

## 2. Start Ollama Server

```bash
# Start Ollama server
ollama serve

# Server runs on http://localhost:11434
```

### Verify Installation
```bash
curl http://localhost:11434/api/tags
```

---

## 3. Download Models

### Recommended Models for ObjectaLabs

```bash
# Llama 2 7B (Good for general use, fast)
ollama pull llama2:7b

# Mistral 7B (Better quality, slightly slower)
ollama pull mistral:7b

# CodeLlama (For code-related tasks)
ollama pull codellama:7b

# Llama 2 13B (Higher quality, needs more RAM)
ollama pull llama2:13b

# Phi-2 (Microsoft, very fast, good quality)
ollama pull phi
```

### Model Comparison

| Model | Size | RAM Required | Speed | Quality | Best For |
|-------|------|--------------|-------|---------|----------|
| **llama2:7b** | 3.8GB | 8GB | Fast | Good | General testing |
| **mistral:7b** | 4.1GB | 8GB | Medium | Better | Production-like testing |
| **phi** | 1.6GB | 4GB | Very Fast | Good | Quick tests, CI/CD |
| **codellama:7b** | 3.8GB | 8GB | Fast | Specialized | Code generation |
| **llama2:13b** | 7.3GB | 16GB | Slower | Best | Final testing |

**Recommended for most testing**: `mistral:7b`

---

## 4. LangChain.js Integration

### Configuration with Environment Variables

```typescript
// src/config/llm.config.ts
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/community/chat_models/ollama';

export const getLLMModel = (modelName?: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const useOllama = process.env.USE_OLLAMA === 'true';

  if (useOllama || (!isProduction && !process.env.OPENAI_API_KEY)) {
    // Use Ollama for testing/development
    return new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'mistral:7b',
      temperature: 0.7,
    });
  }

  // Use OpenAI for production
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: modelName || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: 0.7,
  });
};
```

### Environment Variables

```env
# .env.development (local testing)
NODE_ENV=development
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b

# .env.production (production)
NODE_ENV=production
USE_OLLAMA=false
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-3.5-turbo
```

### Service Implementation

```typescript
// src/modules/langchain/langchain.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';

@Injectable()
export class LangChainService {
  constructor(private configService: ConfigService) {}

  /**
   * Create LLM instance based on environment
   */
  private createLLM(modelName?: string) {
    const useOllama = this.configService.get('USE_OLLAMA') === 'true';
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    if (useOllama || (!isProduction && !this.configService.get('OPENAI_API_KEY'))) {
      console.log('🦙 Using Ollama for local testing');
      
      return new ChatOllama({
        baseUrl: this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434',
        model: modelName || this.configService.get('OLLAMA_MODEL') || 'mistral:7b',
        temperature: 0.7,
      });
    }

    console.log('☁️  Using OpenAI for production');
    
    return new ChatOpenAI({
      openAIApiKey: this.configService.get('OPENAI_API_KEY'),
      modelName: modelName || this.configService.get('OPENAI_MODEL') || 'gpt-3.5-turbo',
      temperature: 0.7,
    });
  }

  /**
   * Create conversation chain
   */
  async createConversationChain(
    systemPrompt: string,
    modelName?: string,
  ) {
    const llm = this.createLLM(modelName);

    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'history',
    });

    const chain = new ConversationChain({
      llm,
      memory,
    });

    return chain;
  }

  /**
   * Simple chat completion
   */
  async chat(message: string, modelName?: string): Promise<string> {
    const llm = this.createLLM(modelName);
    
    const response = await llm.invoke([
      { role: 'user', content: message },
    ]);

    return response.content as string;
  }
}
```

---

## 5. Docker Compose Setup

### docker-compose.dev.yml

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: objecta-labs_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Ollama (for local testing)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # Pull models on startup
    command: >
      sh -c "ollama serve & 
             sleep 5 && 
             ollama pull mistral:7b &&
             ollama pull llama2:7b &&
             wait"

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - USE_OLLAMA=true
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=mistral:7b
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/objecta-labs_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - ollama
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
  ollama_data:
```

### Start Development Environment

```bash
# Start all services including Ollama
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f ollama

# Test Ollama
curl http://localhost:11434/api/tags
```

---

## 6. Testing Strategies

### Unit Tests with Ollama

```typescript
// src/modules/agents/agents.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AgentsService } from './agents.service';
import { LangChainService } from '../langchain/langchain.service';

describe('AgentsService', () => {
  let service: AgentsService;
  let langChainService: LangChainService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        LangChainService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                USE_OLLAMA: 'true',
                OLLAMA_BASE_URL: 'http://localhost:11434',
                OLLAMA_MODEL: 'mistral:7b',
                NODE_ENV: 'test',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    langChainService = module.get<LangChainService>(LangChainService);
  });

  it('should generate response using Ollama', async () => {
    const response = await langChainService.chat(
      'What is 2+2?',
    );

    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
    console.log('Ollama response:', response);
  });
});
```

### Integration Tests

```typescript
// test/agents.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Agents API (e2e) with Ollama', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Set environment to use Ollama
    process.env.USE_OLLAMA = 'true';
    process.env.OLLAMA_MODEL = 'mistral:7b';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    authToken = loginResponse.body.accessToken;
  });

  it('should create agent and get response', async () => {
    // Create agent
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Agent',
        systemPrompt: 'You are a helpful assistant',
      })
      .expect(201);

    const agentId = createResponse.body.id;

    // Test chat with Ollama
    const chatResponse = await request(app.getHttpServer())
      .post(`/api/v1/agents/${agentId}/chat`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Hello! What is 5 + 3?',
      })
      .expect(200);

    expect(chatResponse.body.response).toBeDefined();
    console.log('Ollama chat response:', chatResponse.body.response);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## 7. CI/CD Integration

### GitHub Actions with Ollama

```yaml
# .github/workflows/test.yml
name: Test with Ollama

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: objecta-labs_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

      ollama:
        image: ollama/ollama:latest
        ports:
          - 11434:11434

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Pull Ollama model
        run: |
          docker exec $(docker ps -q -f ancestor=ollama/ollama:latest) \
            ollama pull mistral:7b

      - name: Run tests with Ollama
        env:
          USE_OLLAMA: true
          OLLAMA_BASE_URL: http://localhost:11434
          OLLAMA_MODEL: mistral:7b
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/objecta-labs_test
          REDIS_URL: redis://localhost:6379
        run: |
          npm run test
          npm run test:e2e
```

---

## 8. Performance Comparison

### Response Times (Approximate)

| Model | Response Time | Quality | Cost |
|-------|--------------|---------|------|
| **Ollama (mistral:7b)** | 2-5s (local) | Good | Free |
| **Ollama (llama2:13b)** | 5-10s (local) | Better | Free |
| **OpenAI (gpt-3.5-turbo)** | 1-3s (API) | Excellent | $0.002/1K tokens |
| **OpenAI (gpt-4)** | 5-15s (API) | Best | $0.06/1K tokens |

### When to Use Each

| Scenario | Use |
|----------|-----|
| Local development | Ollama (mistral:7b) |
| Unit tests | Ollama (phi - fastest) |
| Integration tests | Ollama (mistral:7b) |
| CI/CD pipeline | Ollama (phi or mistral) |
| Staging environment | OpenAI (gpt-3.5-turbo) |
| Production | OpenAI (gpt-3.5-turbo or gpt-4) |

---

## 9. Model Switching Strategy

### Per-Environment Configuration

```typescript
// src/config/llm.config.ts
export const getLLMConfig = () => {
  const env = process.env.NODE_ENV;

  const configs = {
    development: {
      provider: 'ollama',
      model: 'mistral:7b',
      baseUrl: 'http://localhost:11434',
    },
    test: {
      provider: 'ollama',
      model: 'phi', // Fastest for tests
      baseUrl: 'http://localhost:11434',
    },
    staging: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
    },
    production: {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
    },
  };

  return configs[env] || configs.development;
};
```

### Runtime Model Selection (Admin Override)

```typescript
// Admin can force specific model for testing
interface AgentConfig {
  defaultModel: 'openai' | 'ollama';
  openaiModel?: string;
  ollamaModel?: string;
  forceModel?: string; // Override for testing
}

async function getModelForAgent(agentConfig: AgentConfig) {
  if (agentConfig.forceModel) {
    // Admin override for testing
    return createModel(agentConfig.forceModel);
  }

  const config = getLLMConfig();
  return createModel(config.model);
}
```

---

## 10. Troubleshooting

### Ollama Not Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Check Docker container
docker ps | grep ollama
docker logs ollama
```

### Model Not Downloaded

```bash
# List downloaded models
ollama list

# Pull model
ollama pull mistral:7b

# Delete model (to free space)
ollama rm mistral:7b
```

### Slow Responses

```bash
# Use smaller/faster model
ollama pull phi

# Or use quantized version
ollama pull llama2:7b-q4_0
```

### Out of Memory

```bash
# Check RAM usage
docker stats ollama

# Use smaller model
ollama pull phi  # Only 1.6GB

# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory
```

---

## Summary

### Development Workflow

```bash
# 1. Start Ollama locally
ollama serve

# 2. Pull model (one-time)
ollama pull mistral:7b

# 3. Set environment
export USE_OLLAMA=true
export OLLAMA_MODEL=mistral:7b

# 4. Run tests (uses Ollama)
npm run test
npm run test:e2e

# 5. Deploy to production (uses OpenAI)
npm run build
npm run start:prod
```

### Benefits Summary

- ✅ **Zero cost** for development and testing
- ✅ **Fast iteration** with local models
- ✅ **CI/CD friendly** (no API keys needed)
- ✅ **Privacy** - data never leaves your machine
- ✅ **Compatible** - same LangChain.js code works for both
- ✅ **Flexible** - easy to switch between models

### Production Deployment

In production, automatically uses OpenAI:
- Set `NODE_ENV=production`
- Set `USE_OLLAMA=false`
- Provide `OPENAI_API_KEY`

**Best of both worlds: Free local testing + Production-quality OpenAI! 🚀**

---

**Would you like me to:**
1. Update the main tech stack doc with Ollama info?
2. Add Ollama to the Docker Compose setup?
3. Create test examples using Ollama?
4. Add Ollama to the MVP spec?

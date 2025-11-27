# ObjectaLabs NestJS Development Guide

## Getting Started with NestJS Backend

This guide will help you set up your NestJS backend development environment for ObjectaLabs.

## Prerequisites

### Required Software
- **Node.js**: 20.x LTS or higher
- **npm** or **pnpm**: Latest version (pnpm recommended for speed)
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher
- **Git**: Latest version
- **PostgreSQL**: 15.x (or use Docker)
- **Redis**: 7.x (or use Docker)

### Recommended Tools
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Docker
  - GitLens
  - Thunder Client or REST Client (API testing)
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **TablePlus** for database management

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/objecta-labs.git
cd objecta-labs
```

### 2. Backend Setup

```bash
cd backend
```

### 3. Install Dependencies

Using npm:
```bash
npm install
```

Using pnpm (recommended):
```bash
pnpm install
```

### 4. Environment Configuration

Create environment files:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

Edit `.env`:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=objecta-labs_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Anthropic (optional)
ANTHROPIC_API_KEY=your-anthropic-key

# Pinecone
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=objecta-labs

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=objecta-labs-documents

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@objecta-labs.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### 5. Start Development Services

Using Docker Compose (recommended):

```bash
# From project root
docker-compose up -d postgres redis

# Check services are running
docker-compose ps
```

Or manually:

```bash
# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux

# Start Redis
brew services start redis          # macOS
sudo systemctl start redis         # Linux
```

### 6. Database Setup

```bash
# Run migrations
npm run migration:run

# Or with TypeORM CLI
npx typeorm migration:run -d src/config/typeorm.config.ts

# Seed database (optional)
npm run seed
```

### 7. Start Development Server

```bash
npm run start:dev
```

The API will be available at:
- API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api/docs

## Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── config/                    # Configuration
│   │   ├── typeorm.config.ts     # TypeORM config
│   │   ├── redis.config.ts       # Redis config
│   │   └── app.config.ts         # App config
│   │
│   ├── common/                    # Shared utilities
│   │   ├── decorators/           # Custom decorators
│   │   ├── filters/              # Exception filters
│   │   ├── guards/               # Auth guards
│   │   ├── interceptors/         # HTTP interceptors
│   │   ├── pipes/                # Validation pipes
│   │   └── utils/                # Helper functions
│   │
│   ├── modules/
│   │   ├── auth/                 # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/              # Data transfer objects
│   │   │   ├── strategies/       # Passport strategies
│   │   │   └── guards/           # Auth guards
│   │   │
│   │   ├── users/                # Users module
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   ├── entities/         # TypeORM entities
│   │   │   └── dto/
│   │   │
│   │   ├── agents/               # Agents module
│   │   │   ├── agents.controller.ts
│   │   │   ├── agents.service.ts
│   │   │   ├── agents.module.ts
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   │
│   │   ├── conversations/        # Conversations module
│   │   │   ├── conversations.controller.ts
│   │   │   ├── conversations.service.ts
│   │   │   ├── conversations.gateway.ts  # WebSocket
│   │   │   ├── conversations.module.ts
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   │
│   │   ├── documents/            # Document processing
│   │   │   ├── documents.controller.ts
│   │   │   ├── documents.service.ts
│   │   │   ├── documents.processor.ts  # Bull queue
│   │   │   ├── documents.module.ts
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   │
│   │   ├── langchain/            # LangChain integration
│   │   │   ├── langchain.service.ts
│   │   │   ├── langchain.module.ts
│   │   │   ├── chains/           # LangChain chains
│   │   │   ├── agents/           # LangChain agents
│   │   │   └── tools/            # Custom tools
│   │   │
│   │   ├── billing/              # Stripe integration
│   │   │   ├── billing.controller.ts
│   │   │   ├── billing.service.ts
│   │   │   ├── billing.module.ts
│   │   │   └── webhooks/
│   │   │
│   │   └── analytics/            # Analytics
│   │       ├── analytics.controller.ts
│   │       ├── analytics.service.ts
│   │       └── analytics.module.ts
│   │
│   └── database/
│       ├── migrations/           # TypeORM migrations
│       ├── seeds/                # Database seeds
│       └── factories/            # Test data factories
│
├── test/
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
│
├── .env
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

## Development Workflow

### 1. Create a New Feature Module

```bash
# Generate a new module
nest generate module modules/feature-name

# Generate a controller
nest generate controller modules/feature-name

# Generate a service
nest generate service modules/feature-name

# Or generate all at once (module, controller, service)
nest generate resource modules/feature-name
```

### 2. Create an Entity

```typescript
// src/modules/agents/entities/agent.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.agents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  systemPrompt: string;

  @Column({ type: 'text', nullable: true })
  welcomeMessage: string;

  @Column({ length: 50, default: 'professional' })
  personality: string;

  @Column({ length: 50, default: 'gpt-3.5-turbo' })
  model: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature: number;

  @Column({ type: 'int', default: 512 })
  maxTokens: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 3. Create DTOs

```typescript
// src/modules/agents/dto/create-agent.dto.ts
import { IsString, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ example: 'Customer Support Bot' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Helps customers with common questions' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'You are a helpful customer support assistant...' })
  @IsString()
  @MaxLength(2000)
  systemPrompt: string;

  @ApiPropertyOptional({ example: 'Hi! How can I help you today?' })
  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiPropertyOptional({ example: 'gpt-3.5-turbo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({ example: 512 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(2000)
  maxTokens?: number;
}
```

### 4. Create a Service

```typescript
// src/modules/agents/agents.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async create(userId: string, createAgentDto: CreateAgentDto): Promise<Agent> {
    const agent = this.agentRepository.create({
      ...createAgentDto,
      userId,
    });

    return await this.agentRepository.save(agent);
  }

  async findAll(userId: string): Promise<Agent[]> {
    return await this.agentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id, userId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async update(
    id: string,
    userId: string,
    updateAgentDto: UpdateAgentDto,
  ): Promise<Agent> {
    const agent = await this.findOne(id, userId);
    
    Object.assign(agent, updateAgentDto);
    
    return await this.agentRepository.save(agent);
  }

  async remove(id: string, userId: string): Promise<void> {
    const agent = await this.findOne(id, userId);
    await this.agentRepository.remove(agent);
  }
}
```

### 5. Create a Controller

```typescript
// src/modules/agents/agents.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser() user: User,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    return this.agentsService.create(user.id, createAgentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents' })
  @ApiResponse({ status: 200, description: 'Agents retrieved successfully' })
  findAll(@CurrentUser() user: User) {
    return this.agentsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.agentsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agent' })
  @ApiResponse({ status: 200, description: 'Agent updated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentsService.update(id, user.id, updateAgentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  @ApiResponse({ status: 200, description: 'Agent deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.agentsService.remove(id, user.id);
  }
}
```

### 6. LangChain Integration Example

```typescript
// src/modules/langchain/langchain.service.ts
import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';

@Injectable()
export class LangChainService {
  private getLLM(model: string, temperature: number) {
    if (model.startsWith('gpt-')) {
      return new ChatOpenAI({
        modelName: model,
        temperature,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    } else if (model.startsWith('claude-')) {
      return new ChatAnthropic({
        modelName: model,
        temperature,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    
    // Default to GPT-3.5
    return new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature,
    });
  }

  async createConversationChain(
    systemPrompt: string,
    model: string,
    temperature: number,
  ) {
    const llm = this.getLLM(model, temperature);

    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate('{input}'),
    ]);

    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'history',
    });

    const chain = new ConversationChain({
      llm,
      memory,
      prompt: chatPrompt,
    });

    return chain;
  }

  async chat(
    chain: ConversationChain,
    message: string,
  ): Promise<string> {
    const response = await chain.call({
      input: message,
    });

    return response.response;
  }
}
```

### 7. Create a Migration

```bash
# Generate a new migration
npm run migration:generate -- -n CreateAgentsTable

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

Example migration:

```typescript
// src/database/migrations/1234567890-CreateAgentsTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAgentsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'agents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'systemPrompt',
            type: 'text',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('agents');
  }
}
```

## Testing

### Unit Tests

```typescript
// src/modules/agents/agents.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentsService } from './agents.service';
import { Agent } from './entities/agent.entity';

describe('AgentsService', () => {
  let service: AgentsService;
  let repository: Repository<Agent>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: getRepositoryToken(Agent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    repository = module.get<Repository<Agent>>(getRepositoryToken(Agent));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new agent', async () => {
      const createDto = {
        name: 'Test Agent',
        systemPrompt: 'You are helpful',
      };

      const mockAgent = { id: '123', ...createDto, userId: 'user-123' };

      mockRepository.create.mockReturnValue(mockAgent);
      mockRepository.save.mockResolvedValue(mockAgent);

      const result = await service.create('user-123', createDto);

      expect(result).toEqual(mockAgent);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: 'user-123',
      });
    });
  });
});
```

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Common Commands

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debug mode
npm run start:prod         # Start production build

# Building
npm run build              # Build for production
npm run prebuild           # Clean dist folder

# Linting & Formatting
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint errors
npm run format             # Format with Prettier

# Database
npm run migration:generate # Generate migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert migration
npm run seed               # Seed database

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Test coverage
```

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Next Steps

1. Read the [API Documentation](./api-documentation.md)
2. Review [Architecture Decisions](../architecture/system-architecture.md)
3. Check [MVP Implementation](../product/mvp-spec.md)
4. Join daily standups

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [LangChain.js Documentation](https://js.langchain.com/)
- [NestJS Best Practices](https://github.com/nestjs/nest/tree/master/sample)

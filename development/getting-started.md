# ObjectaLabs Development Guide

## Getting Started

This guide will help you set up your development environment and start building ObjectaLabs.

## Prerequisites

### Required Software
- **Node.js**: 20.x LTS or higher
- **npm** or **pnpm**: Latest version (pnpm recommended)
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
  - Thunder Client or REST Client
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **TablePlus** for database management

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/objecta-labs.git
cd objecta-labs
```

### 2. Environment Setup

Create environment configuration files:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

### 3. Install Dependencies

**Backend** (NestJS):
```bash
cd backend
npm install
# or using pnpm (recommended)
pnpm install
```

**Frontend** (Next.js):
```bash
cd frontend
npm install
# or using pnpm
pnpm install
```

### 4. Start Development Services

Using Docker Compose (recommended):

```bash
# Start PostgreSQL, Redis, and other services
docker-compose up -d

# Check services are running
docker-compose ps
```

Manual setup:
```bash
# Start PostgreSQL
pg_ctl -D /usr/local/var/postgres start

# Start Redis
redis-server
```

### 5. Database Setup

```bash
cd backend

# Run migrations
npm run migration:run

# Or with TypeORM CLI
npx typeorm migration:run -d src/config/typeorm.config.ts

# Seed database with sample data (optional)
npm run seed
```

### 6. Start Development Servers

**Backend** (Terminal 1):
```bash
cd backend
npm run start:dev
# or with pnpm
pnpm start:dev
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# or with pnpm
pnpm dev
```

**Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- Swagger API Docs: http://localhost:4000/api/docs

## Project Structure

```
objecta-labs/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── main.ts            # Application entry point
│   │   ├── app.module.ts      # Root module
│   │   │
│   │   ├── config/            # Configuration
│   │   │   ├── typeorm.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── app.config.ts
│   │   │
│   │   ├── common/            # Shared utilities
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── users/         # Users module
│   │   │   ├── agents/        # Agents module
│   │   │   ├── conversations/ # Conversations module
│   │   │   ├── documents/     # Document processing
│   │   │   ├── langchain/     # LangChain integration
│   │   │   ├── billing/       # Stripe integration
│   │   │   └── analytics/     # Analytics
│   │   │
│   │   └── database/
│   │       ├── migrations/    # TypeORM migrations
│   │       └── seeds/         # Database seeds
│   │
│   ├── test/
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js 14 app directory
│   │   ├── components/        # React components
│   │   │   ├── agents/
│   │   │   ├── chat/
│   │   │   ├── dashboard/
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities
│   │   ├── services/          # API services
│   │   ├── store/             # Zustand stores
│   │   └── styles/            # TailwindCSS
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── infrastructure/            # Infrastructure as Code
│   ├── terraform/
│   ├── kubernetes/
│   └── docker-compose.yml
│
├── docs/                      # Documentation
└── scripts/                   # Utility scripts
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the coding standards (see below) and write tests for new functionality.

### 3. Run Tests

**Backend**:
```bash
cd backend
pytest
pytest --cov=app tests/  # With coverage
```

**Frontend**:
```bash
cd frontend
npm test
npm run test:coverage
```

### 4. Lint and Format

**Backend**:
```bash
# Format code
black app tests

# Lint
flake8 app tests
mypy app
```

**Frontend**:
```bash
# Lint
npm run lint

# Format
npm run format
```

### 5. Commit Changes

Follow conventional commits:
```bash
git add .
git commit -m "feat: add agent creation API endpoint"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub with:
- Clear description of changes
- Link to related issue
- Screenshots (if UI changes)
- Test coverage

## Coding Standards

### TypeScript/NestJS (Backend)

**Style Guide**: Airbnb TypeScript + Prettier

**Key Principles**:
- Use TypeScript strict mode
- Dependency injection via NestJS
- DTOs for validation
- Keep controllers thin, services fat
- Write unit tests for all business logic

**Example**:
```typescript
// agents.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { AgentResponseDto } from './dto/agent-response.dto';
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new AI agent' })
  async create(
    @CurrentUser() user: User,
    @Body() createAgentDto: CreateAgentDto,
  ): Promise<AgentResponseDto> {
    return this.agentsService.create(user.id, createAgentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents for current user' })
  async findAll(@CurrentUser() user: User): Promise<AgentResponseDto[]> {
    return this.agentsService.findAll(user.id);
  }
}
```

### TypeScript/React (Frontend)

**Style Guide**: Airbnb + Prettier

**Key Principles**:
- Use functional components with hooks
- TypeScript for all components
- Proper prop typing
- Custom hooks for reusable logic
- Component composition

**Example**:
```typescript
import React, { useState, useEffect } from 'react';
import { Agent } from '@/types/agent';
import { agentService } from '@/services/agentService';
import { Button } from '@/components/ui/Button';

interface AgentListProps {
  onSelect: (agent: Agent) => void;
}

export const AgentList: React.FC<AgentListProps> = ({ onSelect }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await agentService.getAgents();
        setAgents(data);
      } catch (err) {
        setError('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      {agents.map(agent => (
        <div key={agent.id} className="p-4 border rounded">
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
          <Button onClick={() => onSelect(agent)}>
            Select
          </Button>
        </div>
      ))}
    </div>
  );
};
```

## Testing Guidelines

### Unit Tests

**Backend (Jest with NestJS)**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentsService } from './agents.service';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';

describe('AgentsService', () => {
  let service: AgentsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

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
  });

  describe('create', () => {
    it('should create a new agent', async () => {
      const createDto: CreateAgentDto = {
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

**Frontend (Jest + React Testing Library)**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentList } from './AgentList';
import { agentService } from '@/services/agentService';

jest.mock('@/services/agentService');

describe('AgentList', () => {
  it('renders agent list', async () => {
    const mockAgents = [
      { id: 1, name: 'Agent 1', description: 'Description 1' },
      { id: 2, name: 'Agent 2', description: 'Description 2' }
    ];
    
    (agentService.getAgents as jest.Mock).mockResolvedValue(mockAgents);
    
    render(<AgentList onSelect={jest.fn()} />);
    
    expect(await screen.findByText('Agent 1')).toBeInTheDocument();
    expect(await screen.findByText('Agent 2')).toBeInTheDocument();
  });
});
```

### E2E Tests

Test complete workflows:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AgentsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = loginResponse.body.accessToken;
  });

  it('/api/v1/agents (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Agent',
        systemPrompt: 'You are helpful',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Test Agent');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## API Development

### Adding a New Endpoint

1. **Define DTO** (`src/modules/feature/dto/`):
```typescript
import { IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  enabled: boolean = true;
}
```

2. **Create Service** (`src/modules/feature/`):
```typescript
@Injectable()
export class FeatureService {
  async createFeature(data: CreateFeatureDto): Promise<Feature> {
    // Business logic
    return feature;
  }
}
```

3. **Add Controller** (`src/modules/feature/`):
```typescript
@Controller('features')
export class FeatureController {
  constructor(private featureService: FeatureService) {}

  @Post()
  async create(@Body() data: CreateFeatureDto) {
    return this.featureService.createFeature(data);
  }
}
```

4. **Write Tests**:
```typescript
describe('FeatureService', () => {
  it('should create a feature', async () => {
    // Test implementation
  });
});
```

5. **Update Documentation**:
- NestJS auto-generates Swagger docs from decorators
- Add @ApiOperation and @ApiResponse decorators
- Documentation available at `/api/docs`

## Database Migrations

### Generate Migration

```bash
cd backend

# Generate migration from entity changes
npm run migration:generate -- -n CreateAgentsTable

# Or create empty migration
npm run migration:create -- -n AddIndexToAgents
```

### Review Migration

Check the generated file in `src/database/migrations/`

### Apply Migration

```bash
npm run migration:run
```

### Rollback Migration

```bash
npm run migration:revert
```

### Check Migration Status

```bash
npx typeorm migration:show -d src/config/typeorm.config.ts
```

## Debugging

### Backend

**VS Code Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "NestJS: Debug",
      "type": "node",
      "request": "launch",
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

**Logging**:
```typescript
import { Logger } from '@nestjs/common';

export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  async create(userId: string, createDto: CreateAgentDto) {
    this.logger.log(`Creating agent for user ${userId}`);
    
    try {
      // ... create agent
      this.logger.log(`Agent created successfully: ${agent.id}`);
      return agent;
    } catch (error) {
      this.logger.error(`Failed to create agent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

### Frontend

**Browser DevTools**:
- Use React DevTools extension
- Network tab for API calls
- Console for logs

**Debug Configuration**:
```json
{
  "name": "Next.js: debug full stack",
  "type": "node-terminal",
  "request": "launch",
  "command": "npm run dev"
}
```

## Common Tasks

### Add a New LLM Provider

1. Create provider class in `app/services/llm/providers/`
2. Implement base provider interface
3. Add configuration
4. Update provider factory
5. Write tests
6. Update documentation

### Add an Integration

1. Create integration module in `services/integration-hub/`
2. Implement OAuth flow (if needed)
3. Add webhook handlers
4. Create API client
5. Write tests
6. Add to UI

**Update Dependencies**:

**Backend & Frontend**:
```bash
# Check outdated packages
npm outdated

# Update all dependencies (interactive)
npm update

# Update specific package
npm install package-name@latest

# Security audit
npm audit
npm audit fix

# Using pnpm
pnpm update
pnpm audit
```

## Performance Tips

### Backend
- Use async/await for I/O operations
- Implement caching with Redis
- Use connection pooling
- Profile with py-spy or cProfile
- Monitor with APM tools

### Frontend
- Use React.memo for expensive components
- Implement code splitting
- Optimize images
- Use lazy loading
- Monitor with Lighthouse

## Troubleshooting

### Common Issues

**Database connection failed**:
```bash
# Check if PostgreSQL is running
docker-compose ps
# Check environment variables
echo $DATABASE_URL
```

**Port already in use**:
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

**Module not found**:
```bash
# Reinstall dependencies
pip install -r requirements.txt
npm install
```

## Resources

### Documentation
- [NestJS Docs](https://docs.nestjs.com/)
- [TypeORM Docs](https://typeorm.io/)
- [LangChain.js Docs](https://js.langchain.com/)
- [React Docs](https://react.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Learning Resources
- Internal wiki (coming soon)
- Architecture decision records (ADRs)
- Code review guidelines
- Design system documentation

## Getting Help

- **Slack**: #engineering channel
- **Email**: dev@objecta-labs.com
- **Documentation**: docs.objecta-labs.internal
- **Office Hours**: Tuesdays 2-3 PM

## Next Steps

1. Complete the [MVP Implementation Guide](./mvp-implementation.md)
2. Review [API Documentation](./api-documentation.md)
3. Check [Architecture Decisions](../architecture/decisions/)
4. Join the development standup (daily at 10 AM)

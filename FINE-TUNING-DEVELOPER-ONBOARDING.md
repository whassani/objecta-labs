# 👨‍💻 Fine-Tuning System - Developer Onboarding Guide

Welcome to the Fine-Tuning feature development team! This guide will help you understand the codebase, set up your environment, and start contributing.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Setup](#local-setup)
4. [Codebase Tour](#codebase-tour)
5. [Architecture Deep Dive](#architecture-deep-dive)
6. [Development Workflow](#development-workflow)
7. [Testing Guide](#testing-guide)
8. [Debugging Tips](#debugging-tips)
9. [Common Tasks](#common-tasks)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)

---

## Overview

### What is the Fine-Tuning System?

The Fine-Tuning system allows users to train custom AI models on their own data, improving model performance for specific use cases. It's a complete full-stack feature including:

- Dataset management (upload, validate, import)
- Job configuration and execution
- Real-time progress monitoring
- Model deployment and usage tracking

### Tech Stack

**Backend**:
- NestJS (TypeScript framework)
- TypeORM (ORM)
- PostgreSQL (database)
- OpenAI SDK (fine-tuning provider)
- Multer (file uploads)
- JWT (authentication)

**Frontend**:
- Next.js 14 (React framework with App Router)
- React Query (data fetching)
- TailwindCSS (styling)
- Heroicons (icons)

### Key Metrics

- **27 API endpoints**
- **5 database tables**
- **6 frontend pages**
- **~6,500 lines of code**
- **3 service layers**

---

## Prerequisites

### Required Software

✅ Node.js 18+ and npm  
✅ PostgreSQL 14+  
✅ Git  
✅ Code editor (VS Code recommended)

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### Knowledge Prerequisites

**Required**:
- TypeScript fundamentals
- REST API concepts
- Basic SQL/database knowledge
- React basics

**Nice to Have**:
- NestJS experience
- Next.js App Router
- TypeORM
- OpenAI API knowledge

---

## Local Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd objecta-labs

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb objecta-labs

# Run all migrations (including fine-tuning)
psql -d objecta-labs -f backend/src/migrations/create-fine-tuning-tables.sql
```

### 3. Environment Configuration

**Backend** (`backend/.env`):
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=objecta-labs

# Auth
JWT_SECRET=your-secret-key-here

# OpenAI (for fine-tuning)
OPENAI_API_KEY=sk-your-key-here

# Server
PORT=3001
NODE_ENV=development
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Start Services

**Terminal 1 - Backend**:
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - Database** (optional):
```bash
# Monitor database queries
tail -f /usr/local/var/log/postgresql@14/server.log
```

### 5. Verify Installation

```bash
# Run test script
./test-fine-tuning.sh

# Or manually check:
# Backend: http://localhost:3001/api/docs
# Frontend: http://localhost:3000/dashboard/fine-tuning
```

---

## Codebase Tour

### Backend Structure

```
backend/src/modules/fine-tuning/
├── entities/                      # TypeORM Database Models
│   ├── fine-tuning-dataset.entity.ts
│   ├── fine-tuning-job.entity.ts
│   ├── fine-tuned-model.entity.ts
│   ├── training-example.entity.ts
│   └── fine-tuning-event.entity.ts
│
├── dto/                           # Data Transfer Objects
│   ├── dataset.dto.ts             # Request/Response schemas
│   ├── job.dto.ts
│   └── model.dto.ts
│
├── providers/                     # AI Provider Adapters
│   ├── fine-tuning-provider.interface.ts
│   └── openai.provider.ts
│
├── fine-tuning-datasets.service.ts   # Dataset business logic
├── fine-tuning-jobs.service.ts       # Job management
├── fine-tuned-models.service.ts      # Model operations
├── fine-tuning.controller.ts         # HTTP endpoints
└── fine-tuning.module.ts             # Module configuration
```

### Frontend Structure

```
frontend/src/app/(dashboard)/dashboard/fine-tuning/
├── page.tsx                       # Main dashboard
├── datasets/
│   ├── page.tsx                   # Dataset list
│   └── new/
│       └── page.tsx               # Create dataset
├── jobs/
│   ├── page.tsx                   # Jobs list
│   └── new/
│       └── page.tsx               # Job creation wizard
└── models/
    └── page.tsx                   # Models list
```

### Key Files to Understand

**Backend**:
1. `fine-tuning.controller.ts` - All API endpoints
2. `fine-tuning-jobs.service.ts` - Core job logic
3. `openai.provider.ts` - OpenAI integration
4. `fine-tuning-job.entity.ts` - Job data model

**Frontend**:
1. `jobs/new/page.tsx` - Job creation wizard (most complex UI)
2. `datasets/page.tsx` - Dataset management with modals
3. `jobs/page.tsx` - Real-time job monitoring

---

## Architecture Deep Dive

### Request Flow

```
User Action (Frontend)
    ↓
React Query API Call
    ↓
HTTP Request to Backend
    ↓
JWT Auth Guard (validates token)
    ↓
Controller (routes to service)
    ↓
Service (business logic)
    ↓
TypeORM (database queries)
    ↓
Provider (external API if needed)
    ↓
Response back to Frontend
    ↓
React Query Cache Update
    ↓
UI Re-render
```

### Job Lifecycle

```
1. User creates job → POST /fine-tuning/jobs
2. Service validates dataset
3. Job record created (status: pending)
4. Async job startup triggered
5. Dataset validated with OpenAI
6. File uploaded to OpenAI
7. Fine-tuning job created (status: queued)
8. Polling starts (every 60s)
9. Status updates (running → succeeded)
10. Model record created
11. User can deploy model
```

### Database Relationships

```
organizations (1) ──→ (N) fine_tuning_datasets
                        ↓ (1)
                        ↓
                       (N) training_examples
                        ↓
                        ↓ (1)
                       (N) fine_tuning_jobs
                        ↓ (1)
                        ↓
                       (N) fine_tuning_events
                        ↓
                        ↓ (1)
                       (1) fine_tuned_models
```

---

## Development Workflow

### Creating a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes
# - Backend: Add/modify services, controllers, entities
# - Frontend: Add/modify pages, components
# - Database: Create migration if needed

# 3. Test locally
npm run test              # Run tests (if available)
npm run build             # Check compilation

# 4. Commit with conventional commits
git add .
git commit -m "feat: add new feature description"

# 5. Push and create PR
git push origin feature/your-feature-name
```

### Code Style

**Backend (NestJS)**:
```typescript
// Use decorators
@Injectable()
export class MyService {
  // Dependency injection in constructor
  constructor(
    @InjectRepository(Entity)
    private repository: Repository<Entity>,
  ) {}

  // Async/await for all async operations
  async findAll(): Promise<Entity[]> {
    return this.repository.find();
  }

  // Use proper error handling
  async findOne(id: string): Promise<Entity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Entity ${id} not found`);
    }
    return entity;
  }
}
```

**Frontend (React)**:
```typescript
'use client';

// React Query for data fetching
const { data, isLoading } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => api.get(`/resource/${id}`),
});

// Mutations for updates
const mutation = useMutation({
  mutationFn: (data) => api.post('/resource', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] });
  },
});

// Use TypeScript for props
interface MyComponentProps {
  id: string;
  onSuccess: () => void;
}

export default function MyComponent({ id, onSuccess }: MyComponentProps) {
  // Component logic
}
```

### Adding a New Endpoint

**Step 1: Create DTO** (`backend/src/modules/fine-tuning/dto/`):
```typescript
export class CreateResourceDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;
}
```

**Step 2: Add Service Method** (`*.service.ts`):
```typescript
async create(createDto: CreateResourceDto, organizationId: string) {
  const resource = this.repository.create({
    ...createDto,
    organizationId,
  });
  return this.repository.save(resource);
}
```

**Step 3: Add Controller Endpoint** (`fine-tuning.controller.ts`):
```typescript
@Post('resource')
@ApiOperation({ summary: 'Create resource' })
@ApiResponse({ status: 201, type: ResourceDto })
async createResource(
  @Body() createDto: CreateResourceDto,
  @Request() req,
) {
  return this.service.create(createDto, req.user.organizationId);
}
```

**Step 4: Add Frontend Hook** (in component):
```typescript
const createMutation = useMutation({
  mutationFn: (data: CreateResourceDto) => 
    api.post('/fine-tuning/resource', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resources'] });
  },
});
```

---

## Testing Guide

### Manual Testing Checklist

**Dataset Flow**:
- [ ] Upload JSONL file
- [ ] Upload CSV file
- [ ] Validate dataset
- [ ] Import from conversations
- [ ] Delete dataset
- [ ] View dataset details

**Job Flow**:
- [ ] Create job with validated dataset
- [ ] View job progress
- [ ] Sync job status
- [ ] Cancel running job
- [ ] View job events
- [ ] Cost estimation

**Model Flow**:
- [ ] View completed model
- [ ] Deploy model to agent
- [ ] Archive model
- [ ] Delete model (if not deployed)

### Testing with Sample Data

```bash
# Generate sample dataset
./test-fine-tuning.sh

# Or manually create
cat > sample.jsonl << 'EOF'
{"messages": [{"role": "system", "content": "You are helpful."}, {"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello!"}]}
{"messages": [{"role": "system", "content": "You are helpful."}, {"role": "user", "content": "How are you?"}, {"role": "assistant", "content": "I'm doing well!"}]}
EOF
```

### API Testing with curl

```bash
# Login to get token
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.access_token')

# Test endpoints
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/fine-tuning/datasets

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/fine-tuning/jobs

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/fine-tuning/models
```

---

## Debugging Tips

### Backend Debugging

**Enable Verbose Logging**:
```typescript
// In service methods
this.logger.log(`Processing request for ${id}`);
this.logger.debug(`Data: ${JSON.stringify(data)}`);
this.logger.error(`Error: ${error.message}`, error.stack);
```

**Database Query Logging**:
```typescript
// In TypeORM config (app.module.ts)
TypeOrmModule.forRoot({
  logging: true,  // Enables SQL query logging
  ...
})
```

**Common Backend Issues**:

1. **"Dataset not found"**
   - Check organizationId filter
   - Verify dataset wasn't soft-deleted
   - Check database: `SELECT * FROM fine_tuning_datasets WHERE id='...'`

2. **"OpenAI API error"**
   - Verify OPENAI_API_KEY is set
   - Check API key has credits
   - Review OpenAI dashboard: https://platform.openai.com

3. **"Job stuck in pending"**
   - Check backend logs for errors
   - Verify async job startup didn't fail
   - Manually trigger: `POST /fine-tuning/jobs/:id/sync`

### Frontend Debugging

**React Query DevTools**:
```typescript
// Add to layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

**Common Frontend Issues**:

1. **"Data not updating"**
   - Check React Query cache keys
   - Verify invalidateQueries is called
   - Open DevTools to inspect cache

2. **"API call failing"**
   - Check Network tab in browser DevTools
   - Verify JWT token is valid
   - Check CORS settings

3. **"Component not re-rendering"**
   - Check if data is in React Query cache
   - Verify component is using the query
   - Check for React key issues in lists

### Database Debugging

```sql
-- View all datasets
SELECT id, name, validated, total_examples, created_at 
FROM fine_tuning_datasets 
WHERE deleted_at IS NULL;

-- View all jobs with status
SELECT id, name, status, progress_percentage, created_at 
FROM fine_tuning_jobs 
ORDER BY created_at DESC;

-- View job events
SELECT event_type, message, created_at 
FROM fine_tuning_events 
WHERE job_id = 'job-id-here' 
ORDER BY created_at DESC;

-- Check for orphaned records
SELECT COUNT(*) FROM fine_tuning_jobs WHERE dataset_id NOT IN (
  SELECT id FROM fine_tuning_datasets
);
```

---

## Common Tasks

### Task 1: Add Support for New AI Provider

**1. Create Provider Class**:
```typescript
// providers/anthropic.provider.ts
import { Injectable } from '@nestjs/common';
import { IFineTuningProvider } from './fine-tuning-provider.interface';

@Injectable()
export class AnthropicFineTuningProvider implements IFineTuningProvider {
  async createFineTuningJob(config: FineTuningJobConfig) {
    // Implement Anthropic-specific logic
  }
  
  async getJobStatus(providerJobId: string) {
    // Implement status checking
  }
  
  // ... implement other methods
}
```

**2. Register Provider**:
```typescript
// fine-tuning.module.ts
providers: [
  OpenAIFineTuningProvider,
  AnthropicFineTuningProvider,  // Add new provider
]

// fine-tuning-jobs.service.ts
constructor(
  private openaiProvider: OpenAIFineTuningProvider,
  private anthropicProvider: AnthropicFineTuningProvider,
) {
  this.providers.set('openai', openaiProvider);
  this.providers.set('anthropic', anthropicProvider);  // Register
}
```

### Task 2: Add New Hyperparameter

**1. Update DTO**:
```typescript
// dto/job.dto.ts
export class HyperparametersDto {
  // ... existing parameters
  
  @ApiPropertyOptional({ description: 'New parameter' })
  @IsOptional()
  @IsNumber()
  new_parameter?: number;
}
```

**2. Update Provider**:
```typescript
// providers/openai.provider.ts
async createFineTuningJob(config: FineTuningJobConfig) {
  const fineTuningJob = await this.openai.fineTuning.jobs.create({
    training_file: uploadedFile.id,
    model: config.baseModel,
    hyperparameters: {
      n_epochs: config.hyperparameters.n_epochs,
      new_parameter: config.hyperparameters.new_parameter,  // Add
    },
  });
}
```

**3. Update Frontend**:
```typescript
// jobs/new/page.tsx - Step 2
<div>
  <label>New Parameter</label>
  <input
    type="number"
    value={formData.hyperparameters.new_parameter}
    onChange={(e) =>
      setFormData({
        ...formData,
        hyperparameters: {
          ...formData.hyperparameters,
          new_parameter: parseFloat(e.target.value),
        },
      })
    }
  />
</div>
```

### Task 3: Add Job Notification

**1. Create Notification Service** (future):
```typescript
// notifications.service.ts
@Injectable()
export class NotificationsService {
  async notifyJobCompleted(job: FineTuningJob) {
    // Send email, webhook, etc.
  }
}
```

**2. Call in Job Service**:
```typescript
// fine-tuning-jobs.service.ts
async syncJobStatus(id: string, organizationId: string) {
  // ... existing code
  
  if (status.status === FineTuningJobStatus.SUCCEEDED) {
    await this.notificationsService.notifyJobCompleted(job);
  }
}
```

---

## Best Practices

### Backend

✅ **Always filter by organizationId** for data isolation
```typescript
const dataset = await this.repository.findOne({
  where: { id, organizationId },  // Always include!
});
```

✅ **Use TypeORM transactions** for multi-step operations
```typescript
await this.dataSource.transaction(async (manager) => {
  await manager.save(job);
  await manager.save(event);
});
```

✅ **Handle errors gracefully**
```typescript
try {
  await this.openaiProvider.createJob(config);
} catch (error) {
  this.logger.error(`Failed: ${error.message}`, error.stack);
  throw new BadRequestException(`Job creation failed: ${error.message}`);
}
```

✅ **Use DTOs for all inputs**
```typescript
// Bad
async create(name: string, description: string) { }

// Good
async create(createDto: CreateDto) { }
```

### Frontend

✅ **Use React Query for all API calls**
```typescript
// Bad
const [data, setData] = useState([]);
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

// Good
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: () => api.get('/data'),
});
```

✅ **Invalidate queries after mutations**
```typescript
const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resources'] });
  },
});
```

✅ **Show loading states**
```typescript
if (isLoading) {
  return <div>Loading...</div>;
}
```

✅ **Handle errors in UI**
```typescript
if (error) {
  return <div>Error: {error.message}</div>;
}
```

### Database

✅ **Use indexes for foreign keys**
```sql
CREATE INDEX idx_jobs_dataset_id ON fine_tuning_jobs(dataset_id);
```

✅ **Use soft deletes** for important data
```typescript
@Column({ name: 'deleted_at', nullable: true })
deletedAt: Date;

// In service
async remove(id: string) {
  await this.repository.update(id, { deletedAt: new Date() });
}
```

✅ **Add timestamps to all tables**
```typescript
@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;
```

---

## FAQ

### Q: How do I add a new status to jobs?

A: Update the enum in `fine-tuning-job.entity.ts` and handle it in the UI status badges.

### Q: Can I test without an OpenAI API key?

A: You can test dataset upload and validation, but actual job creation requires a valid key.

### Q: How do I reset my local database?

```bash
dropdb objecta-labs
createdb objecta-labs
psql -d objecta-labs -f backend/src/migrations/create-fine-tuning-tables.sql
```

### Q: Where are uploaded files stored?

A: In `backend/uploads/fine-tuning/` by default. Configure with environment variable.

### Q: How do I change the polling interval?

A: Modify `pollInterval` in `fine-tuning-jobs.service.ts` (currently 60000ms).

### Q: What's the max file upload size?

A: 100MB, configured in `fine-tuning.module.ts` Multer settings.

### Q: How do I add unit tests?

Create `*.spec.ts` files next to your services:
```typescript
describe('FineTuningJobsService', () => {
  it('should create a job', async () => {
    // Test implementation
  });
});
```

### Q: How do I access Swagger docs?

Visit: http://localhost:3001/api/docs

---

## Resources

### Documentation
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeORM Docs](https://typeorm.io)
- [React Query Docs](https://tanstack.com/query/latest)
- [OpenAI Fine-Tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)

### Internal Docs
- `FINE-TUNING-ARCHITECTURE-DIAGRAMS.md` - Visual diagrams
- `FINE-TUNING-API-DOCUMENTATION.md` - Complete API reference
- `FINE-TUNING-QUICK-START.md` - User guide
- `FINE-TUNING-FEATURE-SUMMARY.md` - Technical overview

### Getting Help
1. Check documentation files
2. Review API docs at `/api/docs`
3. Search existing code for examples
4. Ask the team in Slack/Discord
5. Check backend logs for errors

---

## Next Steps

Now that you're set up:

1. ✅ Run through the Quick Start guide
2. ✅ Explore the codebase
3. ✅ Try creating a dataset and job
4. ✅ Review the architecture diagrams
5. ✅ Pick a small task to work on
6. ✅ Ask questions when stuck!

**Welcome to the team! 🎉**

---

**Last Updated**: January 2024  
**Maintainer**: Development Team

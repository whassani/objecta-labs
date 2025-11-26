# Background Jobs System

A centralized background job management system using Bull (Redis-based queue) for handling long-running operations.

## Features

- ✅ **Centralized Job Queue** - All background jobs managed in one place
- ✅ **Real-time Progress** - WebSocket updates for job progress
- ✅ **Job Persistence** - All jobs stored in PostgreSQL database
- ✅ **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Priority Queues** - Jobs can be prioritized
- ✅ **Multiple Queues** - Separate queues for different job types
- ✅ **Job Cancellation** - Cancel pending or active jobs
- ✅ **Statistics & Monitoring** - Track job success/failure rates

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ JobsService  │────▶│  Bull Queue │
│  (Frontend) │     │ (API Layer)  │     │   (Redis)   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       │                    ▼                     ▼
       │            ┌──────────────┐     ┌─────────────┐
       └───────────▶│ JobsGateway  │     │  Processor  │
         WebSocket  │  (Real-time) │     │  (Worker)   │
                    └──────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  PostgreSQL  │◀────│  Job Result │
                    │   (Job DB)   │     │             │
                    └──────────────┘     └─────────────┘
```

## Setup

### 1. Install Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 2. Configure Environment Variables

Add to `.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional
```

### 3. Run Database Migration

```bash
psql -U postgres -d agentforge -f src/migrations/create-jobs-table.sql
```

## Usage

### Creating a Job

```typescript
import { JobsService } from './modules/jobs/jobs.service';

// Inject JobsService
constructor(private jobsService: JobsService) {}

// Create a job
const job = await this.jobsService.createJob(
  userId,
  organizationId,
  {
    type: 'data-conversion',
    name: 'Convert CSV to JSONL',
    description: 'Converting customer data',
    data: {
      filePath: '/path/to/file.csv',
      options: { ... },
    },
    priority: 1, // Higher number = higher priority
    maxAttempts: 3,
  }
);

// Return job ID to client
return { jobId: job.id };
```

### Creating a Processor

```typescript
// src/modules/jobs/processors/my-task.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { JobsService } from '../jobs.service';

@Processor('my-queue-name')
export class MyTaskProcessor {
  constructor(private jobsService: JobsService) {}

  @Process('my-task-type')
  async handleTask(job: Job) {
    const { jobId, ...data } = job.data;

    try {
      // Update status to active
      await this.jobsService.updateJobStatus(jobId, 'active');

      // Do work with progress updates
      for (let i = 0; i < 100; i++) {
        await this.jobsService.updateJobProgress(
          jobId,
          i + 1,
          100,
          `Processing item ${i + 1} of 100`
        );
        
        // Do actual work here
        await doWork(data);
      }

      // Mark as completed
      await this.jobsService.updateJobStatus(jobId, 'completed', {
        result: { message: 'Task completed successfully' },
      });

      return { success: true };
    } catch (error) {
      // Mark as failed
      await this.jobsService.updateJobStatus(jobId, 'failed', {
        error: { message: error.message, stack: error.stack },
      });
      throw error;
    }
  }
}
```

### Frontend Integration

```typescript
import { useJobProgress } from '@/hooks/useJobProgress';
import JobProgressModal from '@/components/jobs/JobProgressModal';

function MyComponent() {
  const [jobId, setJobId] = useState<string | null>(null);
  
  const handleStartJob = async () => {
    const response = await api.post('/my-endpoint', data);
    setJobId(response.jobId);
  };

  return (
    <>
      <button onClick={handleStartJob}>Start Job</button>
      
      {jobId && (
        <JobProgressModal
          jobId={jobId}
          onClose={() => setJobId(null)}
          onComplete={(result) => {
            console.log('Job completed!', result);
          }}
        />
      )}
    </>
  );
}
```

## Job Types

Currently supported job types:

- `data-conversion` - Converting data formats (CSV, JSON, JSONL)
- `fine-tuning` - Model fine-tuning operations
- `workflow-execution` - Workflow automation execution
- `document-processing` - Document parsing and embedding
- `model-training` - Custom model training
- `bulk-operation` - Bulk data operations

## API Endpoints

### Create Job
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "data-conversion",
  "name": "My Job",
  "description": "Job description",
  "data": { ... },
  "priority": 1
}
```

### Get Job
```http
GET /api/jobs/:id
Authorization: Bearer <token>
```

### List Jobs
```http
GET /api/jobs?type=data-conversion&status=active&limit=20&offset=0
Authorization: Bearer <token>
```

### Cancel Job
```http
PATCH /api/jobs/:id/cancel
Authorization: Bearer <token>
```

### Retry Job
```http
POST /api/jobs/:id/retry
Authorization: Bearer <token>
```

### Get Statistics
```http
GET /api/jobs/stats
Authorization: Bearer <token>
```

## WebSocket Events

Connect to: `ws://localhost:3001/jobs?userId=<userId>`

### Events Received

- `job-created` - New job created
- `job-update` - Job status or progress updated
- `job-completed` - Job completed successfully
- `job-failed` - Job failed with error

### Events Sent

- `subscribe-job` - Subscribe to specific job updates
- `unsubscribe-job` - Unsubscribe from job updates

## Monitoring

### View Queue Status

```bash
# Using Bull Board (optional)
npm install @bull-board/api @bull-board/nestjs
```

### Redis CLI

```bash
redis-cli

# View all keys
KEYS *

# Monitor commands in real-time
MONITOR

# Get queue info
HGETALL bull:data-conversion:id
```

## Best Practices

1. **Always return job ID immediately** - Don't wait for job completion
2. **Update progress frequently** - Keep users informed
3. **Handle errors gracefully** - Store error details for debugging
4. **Set appropriate priorities** - Critical jobs should have higher priority
5. **Clean up old jobs** - Run cleanup regularly to prevent DB bloat
6. **Monitor queue health** - Track success/failure rates
7. **Use specific job types** - Makes monitoring and debugging easier

## Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis logs
tail -f /usr/local/var/log/redis.log
```

### Jobs Stuck in Queue

```bash
# Clear failed jobs
redis-cli DEL bull:data-conversion:failed

# Restart workers
npm run start:dev
```

### Memory Issues

```bash
# Monitor Redis memory
redis-cli INFO memory

# Set maxmemory policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Future Enhancements

- [ ] Job scheduling (cron-like)
- [ ] Job dependencies (job A → job B → job C)
- [ ] Job batching
- [ ] Dead letter queue
- [ ] Rate limiting
- [ ] Job metrics dashboard
- [ ] Email notifications for job completion
- [ ] Slack/Discord webhooks

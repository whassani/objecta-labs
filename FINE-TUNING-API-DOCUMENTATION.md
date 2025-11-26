# 📡 Fine-Tuning API Documentation

## Overview

Complete API reference for the Fine-Tuning system. All endpoints require JWT authentication.

**Base URL**: `http://localhost:3001/api`  
**Authentication**: Bearer token in Authorization header  
**Content-Type**: `application/json` (except file uploads)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Datasets API](#datasets-api)
3. [Jobs API](#jobs-api)
4. [Models API](#models-api)
5. [Error Responses](#error-responses)
6. [Rate Limits](#rate-limits)

---

## Authentication

All endpoints require a valid JWT token:

```http
Authorization: Bearer <your_jwt_token>
```

The token contains:
- `userId` - User ID
- `organizationId` - Organization ID for data isolation
- `workspaceId` - Optional workspace context

---

## Datasets API

### 1. Upload Dataset

Upload a new training dataset file.

**Endpoint**: `POST /fine-tuning/datasets`

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data**:
```
file: <file>          # Required - JSONL, CSV, or JSON file (max 100MB)
name: string          # Required - Dataset name
description: string   # Optional - Dataset description
format: string        # Required - 'jsonl', 'csv', or 'json'
workspaceId: string   # Optional - Workspace ID
source: string        # Optional - 'upload', 'conversations', 'api'
```

**Example Request** (using curl):
```bash
curl -X POST http://localhost:3001/fine-tuning/datasets \
  -H "Authorization: Bearer eyJhbGc..." \
  -F "file=@training_data.jsonl" \
  -F "name=Customer Support Dataset" \
  -F "description=Training data for support queries" \
  -F "format=jsonl"
```

**Success Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "org-123",
  "workspaceId": null,
  "name": "Customer Support Dataset",
  "description": "Training data for support queries",
  "filePath": "/uploads/fine-tuning/1234567890-training_data.jsonl",
  "fileSizeBytes": 1048576,
  "format": "jsonl",
  "totalExamples": 0,
  "validated": false,
  "validationErrors": null,
  "source": "upload",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "creator": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**:
- `400` - File missing or validation failed
- `401` - Unauthorized (invalid token)
- `413` - File too large (>100MB)

---

### 2. List Datasets

Get all datasets for the organization.

**Endpoint**: `GET /fine-tuning/datasets`

**Query Parameters**:
```
workspaceId: string   # Optional - Filter by workspace
```

**Example Request**:
```bash
curl -X GET "http://localhost:3001/fine-tuning/datasets?workspaceId=ws-123" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response** (200 OK):
```json
[
  {
    "id": "dataset-1",
    "name": "Customer Support Dataset",
    "description": "Training data for support queries",
    "format": "jsonl",
    "totalExamples": 150,
    "validated": true,
    "fileSizeBytes": 1048576,
    "source": "upload",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "creator": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
]
```

---

### 3. Get Dataset Details

Get details of a specific dataset.

**Endpoint**: `GET /fine-tuning/datasets/:id`

**Path Parameters**:
- `id` - Dataset ID (UUID)

**Example Request**:
```bash
curl -X GET http://localhost:3001/fine-tuning/datasets/dataset-1 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response** (200 OK):
```json
{
  "id": "dataset-1",
  "organizationId": "org-123",
  "name": "Customer Support Dataset",
  "description": "Training data for support queries",
  "filePath": "/uploads/fine-tuning/1234567890-training_data.jsonl",
  "fileSizeBytes": 1048576,
  "format": "jsonl",
  "totalExamples": 150,
  "validated": true,
  "validationErrors": null,
  "source": "upload",
  "sourceFilters": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "workspace": null,
  "creator": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses**:
- `404` - Dataset not found

---

### 4. Update Dataset

Update dataset metadata.

**Endpoint**: `PUT /fine-tuning/datasets/:id`

**Request Body**:
```json
{
  "name": "Updated Dataset Name",
  "description": "Updated description"
}
```

**Success Response** (200 OK):
```json
{
  "id": "dataset-1",
  "name": "Updated Dataset Name",
  "description": "Updated description",
  ...
}
```

---

### 5. Delete Dataset

Delete a dataset (soft delete).

**Endpoint**: `DELETE /fine-tuning/datasets/:id`

**Example Request**:
```bash
curl -X DELETE http://localhost:3001/fine-tuning/datasets/dataset-1 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response** (200 OK):
```json
{
  "message": "Dataset deleted successfully"
}
```

**Error Responses**:
- `400` - Dataset is being used by an active job
- `404` - Dataset not found

---

### 6. Validate Dataset

Validate dataset format and structure.

**Endpoint**: `POST /fine-tuning/datasets/:id/validate`

**Example Request**:
```bash
curl -X POST http://localhost:3001/fine-tuning/datasets/dataset-1/validate \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response** (200 OK):
```json
{
  "valid": true,
  "totalExamples": 150,
  "totalTokens": 75000
}
```

**Validation Errors Response**:
```json
{
  "valid": false,
  "totalExamples": 8,
  "totalTokens": 4000,
  "errors": [
    "Line 3: Missing or invalid 'messages' array",
    "Line 5: Invalid role 'moderator'",
    "Insufficient examples: 8 (minimum 10 required)"
  ]
}
```

---

### 7. Import from Conversations

Create a dataset by importing conversation history.

**Endpoint**: `POST /fine-tuning/datasets/import-from-conversations`

**Request Body**:
```json
{
  "name": "Imported Conversations",
  "description": "Dataset from customer conversations",
  "workspaceId": "ws-123",
  "agentId": "agent-456",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "minQualityScore": 0.7,
  "maxExamples": 1000
}
```

**Success Response** (201 Created):
```json
{
  "id": "dataset-2",
  "name": "Imported Conversations",
  "totalExamples": 847,
  "format": "jsonl",
  "source": "conversations",
  "sourceFilters": {
    "agentId": "agent-456",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  },
  ...
}
```

**Error Responses**:
- `400` - No conversations found matching criteria

---

### 8. Get Dataset Statistics

Get aggregate statistics for all datasets.

**Endpoint**: `GET /fine-tuning/datasets/stats`

**Query Parameters**:
```
workspaceId: string   # Optional - Filter by workspace
```

**Success Response** (200 OK):
```json
{
  "totalDatasets": 5,
  "totalExamples": 2450,
  "totalSizeBytes": 5242880,
  "validatedDatasets": 4,
  "byFormat": {
    "jsonl": 4,
    "csv": 1
  },
  "bySource": {
    "upload": 3,
    "conversations": 2
  }
}
```

---

## Jobs API

### 9. Create Fine-Tuning Job

Create a new fine-tuning job.

**Endpoint**: `POST /fine-tuning/jobs`

**Request Body**:
```json
{
  "name": "Customer Support Model v1",
  "description": "Fine-tuned for support queries",
  "datasetId": "dataset-1",
  "baseModel": "gpt-3.5-turbo-1106",
  "provider": "openai",
  "workspaceId": "ws-123",
  "hyperparameters": {
    "n_epochs": 3,
    "batch_size": 4,
    "learning_rate_multiplier": 1.0,
    "prompt_loss_weight": 0.01
  },
  "validationSplit": 0.2
}
```

**Field Descriptions**:
- `name` - Job name (required)
- `description` - Job description (optional)
- `datasetId` - ID of validated dataset (required)
- `baseModel` - Base model to fine-tune (required)
  - Options: `gpt-3.5-turbo-1106`, `gpt-3.5-turbo-0613`, `gpt-4-0613`
- `provider` - AI provider (default: `openai`)
- `hyperparameters.n_epochs` - Training epochs (1-50, default: 3)
- `hyperparameters.batch_size` - Batch size (default: 4)
- `hyperparameters.learning_rate_multiplier` - Learning rate (0.01-10, default: 1.0)
- `validationSplit` - Validation data split (0-0.5, default: 0.2)

**Success Response** (201 Created):
```json
{
  "id": "job-1",
  "organizationId": "org-123",
  "workspaceId": "ws-123",
  "datasetId": "dataset-1",
  "name": "Customer Support Model v1",
  "description": "Fine-tuned for support queries",
  "baseModel": "gpt-3.5-turbo-1106",
  "provider": "openai",
  "providerJobId": null,
  "hyperparameters": {
    "n_epochs": 3,
    "batch_size": 4,
    "learning_rate_multiplier": 1.0
  },
  "status": "pending",
  "progressPercentage": 0,
  "currentEpoch": null,
  "totalEpochs": 3,
  "trainedTokens": null,
  "trainingLoss": null,
  "validationLoss": null,
  "resultModelId": null,
  "estimatedCostUsd": 12.50,
  "actualCostUsd": null,
  "errorMessage": null,
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- `400` - Dataset not found or not validated
- `400` - Invalid hyperparameters

---

### 10. List Fine-Tuning Jobs

Get all fine-tuning jobs.

**Endpoint**: `GET /fine-tuning/jobs`

**Query Parameters**:
```
workspaceId: string   # Optional - Filter by workspace
```

**Success Response** (200 OK):
```json
[
  {
    "id": "job-1",
    "name": "Customer Support Model v1",
    "status": "running",
    "progressPercentage": 45,
    "baseModel": "gpt-3.5-turbo-1106",
    "estimatedCostUsd": 12.50,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "dataset": {
      "id": "dataset-1",
      "name": "Customer Support Dataset",
      "totalExamples": 150
    },
    "creator": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
]
```

---

### 11. Get Job Details

Get detailed information about a specific job.

**Endpoint**: `GET /fine-tuning/jobs/:id`

**Success Response** (200 OK):
```json
{
  "id": "job-1",
  "organizationId": "org-123",
  "name": "Customer Support Model v1",
  "description": "Fine-tuned for support queries",
  "datasetId": "dataset-1",
  "baseModel": "gpt-3.5-turbo-1106",
  "provider": "openai",
  "providerJobId": "ftjob-abc123",
  "status": "running",
  "progressPercentage": 45,
  "currentEpoch": 2,
  "totalEpochs": 3,
  "trainedTokens": 150000,
  "trainingLoss": 0.3245,
  "validationLoss": 0.3512,
  "estimatedCostUsd": 12.50,
  "startedAt": "2024-01-15T10:35:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "dataset": {
    "id": "dataset-1",
    "name": "Customer Support Dataset",
    "totalExamples": 150
  },
  "resultModel": null
}
```

---

### 12. Update Job

Update job metadata.

**Endpoint**: `PUT /fine-tuning/jobs/:id`

**Request Body**:
```json
{
  "name": "Updated Job Name",
  "description": "Updated description"
}
```

**Success Response** (200 OK):
```json
{
  "id": "job-1",
  "name": "Updated Job Name",
  "description": "Updated description",
  ...
}
```

---

### 13. Cancel Job

Cancel a running fine-tuning job.

**Endpoint**: `POST /fine-tuning/jobs/:id/cancel`

**Example Request**:
```bash
curl -X POST http://localhost:3001/fine-tuning/jobs/job-1/cancel \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response** (200 OK):
```json
{
  "id": "job-1",
  "status": "cancelled",
  "cancelledAt": "2024-01-15T11:00:00.000Z",
  ...
}
```

**Error Responses**:
- `400` - Job cannot be cancelled (already completed or failed)

---

### 14. Get Job Events

Get event logs for a job.

**Endpoint**: `GET /fine-tuning/jobs/:id/events`

**Success Response** (200 OK):
```json
[
  {
    "id": "event-1",
    "jobId": "job-1",
    "eventType": "status_change",
    "message": "Job started with provider ID: ftjob-abc123",
    "metadata": {
      "oldStatus": "pending",
      "newStatus": "running"
    },
    "createdAt": "2024-01-15T10:35:00.000Z"
  },
  {
    "id": "event-2",
    "eventType": "progress_update",
    "message": "Completed epoch 1 of 3",
    "metadata": {
      "epoch": 1,
      "loss": 0.4521
    },
    "createdAt": "2024-01-15T11:15:00.000Z"
  }
]
```

---

### 15. Sync Job Status

Manually sync job status with provider.

**Endpoint**: `POST /fine-tuning/jobs/:id/sync`

**Example Request**:
```bash
curl -X POST http://localhost:3001/fine-tuning/jobs/job-1/sync \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response** (200 OK):
```json
{
  "id": "job-1",
  "status": "running",
  "progressPercentage": 67,
  "currentEpoch": 3,
  "trainedTokens": 225000,
  ...
}
```

---

### 16. Estimate Cost

Estimate the cost of a fine-tuning job before creating it.

**Endpoint**: `POST /fine-tuning/jobs/estimate-cost`

**Request Body**:
```json
{
  "datasetId": "dataset-1",
  "baseModel": "gpt-3.5-turbo-1106",
  "epochs": 3
}
```

**Success Response** (200 OK):
```json
{
  "estimatedCostUsd": 12.50,
  "totalTokens": 75000,
  "trainingTokens": 60000,
  "validationTokens": 15000,
  "epochs": 3,
  "baseModel": "gpt-3.5-turbo-1106",
  "breakdown": {
    "trainingCost": 10.00,
    "validationCost": 2.50
  }
}
```

---

## Models API

### 17. List Fine-Tuned Models

Get all fine-tuned models.

**Endpoint**: `GET /fine-tuning/models`

**Query Parameters**:
```
workspaceId: string   # Optional - Filter by workspace
```

**Success Response** (200 OK):
```json
[
  {
    "id": "model-1",
    "organizationId": "org-123",
    "jobId": "job-1",
    "name": "Customer Support Model v1 - Model",
    "description": null,
    "baseModel": "gpt-3.5-turbo-1106",
    "provider": "openai",
    "providerModelId": "ft:gpt-3.5-turbo:org:model:abc123",
    "trainingAccuracy": null,
    "validationAccuracy": null,
    "finalLoss": 0.2341,
    "deployed": true,
    "deployedAt": "2024-01-15T14:00:00.000Z",
    "deploymentCount": 2,
    "totalTokensUsed": 50000,
    "totalRequests": 125,
    "averageLatencyMs": 850,
    "version": 1,
    "status": "active",
    "createdAt": "2024-01-15T13:45:00.000Z",
    "job": {
      "id": "job-1",
      "name": "Customer Support Model v1",
      "completedAt": "2024-01-15T13:45:00.000Z"
    }
  }
]
```

---

### 18. Get Model Details

Get detailed information about a specific model.

**Endpoint**: `GET /fine-tuning/models/:id`

**Success Response** (200 OK):
```json
{
  "id": "model-1",
  "organizationId": "org-123",
  "workspaceId": "ws-123",
  "jobId": "job-1",
  "name": "Customer Support Model v1 - Model",
  "description": "Fine-tuned model for support queries",
  "baseModel": "gpt-3.5-turbo-1106",
  "provider": "openai",
  "providerModelId": "ft:gpt-3.5-turbo:org:model:abc123",
  "finalLoss": 0.2341,
  "deployed": true,
  "deployedAt": "2024-01-15T14:00:00.000Z",
  "deploymentCount": 2,
  "totalTokensUsed": 50000,
  "totalRequests": 125,
  "averageLatencyMs": 850,
  "version": 1,
  "parentModelId": null,
  "status": "active",
  "createdAt": "2024-01-15T13:45:00.000Z",
  "updatedAt": "2024-01-15T14:00:00.000Z",
  "job": {
    "id": "job-1",
    "name": "Customer Support Model v1",
    "completedAt": "2024-01-15T13:45:00.000Z",
    "dataset": {
      "id": "dataset-1",
      "name": "Customer Support Dataset"
    }
  }
}
```

---

### 19. Update Model

Update model metadata.

**Endpoint**: `PUT /fine-tuning/models/:id`

**Request Body**:
```json
{
  "name": "Customer Support Model v1.1",
  "description": "Updated model description",
  "status": "active"
}
```

**Success Response** (200 OK):
```json
{
  "id": "model-1",
  "name": "Customer Support Model v1.1",
  "description": "Updated model description",
  ...
}
```

---

### 20. Deploy Model

Deploy a model (optionally to a specific agent).

**Endpoint**: `POST /fine-tuning/models/:id/deploy`

**Request Body**:
```json
{
  "agentId": "agent-456"
}
```

**Success Response** (200 OK):
```json
{
  "id": "model-1",
  "deployed": true,
  "deployedAt": "2024-01-15T14:00:00.000Z",
  "deploymentCount": 1,
  ...
}
```

**Note**: If `agentId` is provided, the specified agent will be updated to use this model.

---

### 21. Archive Model

Archive a model (sets status to 'archived').

**Endpoint**: `POST /fine-tuning/models/:id/archive`

**Success Response** (200 OK):
```json
{
  "id": "model-1",
  "status": "archived",
  "archivedAt": "2024-01-15T15:00:00.000Z",
  ...
}
```

---

### 22. Delete Model

Delete a model.

**Endpoint**: `DELETE /fine-tuning/models/:id`

**Example Request**:
```bash
curl -X DELETE http://localhost:3001/fine-tuning/models/model-1 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response** (200 OK):
```json
{
  "message": "Model deleted successfully"
}
```

**Error Responses**:
- `400` - Cannot delete deployed model (undeploy first)

---

### 23. Get Model Statistics

Get aggregate statistics for all models.

**Endpoint**: `GET /fine-tuning/models/stats`

**Query Parameters**:
```
workspaceId: string   # Optional - Filter by workspace
```

**Success Response** (200 OK):
```json
{
  "totalModels": 5,
  "deployedModels": 3,
  "activeModels": 4,
  "archivedModels": 1,
  "totalTokensUsed": 250000,
  "totalRequests": 625,
  "averageLatency": 780,
  "byProvider": {
    "openai": 5
  },
  "byBaseModel": {
    "gpt-3.5-turbo-1106": 4,
    "gpt-4-0613": 1
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message describing what went wrong",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation error, invalid data)
- `401` - Unauthorized (missing or invalid JWT token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `413` - Payload Too Large (file >100MB)
- `422` - Unprocessable Entity (semantic errors)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Examples

**Validation Error**:
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "datasetId must be a UUID"
  ],
  "error": "Bad Request"
}
```

**Not Found**:
```json
{
  "statusCode": 404,
  "message": "Dataset with ID dataset-123 not found",
  "error": "Not Found"
}
```

**Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## Rate Limits

**Current Limits** (per organization):
- Dataset uploads: 10 per hour
- Job creation: 5 per hour
- All other endpoints: 100 per minute

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

When rate limited:
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests"
}
```

---

## Job Status Values

Jobs progress through these statuses:

| Status | Description |
|--------|-------------|
| `pending` | Job created, waiting to start |
| `validating` | Validating dataset with provider |
| `queued` | In provider's queue |
| `running` | Training in progress |
| `succeeded` | Training completed successfully |
| `failed` | Training failed |
| `cancelled` | User cancelled the job |

---

## Model Status Values

| Status | Description |
|--------|-------------|
| `active` | Model is available for use |
| `archived` | Model is archived (not deleted) |
| `deprecated` | Model is deprecated (should not be used) |

---

## JSONL Format Example

Training data must be in JSONL format (one JSON object per line):

```jsonl
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is AI?"}, {"role": "assistant", "content": "AI stands for Artificial Intelligence..."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "How does machine learning work?"}, {"role": "assistant", "content": "Machine learning is a subset of AI..."}]}
```

**Requirements**:
- Each line must be valid JSON
- Must have `messages` array
- Each message needs `role` and `content`
- Valid roles: `system`, `user`, `assistant`
- Minimum 10 examples required
- At least one `user` and one `assistant` message per example

---

## Webhooks (Future)

Webhook support for job events coming soon:

```json
POST https://your-domain.com/webhook
{
  "event": "job.completed",
  "jobId": "job-1",
  "status": "succeeded",
  "modelId": "model-1",
  "timestamp": "2024-01-15T13:45:00.000Z"
}
```

---

## OpenAPI/Swagger

Interactive API documentation available at:
**http://localhost:3001/api/docs**

---

## Support

- API Issues: Check backend logs
- Questions: See FINE-TUNING-QUICK-START.md
- Bug Reports: Create an issue in the repository

---

**Last Updated**: January 2024  
**API Version**: 1.0.0

# ObjectaLabs Fine-Tuning Module Specification

## Overview

The **Fine-Tuning Module** allows customers to create custom-trained models based on their specific use cases, improving agent performance and reducing costs.

---

## 1. Fine-Tuning Stack

### Recommended Technologies

#### Primary: OpenAI Fine-Tuning API
**Why**: Best integration with LangChain.js, production-ready

```typescript
import { OpenAI } from '@langchain/openai';
import OpenAI from 'openai';

// OpenAI supports fine-tuning for:
// - GPT-3.5-turbo (most cost-effective)
// - GPT-4 (coming soon)
// - GPT-4o-mini (recommended for most use cases)
```

**Pros**:
- ✅ Native LangChain.js support
- ✅ Production-ready infrastructure
- ✅ Automatic hosting & scaling
- ✅ Pay-per-use pricing
- ✅ Easy to implement

**Cons**:
- ❌ Vendor lock-in
- ❌ Less control over training process
- ❌ Costs can add up

#### Secondary: Together.ai (Open Source Models)
**Why**: Fine-tune Llama 2, Mistral, etc. - More control, lower costs

```typescript
import { ChatOpenAI } from '@langchain/openai';

// Compatible with OpenAI API format
const llm = new ChatOpenAI({
  openAIApiKey: process.env.TOGETHER_API_KEY,
  modelName: 'your-fine-tuned-model-id',
  configuration: {
    baseURL: 'https://api.together.xyz/v1',
  },
});
```

**Pros**:
- ✅ Open-source models (Llama 2, Mistral, etc.)
- ✅ More affordable
- ✅ Full control over model
- ✅ OpenAI-compatible API

**Cons**:
- ❌ More complex setup
- ❌ Need more training data
- ❌ Longer training times

#### Tertiary: Anthropic (Coming Soon)
**Status**: Fine-tuning not yet available, but planned

#### Alternative: Few-Shot Prompting (No Fine-Tuning)
**For MVP**: Use examples in prompts instead of fine-tuning

```typescript
const prompt = `You are a customer support agent for Acme Corp.

Examples of good responses:
Q: What's your return policy?
A: We offer a 30-day money-back guarantee...

Q: How do I reset my password?
A: Click on 'Forgot Password' on the login page...

Now answer this question:
Q: ${userQuestion}
A:`;
```

---

## 2. Recommended Approach for ObjectaLabs

### Phase 1: MVP (Months 1-6)
**Use**: **Few-Shot Prompting + RAG** (No fine-tuning)

**Why**:
- ✅ Faster to implement
- ✅ No training time needed
- ✅ Lower complexity
- ✅ Good enough for most use cases
- ✅ Cost-effective

**Implementation**:
```typescript
// Use LangChain's FewShotPromptTemplate
import { FewShotPromptTemplate, PromptTemplate } from '@langchain/core/prompts';

const examplePrompt = PromptTemplate.fromTemplate(
  'Question: {question}\nAnswer: {answer}'
);

const fewShotPrompt = new FewShotPromptTemplate({
  examples: [
    {
      question: 'What is your return policy?',
      answer: 'We offer 30-day returns...',
    },
    {
      question: 'How do I track my order?',
      answer: 'You can track your order...',
    },
  ],
  examplePrompt,
  prefix: 'You are a helpful customer support agent.',
  suffix: 'Question: {input}\nAnswer:',
  inputVariables: ['input'],
});
```

### Phase 2: Advanced (Months 7-12)
**Add**: **OpenAI Fine-Tuning** for premium customers

**Why**:
- ✅ Better performance for specific use cases
- ✅ Lower token costs at scale
- ✅ Faster responses (smaller models)
- ✅ Premium feature differentiation

### Phase 3: Enterprise (Year 2+)
**Add**: **Custom Model Hosting** (Together.ai, HuggingFace)

**Why**:
- ✅ Complete data privacy
- ✅ On-premise deployment option
- ✅ Cost optimization at scale
- ✅ Compliance requirements (HIPAA, etc.)

---

## 3. Fine-Tuning Module Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│          Fine-Tuning Module                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Data Collection                              │
│     ├─ Conversation Export                       │
│     ├─ Manual Example Upload                     │
│     └─ Format Validation                         │
│                                                  │
│  2. Data Preparation                             │
│     ├─ JSONL Formatter                           │
│     ├─ Quality Checks                            │
│     └─ Train/Validation Split                    │
│                                                  │
│  3. Training Job Management                      │
│     ├─ Submit to OpenAI/Together.ai              │
│     ├─ Monitor Progress                          │
│     └─ Cost Estimation                           │
│                                                  │
│  4. Model Management                             │
│     ├─ Model Registry                            │
│     ├─ Version Control                           │
│     └─ A/B Testing                               │
│                                                  │
│  5. Deployment                                   │
│     ├─ Agent Model Selection                     │
│     ├─ Fallback to Base Model                    │
│     └─ Performance Monitoring                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 4. Database Schema

```sql
-- Fine-tuning jobs
CREATE TABLE fine_tuning_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    base_model VARCHAR(100) NOT NULL, -- gpt-3.5-turbo, gpt-4o-mini, etc.
    provider VARCHAR(50) NOT NULL, -- openai, together, etc.
    
    -- Training data
    training_file_id VARCHAR(255), -- Provider's file ID
    validation_file_id VARCHAR(255),
    training_examples_count INTEGER,
    
    -- Job status
    status VARCHAR(50) NOT NULL DEFAULT 'preparing', -- preparing, submitted, running, completed, failed
    provider_job_id VARCHAR(255), -- OpenAI job ID
    
    -- Results
    fine_tuned_model_id VARCHAR(255), -- Provider's model ID
    training_started_at TIMESTAMP,
    training_completed_at TIMESTAMP,
    
    -- Metrics
    training_loss DECIMAL(10,6),
    validation_loss DECIMAL(10,6),
    training_tokens INTEGER,
    estimated_cost DECIMAL(10,4),
    actual_cost DECIMAL(10,4),
    
    -- Metadata
    hyperparameters JSONB DEFAULT '{}',
    error_message TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_finetuning_jobs_org_id ON fine_tuning_jobs(organization_id);
CREATE INDEX idx_finetuning_jobs_status ON fine_tuning_jobs(status);

-- Fine-tuned models registry
CREATE TABLE fine_tuned_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    fine_tuning_job_id UUID REFERENCES fine_tuning_jobs(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(50) NOT NULL,
    provider_model_id VARCHAR(255) NOT NULL, -- OpenAI model ID
    base_model VARCHAR(100) NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, deprecated, deleted
    is_default BOOLEAN DEFAULT FALSE, -- Default for new agents
    
    -- Usage tracking
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms INTEGER,
    success_rate DECIMAL(5,2),
    user_satisfaction_score DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_finetuned_models_org_id ON fine_tuned_models(organization_id);
CREATE INDEX idx_finetuned_models_status ON fine_tuned_models(status);

-- Training examples (for fine-tuning)
CREATE TABLE training_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    agent_id UUID REFERENCES agents(id),
    
    -- Example data
    system_message TEXT,
    user_message TEXT NOT NULL,
    assistant_message TEXT NOT NULL,
    
    -- Source
    source VARCHAR(50) DEFAULT 'manual', -- manual, conversation, imported
    conversation_id UUID REFERENCES conversations(id),
    
    -- Quality
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES users(id),
    quality_score DECIMAL(3,2), -- 0-1
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_training_examples_org_id ON training_examples(organization_id);
CREATE INDEX idx_training_examples_agent_id ON training_examples(agent_id);
CREATE INDEX idx_training_examples_validated ON training_examples(is_validated);
```

---

## 5. NestJS Implementation

### Fine-Tuning Service

```typescript
// src/modules/fine-tuning/fine-tuning.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { FineTuningJob } from './entities/fine-tuning-job.entity';
import { TrainingExample } from './entities/training-example.entity';

@Injectable()
export class FineTuningService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(FineTuningJob)
    private jobRepository: Repository<FineTuningJob>,
    @InjectRepository(TrainingExample)
    private exampleRepository: Repository<TrainingExample>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Prepare training data from examples
   */
  async prepareTrainingData(
    organizationId: string,
    agentId?: string,
  ): Promise<string> {
    // Get validated training examples
    const examples = await this.exampleRepository.find({
      where: {
        organizationId,
        ...(agentId && { agentId }),
        isValidated: true,
      },
    });

    if (examples.length < 10) {
      throw new Error('Need at least 10 validated examples for fine-tuning');
    }

    // Convert to OpenAI format (JSONL)
    const jsonlData = examples
      .map((example) => {
        return JSON.stringify({
          messages: [
            ...(example.systemMessage
              ? [{ role: 'system', content: example.systemMessage }]
              : []),
            { role: 'user', content: example.userMessage },
            { role: 'assistant', content: example.assistantMessage },
          ],
        });
      })
      .join('\n');

    // Upload to OpenAI
    const file = await this.openai.files.create({
      file: Buffer.from(jsonlData),
      purpose: 'fine-tune',
    });

    return file.id;
  }

  /**
   * Create fine-tuning job
   */
  async createFineTuningJob(
    organizationId: string,
    data: CreateFineTuningJobDto,
  ): Promise<FineTuningJob> {
    // Prepare training data
    const trainingFileId = await this.prepareTrainingData(
      organizationId,
      data.agentId,
    );

    // Create job record
    const job = this.jobRepository.create({
      organizationId,
      name: data.name,
      baseModel: data.baseModel || 'gpt-3.5-turbo',
      provider: 'openai',
      trainingFileId,
      status: 'submitted',
    });

    await this.jobRepository.save(job);

    // Submit to OpenAI
    try {
      const fineTuningJob = await this.openai.fineTuning.jobs.create({
        training_file: trainingFileId,
        model: job.baseModel,
        hyperparameters: {
          n_epochs: data.epochs || 3,
        },
      });

      // Update job with provider ID
      job.providerJobId = fineTuningJob.id;
      job.status = 'running';
      await this.jobRepository.save(job);

      // Start monitoring job
      this.monitorFineTuningJob(job.id);

      return job;
    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error.message;
      await this.jobRepository.save(job);
      throw error;
    }
  }

  /**
   * Monitor fine-tuning job progress
   */
  private async monitorFineTuningJob(jobId: string): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job || !job.providerJobId) {
      return;
    }

    // Poll OpenAI for status
    const interval = setInterval(async () => {
      try {
        const openaiJob = await this.openai.fineTuning.jobs.retrieve(
          job.providerJobId,
        );

        job.status = openaiJob.status;

        if (openaiJob.status === 'succeeded') {
          job.fineTunedModelId = openaiJob.fine_tuned_model;
          job.trainingCompletedAt = new Date();
          
          // Create model entry
          await this.createFineTunedModel(job);
          
          clearInterval(interval);
        } else if (openaiJob.status === 'failed') {
          job.errorMessage = openaiJob.error?.message || 'Training failed';
          clearInterval(interval);
        }

        await this.jobRepository.save(job);
      } catch (error) {
        console.error('Error monitoring fine-tuning job:', error);
        clearInterval(interval);
      }
    }, 60000); // Check every minute
  }

  /**
   * Create fine-tuned model entry
   */
  private async createFineTunedModel(
    job: FineTuningJob,
  ): Promise<FineTunedModel> {
    const model = this.modelRepository.create({
      organizationId: job.organizationId,
      fineTuningJobId: job.id,
      name: job.name,
      provider: job.provider,
      providerModelId: job.fineTunedModelId,
      baseModel: job.baseModel,
      status: 'active',
    });

    return await this.modelRepository.save(model);
  }

  /**
   * Use fine-tuned model with LangChain
   */
  async createLangChainModel(
    modelId: string,
  ): Promise<ChatOpenAI> {
    const model = await this.modelRepository.findOne({
      where: { id: modelId, status: 'active' },
    });

    if (!model) {
      throw new Error('Model not found');
    }

    return new ChatOpenAI({
      modelName: model.providerModelId,
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7,
    });
  }
}
```

### Training Examples Management

```typescript
// src/modules/fine-tuning/training-examples.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingExample } from './entities/training-example.entity';

@Injectable()
export class TrainingExamplesService {
  constructor(
    @InjectRepository(TrainingExample)
    private exampleRepository: Repository<TrainingExample>,
  ) {}

  /**
   * Import from conversations
   */
  async importFromConversations(
    organizationId: string,
    agentId: string,
    filters: {
      minRating?: number;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<number> {
    // Get highly-rated conversations
    const conversations = await this.conversationRepository.find({
      where: {
        organizationId,
        agentId,
        // ... apply filters
      },
      relations: ['messages'],
    });

    let importCount = 0;

    for (const conversation of conversations) {
      // Extract Q&A pairs from conversation
      const messages = conversation.messages;
      
      for (let i = 0; i < messages.length - 1; i++) {
        if (
          messages[i].role === 'user' &&
          messages[i + 1].role === 'assistant'
        ) {
          await this.exampleRepository.save({
            organizationId,
            agentId,
            userMessage: messages[i].content,
            assistantMessage: messages[i + 1].content,
            source: 'conversation',
            conversationId: conversation.id,
          });
          importCount++;
        }
      }
    }

    return importCount;
  }

  /**
   * Validate training examples
   */
  async validateExample(
    exampleId: string,
    userId: string,
    qualityScore: number,
  ): Promise<void> {
    await this.exampleRepository.update(exampleId, {
      isValidated: true,
      validatedBy: userId,
      qualityScore,
    });
  }

  /**
   * Export to JSONL format
   */
  async exportToJsonl(
    organizationId: string,
    options: {
      agentId?: string;
      validated?: boolean;
    },
  ): Promise<string> {
    const examples = await this.exampleRepository.find({
      where: {
        organizationId,
        ...(options.agentId && { agentId: options.agentId }),
        ...(options.validated && { isValidated: true }),
      },
    });

    return examples
      .map((example) =>
        JSON.stringify({
          messages: [
            ...(example.systemMessage
              ? [{ role: 'system', content: example.systemMessage }]
              : []),
            { role: 'user', content: example.userMessage },
            { role: 'assistant', content: example.assistantMessage },
          ],
        }),
      )
      .join('\n');
  }
}
```

---

## 6. UI/UX Design

### Fine-Tuning Dashboard

```
┌─────────────────────────────────────────────────────┐
│  🎯 Fine-Tuning                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your Fine-Tuned Models                             │
│  ──────────────────────                            │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Customer Support Model v2                 │     │
│  │ Base: GPT-3.5-turbo | Status: ✅ Active  │     │
│  │ Usage: 24.5K requests this month          │     │
│  │ Cost: $234 | Satisfaction: 4.8/5          │     │
│  │ [Use in Agent] [View Metrics] [Archive]   │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  Active Training Jobs                               │
│  ───────────────────                                │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Sales Bot Enhancement                      │     │
│  │ Status: 🔄 Training (45% complete)        │     │
│  │ Started: 2 hours ago | ETA: 1.5 hours     │     │
│  │ Training Examples: 487                     │     │
│  │ [View Progress] [Cancel]                   │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  [+ Create New Fine-Tuned Model]                    │
└─────────────────────────────────────────────────────┘
```

### Training Data Manager

```
┌─────────────────────────────────────────────────────┐
│  📚 Training Examples                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Import from Conversations] [Upload JSONL] [+ Add]│
│                                                     │
│  Validated Examples: 247 | Pending Review: 53      │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ User: "How do I reset my password?"       │     │
│  │ Assistant: "Click on 'Forgot Password'... │     │
│  │ Quality: ⭐⭐⭐⭐⭐ | Source: Conversation │     │
│  │ [Edit] [Remove] [✓ Validate]              │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  Filters: [All] [Validated] [Pending]              │
│  Sort by: [Quality] [Date] [Source]                │
└─────────────────────────────────────────────────────┘
```

---

## 7. Feature Roadmap

### Phase 1: MVP (Months 4-6)
- [ ] Training examples management UI
- [ ] Import from conversations
- [ ] Manual example upload
- [ ] OpenAI fine-tuning integration
- [ ] Basic job monitoring

### Phase 2: Enhanced (Months 7-9)
- [ ] Automated example curation (high-rated convos)
- [ ] A/B testing between base and fine-tuned models
- [ ] Cost tracking and optimization
- [ ] Quality metrics dashboard
- [ ] Model versioning

### Phase 3: Advanced (Months 10-12)
- [ ] Together.ai integration (open-source models)
- [ ] Custom hyperparameter tuning
- [ ] Continuous learning (auto-retrain)
- [ ] Advanced analytics
- [ ] Model performance comparison

---

## 8. Pricing Strategy

### Free Tier
- ❌ No fine-tuning access

### Professional Tier ($299/mo)
- ✅ 1 fine-tuned model
- ✅ Up to 500 training examples
- ✅ OpenAI GPT-3.5-turbo base

### Business Tier ($799/mo)
- ✅ 3 fine-tuned models
- ✅ Up to 2,000 training examples
- ✅ GPT-4o-mini base
- ✅ A/B testing

### Enterprise Tier (Custom)
- ✅ Unlimited fine-tuned models
- ✅ Unlimited training examples
- ✅ All base models
- ✅ Custom model hosting (Together.ai)
- ✅ On-premise deployment option

---

## 9. Cost Estimation

### OpenAI Fine-Tuning Costs

**GPT-3.5-turbo**:
- Training: $0.008 / 1K tokens
- Usage: $0.012 / 1K tokens (input), $0.016 / 1K tokens (output)

**Example**:
- 500 training examples × 200 tokens avg = 100K tokens
- Training cost: $0.80
- If model handles 50K requests/month at 100 tokens each:
  - Monthly usage cost: $60-80
  - vs Base model: $80-120
  - **Savings: ~30% on usage costs**

---

## 10. Best Practices

### When to Fine-Tune
✅ **Do fine-tune when**:
- You have >500 high-quality examples
- Specific domain/style needed
- High volume (cost savings)
- Consistency is critical

❌ **Don't fine-tune when**:
- <100 examples available
- Low usage volume
- General purpose use case
- RAG + few-shot prompting works well

### Data Quality
- ✅ Curate high-quality examples only
- ✅ Remove duplicates
- ✅ Balance different types of questions
- ✅ Include edge cases
- ✅ Validate examples manually

---

## Summary: Recommended Stack

### For ObjectaLabs MVP (Months 1-6)
**Use**: **RAG + Few-Shot Prompting** (No fine-tuning)
- LangChain FewShotPromptTemplate
- Vector search for examples
- Dynamic example selection

### For Advanced Features (Months 7-12)
**Add**: **OpenAI Fine-Tuning**
- OpenAI Fine-Tuning API
- LangChain ChatOpenAI with custom model ID
- Training data management UI

### For Enterprise (Year 2+)
**Add**: **Together.ai / Custom Hosting**
- Open-source models (Llama 2, Mistral)
- Full control and privacy
- Cost optimization

---

**Would you like me to:**
1. Implement the fine-tuning service code?
2. Create the UI mockups in detail?
3. Add this to the main roadmap?
4. Create cost calculator?
5. Write migration guide from few-shot to fine-tuning?

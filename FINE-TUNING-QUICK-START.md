# 🚀 Fine-Tuning Feature - Quick Start Guide

## Overview
The fine-tuning feature allows you to train custom AI models on your own data, improving performance for specific use cases.

## Prerequisites

✅ Backend running on `http://localhost:3001`  
✅ Frontend running on `http://localhost:3000`  
✅ PostgreSQL database  
✅ OpenAI API key (for actual fine-tuning)

## Setup (5 minutes)

### 1. Run Database Migration

```bash
psql -d objecta-labs -f backend/src/migrations/create-fine-tuning-tables.sql
```

This creates 5 new tables:
- `fine_tuning_datasets`
- `fine_tuning_jobs`
- `fine_tuned_models`
- `training_examples`
- `fine_tuning_events`

### 2. Configure OpenAI API Key

Add to `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

### 3. Restart Backend

```bash
cd backend
npm run start:dev
```

### 4. Verify Installation

Run the test script:
```bash
./test-fine-tuning.sh
```

Or manually check:
- Backend: http://localhost:3001/api/docs (look for "Fine-Tuning" section)
- Frontend: http://localhost:3000/dashboard/fine-tuning

## Usage Guide

### Step 1: Create a Training Dataset

#### Option A: Upload JSONL File

1. Navigate to **Fine-Tuning → Datasets**
2. Click **"Upload Dataset"**
3. Fill in:
   - **Name**: "Customer Support Training Data"
   - **Description**: "Training data for customer support assistant"
   - **Format**: JSONL (recommended)
   - **File**: Select your `.jsonl` file

#### JSONL Format Example:
```jsonl
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "How do I reset my password?"}, {"role": "assistant", "content": "To reset your password, click on 'Forgot Password' on the login page and follow the instructions."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What are your business hours?"}, {"role": "assistant", "content": "We are open Monday through Friday, 9 AM to 5 PM EST."}]}
```

**Requirements**:
- Minimum 10 examples (recommended 50+)
- Each example must have at least one user and one assistant message
- System message is optional but recommended

#### Option B: Import from Conversations

1. Navigate to **Fine-Tuning → Datasets**
2. Click **"Import from Conversations"**
3. Configure filters:
   - **Agent ID**: Filter by specific agent (optional)
   - **Date Range**: Select time period (optional)
   - **Max Examples**: Limit number of examples
4. Click **"Import"**

The system will automatically convert your conversation history into training format.

### Step 2: Validate Dataset

1. Go to your dataset
2. Click **"Validate"**
3. Wait for validation to complete
4. Check for any errors

**Common validation errors**:
- Missing required fields (role, content)
- Invalid role values (must be: system, user, or assistant)
- Too few examples (minimum 10)
- Malformed JSON

### Step 3: Create Fine-Tuning Job

1. Navigate to **Fine-Tuning → Jobs**
2. Click **"Create Training Job"**

#### Step 1: Select Dataset
- Choose a validated dataset
- Review dataset statistics

#### Step 2: Configure Model
- **Job Name**: "Customer Support Model v1"
- **Description**: Describe the purpose
- **Base Model**: Choose from:
  - **GPT-3.5 Turbo** (recommended for cost-effectiveness)
  - **GPT-4** (higher quality, higher cost)
- **Hyperparameters**:
  - **Epochs**: 3 (default) - More epochs = better training
  - **Learning Rate**: 1.0 (default) - Adjust if needed

#### Step 3: Review & Launch
- Review cost estimate
- Check all settings
- Click **"Launch Training Job"**

### Step 4: Monitor Training

1. Go to **Fine-Tuning → Jobs**
2. View job status:
   - **Pending**: Waiting to start
   - **Validating**: Checking dataset
   - **Queued**: In OpenAI's queue
   - **Running**: Training in progress
   - **Succeeded**: Training complete
   - **Failed**: Training failed

**Actions while running**:
- Click **"Sync"** to update status
- Click **"Cancel"** to stop training
- View progress bar and current epoch

**Training typically takes**:
- Small datasets (100 examples): 10-30 minutes
- Medium datasets (1,000 examples): 1-3 hours
- Large datasets (10,000+ examples): 3-8 hours

### Step 5: Deploy Model

Once training succeeds:

1. Go to **Fine-Tuning → Models**
2. Find your new model
3. Click **"Deploy Model"**
4. (Optional) Select specific agents to use this model

Your fine-tuned model is now ready to use!

### Step 6: Use in Agents

1. Navigate to **Agents**
2. Edit an existing agent or create new one
3. In model selection, your fine-tuned model will appear
4. Select it and save

The agent will now use your custom-trained model for conversations.

## Cost Estimation

### OpenAI Pricing (as of 2024)
- **GPT-3.5 Turbo**: $0.008 per 1K tokens
- **GPT-4**: $0.03 per 1K tokens

### Example Calculations

**Small Dataset (100 examples, 3 epochs)**
- 100 examples × 500 tokens = 50K tokens
- Training: 50K × 3 = 150K tokens
- Cost (GPT-3.5): $1.20
- Cost (GPT-4): $4.50

**Medium Dataset (1,000 examples, 3 epochs)**
- 1,000 examples × 500 tokens = 500K tokens
- Training: 500K × 3 = 1.5M tokens
- Cost (GPT-3.5): $12.00
- Cost (GPT-4): $45.00

**Large Dataset (10,000 examples, 3 epochs)**
- 10,000 examples × 500 tokens = 5M tokens
- Training: 5M × 3 = 15M tokens
- Cost (GPT-3.5): $120.00
- Cost (GPT-4): $450.00

**Tips to reduce costs**:
- Start with fewer examples (100-500)
- Use GPT-3.5 instead of GPT-4
- Reduce epochs if results are good
- Test with small subset first

## Best Practices

### Dataset Quality
✅ **High-quality examples** - Real conversations work best  
✅ **Consistent formatting** - Use same system prompt  
✅ **Diverse scenarios** - Cover various use cases  
✅ **Clean data** - Remove PII, errors, irrelevant content  
✅ **Balanced distribution** - Equal representation of topics  

❌ **Avoid**:
- Duplicate examples
- Contradictory instructions
- Very long messages (>4000 tokens)
- Sensitive or private information

### Model Configuration
- **Start small**: Begin with 3 epochs
- **Monitor loss**: Lower training loss = better learning
- **Validate results**: Test model before full deployment
- **Version models**: Keep track of different versions
- **A/B test**: Compare with base model performance

### Production Deployment
- **Test thoroughly** before deploying to production agents
- **Monitor metrics**: Track tokens, latency, costs
- **Archive old models** when no longer needed
- **Set usage limits** to control costs
- **Regular updates**: Retrain with new data periodically

## Troubleshooting

### "Dataset validation failed"
- Check JSONL format (one JSON object per line)
- Ensure all required fields are present
- Verify minimum 10 examples
- Check for malformed JSON

### "Job failed to start"
- Verify OpenAI API key is set and valid
- Check you have sufficient OpenAI credits
- Ensure dataset is validated
- Review backend logs for errors

### "Training failed"
- Check OpenAI dashboard for detailed error
- Dataset may have quality issues
- Insufficient credits in OpenAI account
- Try reducing epochs or dataset size

### "Cost estimate not showing"
- Ensure dataset is selected
- Check backend connectivity
- Verify OpenAI API key is valid
- Refresh the page

### "Model not appearing in agents"
- Ensure training completed successfully
- Check model status is "active"
- Refresh agents page
- Verify model deployment

## API Reference

All endpoints are documented at: http://localhost:3001/api/docs

### Key Endpoints

**Datasets**
- `POST /fine-tuning/datasets` - Upload dataset
- `GET /fine-tuning/datasets` - List datasets
- `POST /fine-tuning/datasets/:id/validate` - Validate format
- `POST /fine-tuning/datasets/import-from-conversations` - Import data

**Jobs**
- `POST /fine-tuning/jobs` - Create training job
- `GET /fine-tuning/jobs` - List jobs
- `POST /fine-tuning/jobs/:id/cancel` - Cancel job
- `POST /fine-tuning/jobs/estimate-cost` - Get cost estimate

**Models**
- `GET /fine-tuning/models` - List models
- `POST /fine-tuning/models/:id/deploy` - Deploy model
- `POST /fine-tuning/models/:id/archive` - Archive model

## Sample Dataset

Use the test script to generate a sample dataset:
```bash
./test-fine-tuning.sh
```

This creates `tmp_rovodev_sample_training_data.jsonl` with 10 examples for testing.

## Advanced Features (Coming Soon)

🔮 **Future Enhancements**:
- Multiple provider support (Anthropic, local models)
- Automatic hyperparameter optimization
- Dataset quality scoring
- A/B testing framework
- Advanced analytics dashboard
- Team collaboration features
- Cost budgets and alerts

## Support

- **Documentation**: See `FINE-TUNING-FEATURE-SUMMARY.md`
- **Implementation Details**: See `FINE-TUNING-IMPLEMENTATION-PLAN.md`
- **API Docs**: http://localhost:3001/api/docs
- **Issues**: Check backend logs for detailed errors

## Next Steps

1. ✅ Run database migration
2. ✅ Configure OpenAI API key
3. ✅ Upload sample dataset
4. ✅ Create test training job
5. ✅ Monitor until completion
6. ✅ Deploy and test model
7. 🚀 Start training your own custom models!

---

**Happy fine-tuning! 🎉**

# 🦙 Ollama Fine-Tuning Guide

## Overview

Ollama support has been added to the fine-tuning system, allowing you to train models locally for **FREE**! No API costs, complete privacy, and full control.

## Benefits of Ollama

✅ **Free** - No API costs, runs on your hardware  
✅ **Privacy** - Data never leaves your machine  
✅ **Offline** - Works without internet  
✅ **Control** - Full control over model and training  
✅ **Fast** - With GPU, training is very fast  

## Prerequisites

### 1. Install Ollama

**macOS/Linux**:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows**:
Download from https://ollama.ai/download

### 2. Verify Installation

```bash
ollama --version
```

### 3. Pull a Base Model

```bash
# Pull Llama 2 (recommended for beginners)
ollama pull llama2

# Or other models
ollama pull mistral
ollama pull codellama
ollama pull phi
```

### 4. Start Ollama Server

```bash
ollama serve
```

Should be running on: `http://localhost:11434`

## Supported Models

| Model | Size | Best For | Memory Required |
|-------|------|----------|-----------------|
| **llama2** | 7B | General purpose, conversations | 8GB RAM |
| **llama2:13b** | 13B | Better quality, more capable | 16GB RAM |
| **mistral** | 7B | Fast, efficient, good quality | 8GB RAM |
| **codellama** | 7B | Code generation, programming | 8GB RAM |
| **phi** | 2.7B | Compact, fast, resource-friendly | 4GB RAM |
| **neural-chat** | 7B | Optimized for conversations | 8GB RAM |

## How It Works

### Training Process

1. **Dataset Conversion**: Your JSONL dataset is converted to Ollama's Modelfile format
2. **Model Creation**: Ollama creates a new model based on your base model + training data
3. **Local Training**: Training happens on your machine (GPU accelerated if available)
4. **Model Storage**: Fine-tuned model is stored locally and ready to use

### Modelfile Format

Ollama uses a "Modelfile" (similar to Dockerfile) to define fine-tuned models:

```dockerfile
FROM llama2

SYSTEM """You are a movie expert assistant."""

PARAMETER temperature 0.7
PARAMETER num_ctx 2048

TEMPLATE """Below are training examples:

### Instruction:
Tell me about The Shawshank Redemption

### Response:
The Shawshank Redemption (1994) is a Drama...
"""
```

## Using Ollama for Fine-Tuning

### Step 1: Create Dataset

Upload your training data in JSONL format:

```jsonl
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there!"}]}
```

### Step 2: Create Training Job

1. Go to **Fine-Tuning → Jobs → Create**
2. Select your validated dataset
3. **Choose Provider**: Select **"Ollama"** (shows "Local (free)")
4. **Select Base Model**: 
   - `llama2` (recommended)
   - `mistral`
   - `codellama`
   - etc.
5. **Configure Hyperparameters**:
   - Epochs: 3 (default)
   - Temperature: 0.7
   - Context window: 2048
6. **Review**: Notice cost is $0.00!
7. **Launch**

### Step 3: Monitor Training

- Training happens locally on your machine
- Progress shown in the UI
- Check terminal/logs for detailed output
- Typical time: 10-30 minutes (depends on hardware)

### Step 4: Use Fine-Tuned Model

Once complete:
1. Model is saved as `ft-{job-id}` in Ollama
2. Deploy to agents via the UI
3. Use in conversations

You can also use it directly with Ollama:
```bash
ollama run ft-ollama-1234567890-abc123def
```

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434

# Optional: Use external Ollama server
# OLLAMA_HOST=http://192.168.1.100:11434
```

### Hardware Recommendations

**Minimum** (CPU only):
- 8GB RAM
- 4 CPU cores
- ~10GB disk space
- Training time: 1-2 hours

**Recommended** (with GPU):
- 16GB RAM
- NVIDIA GPU with 8GB+ VRAM
- 20GB disk space
- Training time: 10-30 minutes

**Optimal** (for large models):
- 32GB+ RAM
- NVIDIA GPU with 16GB+ VRAM (e.g., RTX 3090, 4090, A100)
- 50GB disk space
- Training time: 5-15 minutes

## Comparison: Ollama vs OpenAI

| Feature | Ollama | OpenAI |
|---------|--------|--------|
| **Cost** | Free | $0.008-0.03 per 1K tokens |
| **Speed** | Depends on hardware | Fast (cloud) |
| **Privacy** | 100% private (local) | Data sent to OpenAI |
| **Internet** | Not required | Required |
| **Hardware** | GPU recommended | Not required |
| **Quality** | Good (7B-13B models) | Excellent (GPT-3.5/4) |
| **Setup** | Install Ollama | API key only |

## Example: Training a Movie Expert

### 1. Prepare Data

Use `sample-movies-training.csv`:
```csv
system,user,assistant
"You are a movie expert","Tell me about The Shawshank Redemption","The Shawshank Redemption..."
```

### 2. Create Job

- Provider: **Ollama**
- Base Model: **llama2**
- Epochs: 3
- Cost: **$0.00**

### 3. Training Output

```
Creating model ft-ollama-1234567890-abc123def
Transferring model data...
Processing training examples...
Writing model...
Success!
```

### 4. Test

```bash
ollama run ft-ollama-1234567890-abc123def
>>> Tell me about The Godfather
The Godfather (1972) is a Crime/Drama film directed by Francis Ford Coppola...
```

## Troubleshooting

### Ollama Not Available

**Error**: "Ollama is not available at http://localhost:11434"

**Solution**:
```bash
# Start Ollama
ollama serve

# Or check if it's running
ps aux | grep ollama
```

### Model Not Found

**Error**: "Base model 'llama2' not found"

**Solution**:
```bash
# Pull the model first
ollama pull llama2

# List available models
ollama list
```

### Out of Memory

**Error**: Training fails with OOM

**Solution**:
- Use a smaller model (phi instead of llama2)
- Reduce context window
- Close other applications
- Reduce batch size

### Training Takes Too Long

**Solution**:
- Use GPU if available
- Use smaller model
- Reduce number of examples
- Reduce epochs

### GPU Not Being Used

**Solution**:
```bash
# Check GPU availability
nvidia-smi

# Restart Ollama to detect GPU
killall ollama
ollama serve
```

## Tips for Best Results

### Dataset Quality
- Use 50-500 high-quality examples
- More examples ≠ better (quality > quantity)
- Ensure consistent formatting
- Include diverse scenarios

### Model Selection
- **General tasks**: llama2 or mistral
- **Code**: codellama
- **Conversations**: neural-chat
- **Limited RAM**: phi

### Hyperparameters
- **Epochs**: 3-5 (more can lead to overfitting)
- **Temperature**: 0.7 (lower = more focused)
- **Context**: 2048-4096 tokens

## Advanced Usage

### Using Custom Ollama Server

If Ollama is running on another machine:

```env
# backend/.env
OLLAMA_HOST=http://192.168.1.100:11434
```

### Managing Models

```bash
# List all models
ollama list

# Delete a fine-tuned model
ollama rm ft-ollama-1234567890-abc123def

# Copy a model
ollama cp ft-ollama-1234567890-abc123def my-custom-model

# Export a model
ollama pull ft-ollama-1234567890-abc123def -o ./model.gguf
```

### Using in Code

```python
import requests

response = requests.post('http://localhost:11434/api/generate', json={
    'model': 'ft-ollama-1234567890-abc123def',
    'prompt': 'Tell me about The Godfather'
})

print(response.json()['response'])
```

## Limitations

⚠️ **Current Limitations**:

1. **Training Format**: Uses Modelfile (simplified training)
2. **Hyperparameters**: Limited compared to OpenAI
3. **Progress Tracking**: Less detailed than cloud providers
4. **Model Size**: Limited by local hardware
5. **Quality**: May not match GPT-4 quality

## Future Enhancements

🔮 **Coming Soon**:
- Better progress tracking
- Multiple training formats
- Model comparison tools
- Automatic GPU detection
- Training metrics visualization
- Distributed training support

## Resources

- **Ollama Docs**: https://ollama.ai/docs
- **Model Library**: https://ollama.ai/library
- **GitHub**: https://github.com/ollama/ollama
- **Community**: https://discord.gg/ollama

## Summary

**Ollama fine-tuning is perfect for**:
- ✅ Cost-sensitive projects (it's free!)
- ✅ Privacy-critical applications
- ✅ Offline environments
- ✅ Experimentation and learning
- ✅ Small to medium datasets

**Use OpenAI fine-tuning for**:
- ✅ Production applications
- ✅ Maximum quality needed
- ✅ Large-scale deployments
- ✅ No hardware constraints

---

**Try it now!** Upload a dataset and create your first free fine-tuned model with Ollama! 🚀

# Fine-Tuning Quick Reference

One-page cheat sheet for fine-tuning workflows.

## 🚀 Quick Start (5 Minutes)

```
1. Dashboard → Fine-Tuning → Convert Data
2. Upload CSV/JSON file
3. Choose conversion mode (Guided or Smart)
4. Preview and convert
5. Create fine-tuning job
6. Monitor in Background Jobs
7. Deploy to agent when complete
```

## 📊 Data Format

### JSONL Structure
```jsonl
{"messages": [
  {"role": "system", "content": "You are a helpful assistant."},
  {"role": "user", "content": "Question here"},
  {"role": "assistant", "content": "Answer here"}
]}
```

### CSV for Conversion
```csv
question,answer
"Q1","A1"
"Q2","A2"
```

## 🎯 Conversion Modes

| Mode | Best For | Speed | Quality |
|------|----------|-------|---------|
| **Guided** | Simple Q&A, structured data | ⚡ Fast | Good |
| **Smart** | Complex patterns, creative | 🐌 Slow | Excellent |

## 📈 Recommended Dataset Sizes

- **Minimum**: 10 examples (for testing)
- **Good**: 100-200 examples
- **Better**: 500-1000 examples
- **Best**: 1000+ examples

## 💰 Cost Estimate (OpenAI)

| Dataset Size | Approx Cost | Time |
|--------------|-------------|------|
| 100 examples | ~$0.80 | 10 min |
| 500 examples | ~$4.00 | 30 min |
| 1000 examples | ~$8.00 | 1 hour |

Ollama: **FREE** (local)

## 🔄 Training Status

- ⏳ **Pending** - In queue
- 🔄 **Validating** - Checking data
- 🏃 **Running** - Training (check progress %)
- ✅ **Succeeded** - Ready to deploy!
- ❌ **Failed** - Check errors, retry
- 🚫 **Cancelled** - Manually stopped

## ⚙️ Model Selection

### OpenAI
- `gpt-3.5-turbo` ← **Start here** (fast, cheap)
- `gpt-4` (best quality, expensive)

### Ollama (Local)
- `llama3.2` ← **Recommended**
- `mistral` (good alternative)
- `llama2`, `phi`, `gemma`

## ✅ Validation Checklist

Before starting training:
- [ ] 10+ examples (100+ recommended)
- [ ] Consistent response format
- [ ] System message included
- [ ] No sensitive data
- [ ] Valid JSON/JSONL format
- [ ] Dataset validated successfully

## 🛠️ Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Validation failed | Check JSON format with JSONLint |
| Not enough examples | Use Smart conversion for more |
| Training failed | Retry with validated dataset |
| Poor results | Add more diverse examples |
| Model not in dropdown | Wait for training complete |

## 📱 Where to Find Things

| What | Where |
|------|-------|
| Upload dataset | Fine-Tuning → Upload Dataset |
| Convert data | Fine-Tuning → Convert Data |
| Start training | Fine-Tuning → Start Training |
| Monitor progress | Dashboard → Background Jobs |
| View models | Fine-Tuning → Models |
| Deploy model | Models → [Your Model] → Deploy |

## 🎨 Best Practices

### ✅ DO
- Start with 100-200 examples
- Use real conversation examples
- Keep responses consistent
- Include system message
- Version your models
- Test before deploying

### ❌ DON'T
- Use inconsistent formats
- Include outdated info
- Over-train (3 epochs max)
- Skip validation
- Mix writing styles
- Include sensitive data

## 🔗 Quick Links

- Full Guide: [FINE-TUNING-GUIDE.md](./FINE-TUNING-GUIDE.md)
- API Docs: [API-REFERENCE.md](./API-REFERENCE.md)
- Support: support@example.com

---

**Need more detail?** Check the [Complete Fine-Tuning Guide](./FINE-TUNING-GUIDE.md)

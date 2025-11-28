#!/bin/bash

# Fine-Tuning Feature Testing Script
# This script helps test the fine-tuning feature end-to-end

set -e

echo "🧪 Fine-Tuning Feature Testing Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking if backend is running..."
if curl -s http://localhost:3001/api/docs > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running. Please start it first with 'cd backend && npm run start:dev'${NC}"
    exit 1
fi

# Check if database migration is needed
echo ""
echo "2️⃣  Database Migration"
echo "Run this command to create fine-tuning tables:"
echo -e "${YELLOW}psql -d objecta-labs -f backend/src/migrations/create-fine-tuning-tables.sql${NC}"
echo ""
read -p "Have you run the database migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Please run the migration first${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database migration confirmed${NC}"

# Check environment variables
echo ""
echo "3️⃣  Checking environment variables..."
if [ -f backend/.env ]; then
    if grep -q "OPENAI_API_KEY" backend/.env; then
        echo -e "${GREEN}✓ OPENAI_API_KEY found in .env${NC}"
    else
        echo -e "${YELLOW}⚠ OPENAI_API_KEY not found. OpenAI fine-tuning will not work.${NC}"
        echo "Add it to backend/.env: OPENAI_API_KEY=sk-..."
    fi
else
    echo -e "${RED}✗ backend/.env file not found${NC}"
    exit 1
fi

# Test API endpoints
echo ""
echo "4️⃣  Testing API endpoints..."

# You'll need to get a JWT token first
echo "Get your JWT token by logging in, then set it here:"
read -p "Enter JWT token (or press Enter to skip API tests): " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Skipping API tests${NC}"
else
    echo ""
    echo "Testing datasets endpoint..."
    if curl -s -H "Authorization: Bearer $JWT_TOKEN" http://localhost:3001/fine-tuning/datasets > /dev/null; then
        echo -e "${GREEN}✓ GET /fine-tuning/datasets - Success${NC}"
    else
        echo -e "${RED}✗ GET /fine-tuning/datasets - Failed${NC}"
    fi
    
    echo "Testing jobs endpoint..."
    if curl -s -H "Authorization: Bearer $JWT_TOKEN" http://localhost:3001/fine-tuning/jobs > /dev/null; then
        echo -e "${GREEN}✓ GET /fine-tuning/jobs - Success${NC}"
    else
        echo -e "${RED}✗ GET /fine-tuning/jobs - Failed${NC}"
    fi
    
    echo "Testing models endpoint..."
    if curl -s -H "Authorization: Bearer $JWT_TOKEN" http://localhost:3001/fine-tuning/models > /dev/null; then
        echo -e "${GREEN}✓ GET /fine-tuning/models - Success${NC}"
    else
        echo -e "${RED}✗ GET /fine-tuning/models - Failed${NC}"
    fi
fi

# Frontend check
echo ""
echo "5️⃣  Checking frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
    echo "Visit: http://localhost:3000/dashboard/fine-tuning"
else
    echo -e "${YELLOW}⚠ Frontend is not running. Start it with 'cd frontend && npm run dev'${NC}"
fi

# Sample dataset creation
echo ""
echo "6️⃣  Creating sample training dataset..."
cat > tmp_rovodev_sample_training_data.jsonl << 'EOF'
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is machine learning?"}, {"role": "assistant", "content": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Explain neural networks."}, {"role": "assistant", "content": "Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) that process information using a connectionist approach."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is deep learning?"}, {"role": "assistant", "content": "Deep learning is a subset of machine learning that uses neural networks with multiple layers (deep neural networks) to progressively extract higher-level features from raw input."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Define supervised learning."}, {"role": "assistant", "content": "Supervised learning is a machine learning approach where models are trained on labeled data, learning to map inputs to known outputs."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is unsupervised learning?"}, {"role": "assistant", "content": "Unsupervised learning is a type of machine learning where models identify patterns in data without labeled outputs, often used for clustering and dimensionality reduction."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Explain reinforcement learning."}, {"role": "assistant", "content": "Reinforcement learning is a machine learning paradigm where an agent learns to make decisions by performing actions and receiving rewards or penalties."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is overfitting?"}, {"role": "assistant", "content": "Overfitting occurs when a model learns the training data too well, including its noise, resulting in poor performance on new, unseen data."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Define gradient descent."}, {"role": "assistant", "content": "Gradient descent is an optimization algorithm used to minimize the loss function by iteratively adjusting model parameters in the direction of steepest descent."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is a convolutional neural network?"}, {"role": "assistant", "content": "A convolutional neural network (CNN) is a deep learning architecture designed for processing grid-like data, particularly effective for image recognition and computer vision tasks."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Explain transfer learning."}, {"role": "assistant", "content": "Transfer learning is a technique where a model trained on one task is reused as a starting point for a different but related task, reducing training time and data requirements."}]}
EOF

echo -e "${GREEN}✓ Created sample dataset: tmp_rovodev_sample_training_data.jsonl${NC}"
echo "This file has 10 training examples for testing."
echo ""

# Summary
echo ""
echo "🎉 Testing Setup Complete!"
echo "========================="
echo ""
echo "Next steps:"
echo "1. Navigate to http://localhost:3000/dashboard/fine-tuning"
echo "2. Upload the sample dataset: tmp_rovodev_sample_training_data.jsonl"
echo "3. Validate the dataset"
echo "4. Create a fine-tuning job"
echo "5. Monitor progress on the jobs page"
echo ""
echo "Note: Real fine-tuning with OpenAI requires:"
echo "  - Valid OPENAI_API_KEY"
echo "  - At least 10 training examples (sample has 10)"
echo "  - Actual costs will be charged to your OpenAI account"
echo ""
echo "For testing without costs, you can:"
echo "  - Upload and validate datasets (free)"
echo "  - Test the UI and workflows (free)"
echo "  - Stop before launching actual jobs (free)"
echo ""
echo -e "${YELLOW}Remember to delete tmp_rovodev_sample_training_data.jsonl when done!${NC}"

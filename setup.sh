#!/bin/bash

echo "🚀 Setting up AgentForge..."

# Backend setup
echo ""
echo "📦 Setting up Backend..."
cd backend
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
else
  echo "Backend dependencies already installed"
fi

# Copy env file if not exists
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update backend/.env with your configuration"
fi

cd ..

# Frontend setup
echo ""
echo "🎨 Setting up Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
else
  echo "Frontend dependencies already installed"
fi

# Copy env file if not exists
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update frontend/.env with your configuration"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database (see README.md)"
echo "2. Update backend/.env with your database and API keys"
echo "3. Update frontend/.env with your API URL"
echo "4. Run 'npm run start:dev' in backend/ to start the API"
echo "5. Run 'npm run dev' in frontend/ to start the UI"
echo ""
echo "📚 Documentation: http://localhost:3001/api/docs (once backend is running)"
echo "🎨 Frontend: http://localhost:3000"
echo ""

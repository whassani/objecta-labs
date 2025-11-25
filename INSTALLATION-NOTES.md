# Installation Notes for Advanced Execution Features

## Backend Dependencies Required

The WebSocket functionality requires Socket.IO to be installed in the backend:

```bash
cd backend
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

## Package Versions

Add these to `backend/package.json`:

```json
{
  "dependencies": {
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "socket.io": "^4.6.0"
  }
}
```

## Frontend Configuration

Make sure these environment variables are set in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Backend Configuration

Add to `backend/.env`:

```env
FRONTEND_URL=http://localhost:3000
```

## Main Application Setup

Update `backend/src/main.ts` to enable WebSocket CORS:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for HTTP
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // WebSocket CORS is configured in the gateway decorator
  
  await app.listen(3001);
}
```

## Testing Without Backend

The features work in **simulation mode** without backend:
- Breakpoints work locally
- Step-by-step works locally
- Variable inspection works locally
- History works locally

Only the **backend mode** requires the WebSocket server.

## Quick Start

1. **Install dependencies**:
```bash
cd backend && npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

2. **Start backend**:
```bash
cd backend && npm run start:dev
```

3. **Start frontend**:
```bash
cd frontend && npm run dev
```

4. **Test features**:
   - Open workflow editor
   - Use the execution visualizer controls
   - Toggle breakpoints, step mode, etc.

## Verification

All features should work immediately in simulation mode. To test backend mode:

1. Set execution mode to 'backend' in the workflow editor
2. Start an execution
3. Check browser console for WebSocket connection
4. Verify real-time updates in the visualizer

## Notes

- Frontend features work independently without backend
- Backend integration is optional but provides real-time updates
- WebSocket connection gracefully falls back if unavailable
- All state is managed on the frontend for immediate responsiveness

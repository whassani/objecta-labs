# Admin Separate Login System - Implementation Plan 🔐

## Overview

Create a **completely separate admin login system** with:
- ✅ Separate login page for admins
- ✅ Different port (e.g., 3002 for admin frontend)
- ✅ Separate authentication from regular users
- ✅ Admin-only JWT tokens
- ✅ Better security isolation

---

## 🎯 Architecture

### Current Setup
```
Frontend (Port 3000)
├── /login → Regular user login
├── /dashboard → User dashboard
└── /admin → Admin panel (requires isAdmin flag)

Backend (Port 3001)
└── /api/v1/auth/login → Single login endpoint
```

### Proposed Setup (Option A - Recommended)
```
User Frontend (Port 3000)
├── /login → Regular user login
└── /dashboard → User dashboard

Admin Frontend (Port 3002) ← NEW
├── /admin/login → Admin-only login
└── /admin/dashboard → Admin panel

Backend (Port 3001)
├── /api/v1/auth/login → User login
└── /api/v1/admin/login → Admin login ← NEW
```

### Proposed Setup (Option B - Single Frontend)
```
Frontend (Port 3000)
├── /login → Regular user login
├── /admin/login → Admin login ← NEW (different page)
├── /dashboard → User dashboard
└── /admin/dashboard → Admin panel

Backend (Port 3001)
├── /api/v1/auth/login → User login
└── /api/v1/admin/login → Admin login ← NEW
```

---

## 🔧 Implementation Steps

### Option A: Separate Admin Frontend (Recommended for Production)

#### Benefits
- ✅ Complete isolation (different domain/port)
- ✅ Can deploy admin frontend separately
- ✅ Better security (admin portal can be behind VPN)
- ✅ Separate build/deploy pipeline

#### Drawbacks
- ❌ More infrastructure to manage
- ❌ Need to maintain two frontends

---

### Option B: Same Frontend, Different Route (Easier for Development)

#### Benefits
- ✅ Single frontend to maintain
- ✅ Shared components and utilities
- ✅ Easier development and deployment

#### Drawbacks
- ❌ Less security isolation
- ❌ Both login pages accessible from same domain

---

## 📋 Detailed Implementation

### Backend Changes

#### 1. Create Admin Login Endpoint

**File:** `backend/src/modules/admin/admin-auth.controller.ts` (NEW)

```typescript
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-auth.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('v1/admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @Public()
  async login(@Body() loginDto: AdminLoginDto) {
    const admin = await this.adminAuthService.validateAdmin(
      loginDto.email,
      loginDto.password
    );

    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return this.adminAuthService.login(admin);
  }

  @Post('logout')
  async logout(@Body() body: { token: string }) {
    // Implement token blacklist if needed
    return { message: 'Logged out successfully' };
  }
}
```

#### 2. Create Admin Auth Service

**File:** `backend/src/modules/admin/admin-auth.service.ts` (NEW)

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    // Only allow users with isAdmin = true
    const user = await this.userRepository.findOne({
      where: { email, isAdmin: true },
    });

    if (!user) {
      throw new UnauthorizedException('Admin not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Admin account is disabled');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(admin: any) {
    const payload = {
      email: admin.email,
      sub: admin.id,
      isAdmin: true,
      adminRole: admin.adminRole,
      type: 'admin', // Distinguish from regular user tokens
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: '8h', // Shorter expiry for admin tokens
      }),
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        adminRole: admin.adminRole,
      },
    };
  }
}
```

#### 3. Update Admin Guard

**File:** `backend/src/modules/admin/guards/admin.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if token has admin type
    if (user?.type !== 'admin') {
      return false;
    }

    // Check if user has isAdmin flag
    if (!user?.isAdmin) {
      return false;
    }

    return true;
  }
}
```

---

### Frontend Changes (Option B - Same Frontend)

#### 1. Create Admin Login Page

**File:** `frontend/src/app/(auth)/admin/login/page.tsx` (NEW)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store admin token and user data
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      
      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-purple-500/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Admin Portal</CardTitle>
          <CardDescription className="text-base">
            Secure access for administrators only
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Login
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <a href="/login" className="hover:text-blue-600 transition-colors">
              ← Back to User Login
            </a>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <strong>Security Notice:</strong> This is a restricted area. All login attempts are logged and monitored.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2. Update Admin Layout Middleware

**File:** `frontend/src/app/(admin)/admin/layout.tsx`

Update to check for admin_token instead of regular token:

```typescript
useEffect(() => {
  // Check if user is admin
  const adminToken = localStorage.getItem('admin_token');
  const adminUser = localStorage.getItem('admin_user');
  
  if (!adminToken || !adminUser) {
    router.push('/admin/login');
    return;
  }
  
  const userData = JSON.parse(adminUser);
  setAdminUser(userData);
}, [router]);
```

---

## 🔐 Security Enhancements

### 1. Token Differences

**Regular User Token:**
```json
{
  "email": "user@example.com",
  "sub": "user-id",
  "type": "user"
}
```

**Admin Token:**
```json
{
  "email": "admin@example.com",
  "sub": "admin-id",
  "isAdmin": true,
  "adminRole": "super_admin",
  "type": "admin"
}
```

### 2. Separate Token Storage

```typescript
// Regular user
localStorage.setItem('token', userToken);
localStorage.setItem('user', userData);

// Admin
localStorage.setItem('admin_token', adminToken);
localStorage.setItem('admin_user', adminData);
```

### 3. Enhanced Admin Guard

Check for both `isAdmin` flag AND `type: 'admin'` in token.

---

## 🚀 Deployment Considerations

### Option A: Separate Ports (Recommended)

```yaml
# docker-compose.yml
services:
  frontend:
    ports:
      - "3000:3000"  # User frontend
  
  admin-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.admin
    ports:
      - "3002:3000"  # Admin frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
      - NEXT_PUBLIC_IS_ADMIN=true
  
  backend:
    ports:
      - "3001:3001"
```

### Option B: Different Subdomains

```
app.yoursite.com → User frontend
admin.yoursite.com → Admin frontend
api.yoursite.com → Backend
```

---

## 📋 Implementation Checklist

### Backend
- [ ] Create `AdminAuthController`
- [ ] Create `AdminAuthService`
- [ ] Add `/api/v1/admin/login` endpoint
- [ ] Update `AdminGuard` to check token type
- [ ] Add admin token validation
- [ ] Test admin login endpoint

### Frontend (Option B)
- [ ] Create `/admin/login` page
- [ ] Update admin layout to check `admin_token`
- [ ] Separate token storage (admin_token vs token)
- [ ] Add logout functionality for admin
- [ ] Update API calls to use admin_token
- [ ] Add "Login as Admin" link on regular login

### Testing
- [ ] Test admin login
- [ ] Test regular user cannot access admin endpoints
- [ ] Test admin token expiry
- [ ] Test logout functionality
- [ ] Test concurrent user and admin sessions

---

## 🎯 Which Option Should You Choose?

### Choose Option A (Separate Frontend) if:
- ✅ You need maximum security
- ✅ Admin portal will be behind VPN
- ✅ You want separate deployments
- ✅ You have infrastructure for multiple frontends

### Choose Option B (Same Frontend) if:
- ✅ You want easier development
- ✅ You want to share components
- ✅ You have simpler infrastructure
- ✅ You're building for smaller teams

---

## 💡 Recommendation

**Start with Option B** (same frontend, separate route) for faster development, then migrate to Option A if you need the additional security isolation.

---

**Ready to implement? Let me know which option you prefer!**

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    console.log('🔒 JwtAuthGuard handleRequest called');
    console.log('Error:', err);
    console.log('User:', user);
    console.log('Info:', info);
    
    if (err || !user) {
      console.error('❌ JWT Guard failed:', info?.message || err?.message);
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    
    console.log('✅ JWT Guard passed for user:', user.email);
    return user;
  }
}

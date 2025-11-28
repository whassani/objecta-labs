import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if token has admin type (for admin portal logins)
    // OR check if user has isAdmin flag (for regular users with admin access)
    const isAdminToken = user?.type === 'admin';
    const hasAdminFlag = user?.isAdmin === true;

    if (!isAdminToken && !hasAdminFlag) {
      throw new UnauthorizedException('Admin access required');
    }

    // Check admin role if specific role is required
    const requiredRole = this.reflector.get<string>('adminRole', context.getHandler());
    
    if (requiredRole) {
      if (user.adminRole !== requiredRole && user.adminRole !== 'super_admin') {
        throw new UnauthorizedException(`Admin role ${requiredRole} required`);
      }
    }

    return true;
  }
}

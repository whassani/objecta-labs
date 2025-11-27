import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      userId: payload.userId || payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role, // Legacy field
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      isAdmin: payload.isAdmin || false,
      adminRole: payload.adminRole || null,
      type: payload.type || 'user', // 'admin' or 'user'
    };
  }
}

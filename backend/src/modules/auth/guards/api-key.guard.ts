import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../services/api-key.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard to authenticate requests using API keys
 * Looks for API key in Authorization header: Bearer sk_live_...
 * Or in X-API-Key header
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Extract API key from headers
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Validate API key
    const keyRecord = await this.apiKeyService.validate(apiKey);

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Attach user info to request (same format as JWT)
    request.user = {
      id: keyRecord.userId,
      organizationId: keyRecord.organizationId,
      permissions: keyRecord.scopes || [],
      apiKey: true, // Flag to indicate API key auth
    };

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Check Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer sk_')) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader && apiKeyHeader.startsWith('sk_')) {
      return apiKeyHeader;
    }

    return null;
  }
}

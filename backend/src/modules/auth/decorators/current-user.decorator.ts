import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to get the current authenticated user
 * 
 * @example
 * @Get('me')
 * async getProfile(@CurrentUser() user: UserPayload) { }
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

/**
 * User payload interface attached to request
 */
export interface UserPayload {
  id: string;
  email: string;
  organizationId: string;
  workspaceId?: string;
  roles: string[];
  permissions: string[];
}

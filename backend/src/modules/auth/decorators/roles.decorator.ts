import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * 
 * @example
 * @Roles('admin', 'owner')
 * @Get()
 * async findAll() { }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

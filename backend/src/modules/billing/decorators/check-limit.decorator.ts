import { SetMetadata } from '@nestjs/common';

export const CHECK_LIMIT_KEY = 'check_limit';

/**
 * Decorator to check plan limits before executing a route handler
 * 
 * @param limitType - The limit type from PlanLimits (e.g., 'maxAgents', 'maxWorkflows')
 * 
 * @example
 * @CheckLimit('maxAgents')
 * @Post('agents')
 * async createAgent() { ... }
 */
export const CheckLimit = (limitType: string) => SetMetadata(CHECK_LIMIT_KEY, limitType);

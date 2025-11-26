import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const rateLimitConfig: ThrottlerModuleOptions = {
  ttl: 60, // Time window in seconds
  limit: 100, // Max requests per ttl
};

// Custom limits for specific endpoints
export const customRateLimits = {
  auth: {
    ttl: 60,
    limit: 5, // 5 login attempts per minute
  },
  api: {
    ttl: 60,
    limit: 100, // 100 API calls per minute
  },
  upload: {
    ttl: 60,
    limit: 10, // 10 uploads per minute
  },
  aiGeneration: {
    ttl: 60,
    limit: 20, // 20 AI generations per minute
  },
};

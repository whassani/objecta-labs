import { ConfigService } from '@nestjs/config';

export const getSecurityConfig = (configService: ConfigService) => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    cors: {
      origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    },
    helmet: {
      contentSecurityPolicy: isProduction ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      } : false,
      hsts: isProduction ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      } : false,
    },
  };
};

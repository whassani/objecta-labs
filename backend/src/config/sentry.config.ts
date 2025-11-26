import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';

export function initializeSentry(configService: ConfigService) {
  const dsn = configService.get<string>('SENTRY_DSN');
  const environment = configService.get<string>('NODE_ENV', 'development');

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers['x-api-key'];
        }
      }
      return event;
    },
  });

  console.log(`Sentry initialized for ${environment}`);
}

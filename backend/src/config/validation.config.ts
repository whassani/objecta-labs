import { ValidationPipeOptions } from '@nestjs/common';

export const validationConfig: ValidationPipeOptions = {
  whitelist: true, // Strip properties that don't have decorators
  forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
  transform: true, // Auto-transform payloads to DTO instances
  transformOptions: {
    enableImplicitConversion: true,
  },
  disableErrorMessages: process.env.NODE_ENV === 'production', // Hide validation details in prod
};

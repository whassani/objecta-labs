import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor to log API performance metrics
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        
        // Log slow requests (>500ms)
        if (duration > 500) {
          this.logger.warn(`SLOW: ${method} ${url} - ${duration}ms`);
        } else if (duration > 200) {
          this.logger.log(`${method} ${url} - ${duration}ms`);
        } else {
          this.logger.debug(`${method} ${url} - ${duration}ms`);
        }
      }),
    );
  }
}

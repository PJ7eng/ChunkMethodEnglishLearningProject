import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AuthenticatedUser } from './auth/auth.types';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();
    return next.handle().pipe(
      tap({
        finalize: () => {
          this.logger.log(
            JSON.stringify({
              requestId: request.headers['x-request-id'],
              method: request.method,
              path: request.originalUrl,
              status: response.statusCode,
              durationMs: Date.now() - startedAt,
              userId: request.user?.sub,
            }),
          );
        },
      }),
    );
  }
}

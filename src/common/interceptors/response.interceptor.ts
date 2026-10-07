import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Leaves already-paginated payloads ({ data, meta }) untouched so list
 * endpoints keep their required shape, and passes everything else through.
 * (Kept intentionally thin — error shaping lives in HttpExceptionFilter.)
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => data));
  }
}

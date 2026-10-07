import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const copy: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (['password', 'passwordHash', 'refreshToken', 'token'].includes(k)) {
      copy[k] = '[REDACTED]';
    } else {
      copy[k] = v;
    }
  }
  return copy;
}

function resolveActionAndEntity(method: string, path: string, body: any): { action: string; entityType: string } {
  const normPath = path.replace(/^\/api/, '');
  
  if (normPath.startsWith('/users')) {
    if (normPath.includes('/bulk')) return { action: 'USER_BULK', entityType: 'User' };
    if (method === 'POST') return { action: 'USER_CREATE', entityType: 'User' };
    if (method === 'PATCH') return { action: 'USER_UPDATE', entityType: 'User' };
    if (method === 'DELETE') return { action: 'USER_DELETE', entityType: 'User' };
  }

  if (normPath.startsWith('/admin-users')) {
    if (normPath.includes('/bulk')) return { action: 'ADMIN_BULK', entityType: 'AdminUser' };
    if (method === 'POST') return { action: 'ADMIN_CREATE', entityType: 'AdminUser' };
    if (method === 'PATCH') return { action: 'ADMIN_UPDATE', entityType: 'AdminUser' };
    if (method === 'DELETE') return { action: 'ADMIN_DELETE', entityType: 'AdminUser' };
  }

  if (normPath.startsWith('/bookings')) {
    if (method === 'POST') return { action: 'BOOKING_CREATE', entityType: 'Booking' };
    if (method === 'PATCH') {
      if (body?.status === 'CANCELLED') return { action: 'BOOKING_CANCEL', entityType: 'Booking' };
      if (body?.scheduledAt) return { action: 'BOOKING_RESCHEDULE', entityType: 'Booking' };
      return { action: 'BOOKING_UPDATE', entityType: 'Booking' };
    }
  }

  if (normPath.startsWith('/transactions')) {
    if (method === 'POST') return { action: 'TRANSACTION_CREATE', entityType: 'Transaction' };
    if (normPath.includes('/status')) return { action: 'TRANSACTION_STATUS_UPDATE', entityType: 'Transaction' };
    if (method === 'PATCH') return { action: 'TRANSACTION_UPDATE', entityType: 'Transaction' };
  }

  if (normPath.startsWith('/dashboard/alerts/read')) {
    return { action: 'ALERTS_MARK_READ', entityType: 'Alert' };
  }

  return {
    action: `${method}_${normPath.split('/')[1]?.toUpperCase() || 'RESOURCE'}`,
    entityType: normPath.split('/')[1] || 'System',
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method?.toUpperCase();

    // Only log mutating operations
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip auth login/logout from generic interceptor (handled directly in AuthService)
    const originalUrl = req.originalUrl || req.url || '';
    if (originalUrl.includes('/auth/login') || originalUrl.includes('/auth/refresh') || originalUrl.includes('/auth/logout')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseData) => {
        const adminUserId = req.user?.id;
        if (!adminUserId) return; // not authenticated or no admin user context

        const { action, entityType } = resolveActionAndEntity(method, originalUrl, req.body);
        const entityId = req.params?.id || responseData?.id || (req.body?.ids ? req.body.ids.join(', ') : null);

        let description = `${action} on ${entityType}`;
        if (responseData?.displayId) {
          description = `${action} (${responseData.displayId})`;
        } else if (entityId) {
          description = `${action} (${entityId})`;
        }

        const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.connection?.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;

        this.auditService.log({
          adminUserId,
          action,
          entityType,
          entityId: typeof entityId === 'string' ? entityId : null,
          description,
          details: sanitize(req.body),
          ipAddress: typeof ip === 'string' ? ip.split(',')[0].trim() : null,
          userAgent: typeof userAgent === 'string' ? userAgent : null,
        });
      }),
    );
  }
}

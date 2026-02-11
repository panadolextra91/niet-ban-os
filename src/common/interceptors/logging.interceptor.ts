import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url } = req;
        const startTime = Date.now();

        // Sanitize Body
        const sanitizedBody = this.maskSensitiveData(req.body);

        return next.handle().pipe(
            tap((data) => {
                const duration = Date.now() - startTime;
                const statusCode = context.switchToHttp().getResponse().statusCode;

                // Sanitize Response (if needed, usually safe but good practice)
                const sanitizedResponse = this.maskSensitiveData(data);

                this.logger.log({
                    method,
                    url,
                    statusCode,
                    duration: `${duration}ms`,
                    body: sanitizedBody,
                    response: sanitizedResponse, // Optional: might be too verbose
                });
            }),
        );
    }

    private maskSensitiveData(data: any): any {
        if (!data) return data;
        if (typeof data !== 'object') return data;

        const masked = Array.isArray(data) ? [...data] : { ...data };
        const sensitiveKeys = ['password', 'token', 'access_token', 'refresh_token', 'secret', 'authorization', 'cookie'];

        for (const key in masked) {
            if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                masked[key] = '***MASKED***';
            } else if (typeof masked[key] === 'object') {
                masked[key] = this.maskSensitiveData(masked[key]);
            }
        }
        return masked;
    }
}

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof SyntaxError) {
      response.status(HttpStatus.BAD_REQUEST).json({ error: 'Некоректний JSON' });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (exception instanceof NotFoundException) {
        response.status(status).json({ error: 'Маршрут не знайдено' });
        return;
      }
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        response.status(status).json({ error: 'Забагато запитів. Спробуйте пізніше.' });
        return;
      }

      const raw = exception.getResponse();
      let message = exception.message;
      if (typeof raw === 'string') {
        message = raw;
      } else if (typeof raw === 'object' && raw && 'message' in raw) {
        const value = (raw as { message?: string | string[] }).message;
        message = Array.isArray(value) ? value[0] || message : value || message;
      }
      response.status(status).json({ error: message });
      return;
    }

    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Внутрішня помилка сервера' });
  }
}

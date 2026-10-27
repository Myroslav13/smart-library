import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AppError } from './app-error';
import { throwError, type Observable } from 'rxjs';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
    if (exception instanceof RpcException) return throwError(() => exception);
    if (exception instanceof AppError) {
      return throwError(() => new RpcException({ status: exception.getStatus(), message: exception.message }));
    }
    return throwError(() => new RpcException({ status: 502, message: 'Мікросервіс не зміг обробити запит' }));
  }
}

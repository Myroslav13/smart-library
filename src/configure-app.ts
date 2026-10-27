import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import type { Express } from 'express';
import { AppError } from './common/app-error';
import { AppExceptionFilter } from './common/app-exception.filter';

function firstValidationMessage(errors: ValidationError[]): string {
  for (const error of errors) {
    if (error.constraints) {
      const message = Object.values(error.constraints)[0];
      if (message) return message;
    }
    if (error.children?.length) {
      const nested = firstValidationMessage(error.children);
      if (nested) return nested;
    }
  }
  return 'Некоректні дані';
}

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.disable('x-powered-by');
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => new AppError(firstValidationMessage(errors)),
    }),
  );
}

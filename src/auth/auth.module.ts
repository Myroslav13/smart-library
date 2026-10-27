import { Module } from '@nestjs/common';
import { AuthInternalController } from './auth-internal.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController, AuthInternalController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

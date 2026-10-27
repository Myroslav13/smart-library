import { Module } from '@nestjs/common';
import { AuthInternalController } from './auth-internal.controller';
import { AuthService } from './auth.service';
import { AuthRpcController } from './auth-rpc.controller';

@Module({
  controllers: [AuthInternalController, AuthRpcController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RpcExceptionFilter } from '../common/rpc-exception.filter';

interface RpcRequest {
  operation: string;
  body?: Record<string, unknown>;
  user?: { id: string; role: string; name: string; email: string };
  params?: Record<string, string>;
}

@Controller()
@UseFilters(RpcExceptionFilter)
export class AuthRpcController {
  constructor(private readonly auth: AuthService) {}

  @MessagePattern('auth.request')
  request(@Payload() request: RpcRequest) {
    const body = request.body || {};
    const user = request.user;
    switch (request.operation) {
      case 'register': return this.auth.register(body);
      case 'login': return this.auth.login(body);
      case 'logout': this.auth.logout(String(body.token || '')); return undefined;
      case 'profile': return this.auth.getProfile(user!.id);
      case 'updateProfile': return this.auth.updateProfile(user!.id, body);
      case 'users': return this.auth.listUsers();
      case 'setRole': return this.auth.setRole(user!.id, request.params!.id, String(body.role || ''));
      default: throw new Error(`Unknown auth operation: ${request.operation}`);
    }
  }
}

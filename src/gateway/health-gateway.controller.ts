import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.decorators';

@Controller('health')
export class HealthGatewayController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', service: 'smart-library', entry: 'api-gateway' };
  }
}

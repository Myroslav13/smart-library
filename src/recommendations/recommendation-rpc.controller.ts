import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecommendationService } from './recommendation.service';
import { RpcExceptionFilter } from '../common/rpc-exception.filter';

interface RpcRequest {
  operation: string;
  body?: Record<string, unknown>;
  user?: { id: string };
}

@Controller()
@UseFilters(RpcExceptionFilter)
export class RecommendationRpcController {
  constructor(private readonly recommendations: RecommendationService) {}

  @MessagePattern('recommendations.request')
  request(@Payload() request: RpcRequest) {
    const body = request.body || {};
    switch (request.operation) {
      case 'list': return this.recommendations.getPersonalRecommendations(request.user!.id);
      case 'strategy': return this.recommendations.getStrategy();
      case 'setStrategy': return this.recommendations.setStrategy(String(body.strategy || ''));
      default: throw new Error(`Unknown recommendations operation: ${request.operation}`);
    }
  }
}

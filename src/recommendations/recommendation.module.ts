import { Module } from '@nestjs/common';
import { RecommendationInternalController } from './recommendation-internal.controller';
import { RecommendationService } from './recommendation.service';
import { RecommendationRpcController } from './recommendation-rpc.controller';

@Module({
  controllers: [RecommendationInternalController, RecommendationRpcController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}

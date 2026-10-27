import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationInternalController } from './recommendation-internal.controller';
import { RecommendationService } from './recommendation.service';

@Module({
  controllers: [RecommendationController, RecommendationInternalController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}

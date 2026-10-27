import { Body, Controller, Post } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('internal/recommendations')
export class RecommendationInternalController {
  constructor(private readonly recommendations: RecommendationService) {}

  @Post('views')
  view(@Body() body: { userId: string; bookId: string }) {
    this.recommendations.recordView(body.userId, body.bookId);
    return { ok: true };
  }

  @Post('purchases')
  purchase(@Body() body: { userId: string; items: Array<{ bookId: string; quantity: number }> }) {
    this.recommendations.recordPurchase(body);
    return { ok: true };
  }
}

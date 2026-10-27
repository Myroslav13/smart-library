import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { Role } from '../common/roles';
import type { PublicUser } from '../domain/types';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { STRATEGY_NAMES } from './recommendation.strategies';
import { RecommendationService } from './recommendation.service';

class SetStrategyDto {
  @IsString()
  @IsIn(STRATEGY_NAMES, { message: `Невідома стратегія. Доступні: ${STRATEGY_NAMES.join(', ')}` })
  strategy!: string;
}

@Controller()
export class RecommendationController {
  constructor(private readonly recommendations: RecommendationService) {}

  @Roles(Role.CLIENT, Role.ADMIN)
  @Get('recommendations')
  list(@CurrentUser() user: PublicUser) {
    return this.recommendations.getPersonalRecommendations(user.id);
  }

  @Roles(Role.ADMIN)
  @Get('admin/recommendation-strategy')
  strategy() {
    return this.recommendations.getStrategy();
  }

  @Roles(Role.ADMIN)
  @Patch('admin/recommendation-strategy')
  setStrategy(@Body() body: SetStrategyDto) {
    return this.recommendations.setStrategy(body.strategy);
  }
}

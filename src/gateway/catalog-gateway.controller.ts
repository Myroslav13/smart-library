import { Body, Controller, Get, Param, Patch, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CurrentUser, OptionalUser, Public, Roles } from '../auth/auth.decorators';
import { Role } from '../common/roles';
import type { BookSearchFilters, PublicUser } from '../domain/types';
import { AddBookDto, ModerateReviewDto, ReviewDto, UpdateBookDto } from '../catalog/dto';
import { GatewayService } from './gateway.service';

@Controller()
export class CatalogGatewayController {
  constructor(private readonly gateway: GatewayService) {}

  @Public()
  @Get('books')
  search(@Query() query: BookSearchFilters) {
    return this.gateway.send('catalog', 'search', { query });
  }

  @Public()
  @Get('books/:id')
  details(@Param('id') id: string, @Query('pending') pending: string | undefined, @OptionalUser() user?: PublicUser) {
    return this.gateway.send('catalog', 'details', { params: { id }, query: { pending }, user });
  }

  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @Post('books')
  @HttpCode(HttpStatus.CREATED)
  add(@Body() body: AddBookDto) {
    return this.gateway.send('catalog', 'add', { body });
  }

  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @Patch('books/:id')
  update(@Param('id') id: string, @Body() body: UpdateBookDto) {
    return this.gateway.send('catalog', 'update', { params: { id }, body });
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Get('books/:id/stock')
  stock(@Param('id') id: string) {
    return this.gateway.send('catalog', 'stock', { params: { id } });
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('books/:id/reviews')
  @HttpCode(HttpStatus.CREATED)
  review(@CurrentUser() user: PublicUser, @Param('id') id: string, @Body() body: ReviewDto) {
    return this.gateway.send('catalog', 'review', { user, params: { id }, body });
  }

  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @Patch('reviews/:id')
  moderate(@Param('id') id: string, @Body() body: ModerateReviewDto) {
    return this.gateway.send('catalog', 'moderate', { params: { id }, body });
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Get('library')
  library(@CurrentUser() user: PublicUser) {
    return this.gateway.send('catalog', 'library', { user });
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Get('library/:bookId')
  read(@CurrentUser() user: PublicUser, @Param('bookId') bookId: string) {
    return this.gateway.send('catalog', 'read', { user, params: { bookId } });
  }
}

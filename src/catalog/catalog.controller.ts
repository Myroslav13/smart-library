import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '../common/roles';
import { AppError } from '../common/app-error';
import type { BookSearchFilters, PublicUser } from '../domain/types';
import { CurrentUser, OptionalUser, Roles } from '../auth/auth.decorators';
import { CatalogService } from './catalog.service';
import { AddBookDto, ModerateReviewDto, ReviewDto, UpdateBookDto } from './dto';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('books')
  search(@Query() query: BookSearchFilters) {
    return this.catalog.search(query);
  }

  @Get('books/:id')
  details(
    @Param('id') id: string,
    @Query('pending') pending: string | undefined,
    @OptionalUser() user?: PublicUser,
  ) {
    const includePending = pending === '1';
    if (includePending && user?.role !== Role.CONTENT_MANAGER && user?.role !== Role.ADMIN) {
      throw new AppError('Недостатньо прав', 403);
    }
    return this.catalog.getBookDetails(id, user?.id, { includePending });
  }

  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @Post('books')
  @HttpCode(HttpStatus.CREATED)
  add(@Body() body: AddBookDto) {
    return this.catalog.addBook(body, { syncStock: true });
  }

  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @Patch('books/:id')
  update(@Param('id') id: string, @Body() body: UpdateBookDto) {
    return this.catalog.updateBook(id, body);
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Get('books/:id/stock')
  stock(@Param('id') id: string) {
    return this.catalog.updateStockStatus(id);
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('books/:id/reviews')
  @HttpCode(HttpStatus.CREATED)
  review(@CurrentUser() user: PublicUser, @Param('id') id: string, @Body() body: ReviewDto) {
    return this.catalog.addReview(user, id, body);
  }

  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @Patch('reviews/:id')
  moderate(@Param('id') id: string, @Body() body: ModerateReviewDto) {
    return this.catalog.moderateReview(id, body.status);
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Get('library')
  library(@CurrentUser() user: PublicUser) {
    return this.catalog.listLibrary(user.id);
  }

  @Roles(Role.CLIENT, Role.ADMIN)
  @Get('library/:bookId')
  read(@CurrentUser() user: PublicUser, @Param('bookId') bookId: string) {
    return this.catalog.readEbook(user.id, bookId);
  }
}

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('internal/catalog')
export class CatalogInternalController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('books')
  list() {
    return this.catalog.listSummaries();
  }

  @Get('books/:id')
  one(@Param('id') id: string) {
    return this.catalog.summary(id);
  }

  @Post('access')
  grant(@Body() body: { userId: string; bookIds: string[] }) {
    this.catalog.grantAccess(body.userId, body.bookIds ?? []);
    return { ok: true };
  }
}

import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogInternalController } from './catalog-internal.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController, CatalogInternalController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

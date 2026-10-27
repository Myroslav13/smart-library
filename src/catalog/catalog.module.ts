import { Module } from '@nestjs/common';
import { CatalogInternalController } from './catalog-internal.controller';
import { CatalogService } from './catalog.service';
import { CatalogRpcController } from './catalog-rpc.controller';

@Module({
  controllers: [CatalogInternalController, CatalogRpcController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

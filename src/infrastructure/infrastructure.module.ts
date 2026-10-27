import { Global, Module } from '@nestjs/common';
import { AppConfig } from './app-config.service';
import { CacheService } from './cache.service';
import { DatabaseService } from './database.service';
import { SearchIndexService } from './search-index.service';

@Global()
@Module({
  providers: [AppConfig, DatabaseService, CacheService, SearchIndexService],
  exports: [AppConfig, DatabaseService, CacheService, SearchIndexService],
})
export class InfrastructureModule {}

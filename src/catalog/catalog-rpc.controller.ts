import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Role } from '../common/roles';
import { AppError } from '../common/app-error';
import { CatalogService } from './catalog.service';
import { RpcExceptionFilter } from '../common/rpc-exception.filter';

interface RpcRequest {
  operation: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
  user?: { id: string; role: string; name: string; email: string };
  params?: Record<string, string>;
}

@Controller()
@UseFilters(RpcExceptionFilter)
export class CatalogRpcController {
  constructor(private readonly catalog: CatalogService) {}

  @MessagePattern('catalog.request')
  request(@Payload() request: RpcRequest) {
    const user = request.user;
    const body = request.body || {};
    const params = request.params || {};
    switch (request.operation) {
      case 'search': return this.catalog.search(request.query || {});
      case 'details': {
        const includePending = request.query?.pending === '1';
        if (includePending && user?.role !== Role.CONTENT_MANAGER && user?.role !== Role.ADMIN) {
          throw new AppError('Недостатньо прав', 403);
        }
        return this.catalog.getBookDetails(params.id, user?.id, { includePending });
      }
      case 'add': return this.catalog.addBook(body, { syncStock: true });
      case 'update': return this.catalog.updateBook(params.id, body);
      case 'stock': return this.catalog.updateStockStatus(params.id);
      case 'review': return this.catalog.addReview(user!, params.id, body);
      case 'moderate': return this.catalog.moderateReview(params.id, String(body.status || ''));
      case 'library': return this.catalog.listLibrary(user!.id);
      case 'read': return this.catalog.readEbook(user!.id, params.bookId);
      default: throw new Error(`Unknown catalog operation: ${request.operation}`);
    }
  }
}

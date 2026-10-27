import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../common/roles';
import { Roles } from '../auth/auth.decorators';
import { InventoryService } from './inventory.service';

class ShipmentDto {
  @IsString({ message: 'Потрібен bookId' })
  bookId!: string;

  @Type(() => Number)
  @IsInt({ message: 'Кількість поставки має бути цілим числом від 1' })
  @Min(1, { message: 'Кількість поставки має бути цілим числом від 1' })
  quantity!: number;
}

class StocktakeDto {
  @IsString({ message: 'Потрібен bookId' })
  bookId!: string;

  @Type(() => Number)
  @IsInt({ message: "Фактична кількість має бути цілим невід'ємним числом" })
  @Min(0, { message: "Фактична кількість має бути цілим невід'ємним числом" })
  actualQuantity!: number;
}

@Controller()
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Get('inventory')
  list() {
    return this.inventory.listStock();
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Post('inventory/shipments')
  @HttpCode(HttpStatus.CREATED)
  receive(@Body() body: ShipmentDto) {
    return this.inventory.receiveShipment(body);
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Post('inventory/stocktake')
  stocktake(@Body() body: StocktakeDto) {
    return this.inventory.stocktake(body);
  }
}

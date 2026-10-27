import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString({ message: 'Потрібен bookId' })
  bookId!: string;

  @Type(() => Number)
  @IsInt({ message: 'Кількість має бути цілим числом від 1' })
  @Min(1, { message: 'Кількість має бути цілим числом від 1' })
  quantity!: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt({ message: "Кількість має бути цілим невід'ємним числом" })
  @Min(0, { message: "Кількість має бути цілим невід'ємним числом" })
  quantity!: number;
}

export class CheckoutDto {
  @IsOptional()
  @IsString()
  cartId?: string;

  @IsOptional()
  @IsString()
  cart_id?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status!: string;
}

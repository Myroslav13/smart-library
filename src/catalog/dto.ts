import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min, MinLength } from 'class-validator';
import { BOOK_FORMATS } from '../domain/types';

export class AddBookDto {
  @IsString({ message: "Назва, автор і жанр є обов'язковими" })
  @MinLength(1, { message: "Назва, автор і жанр є обов'язковими" })
  title!: string;

  @IsString({ message: "Назва, автор і жанр є обов'язковими" })
  @MinLength(1, { message: "Назва, автор і жанр є обов'язковими" })
  author!: string;

  @IsString({ message: "Назва, автор і жанр є обов'язковими" })
  @MinLength(1, { message: "Назва, автор і жанр є обов'язковими" })
  genre!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(BOOK_FORMATS, { message: 'Невідомий формат. Допустимі значення: physical, ebook, both' })
  format!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Ціна має бути додатним числом' })
  @IsPositive({ message: 'Ціна має бути додатним числом' })
  price!: number;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  publishedYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  initialStock?: number;
}

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Назва не може бути порожньою' })
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Автор не може бути порожнім' })
  author?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Жанр не може бути порожнім' })
  genre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Ціна має бути додатним числом' })
  @IsPositive({ message: 'Ціна має бути додатним числом' })
  price?: number;
}

export class ReviewDto {
  @Type(() => Number)
  @IsInt({ message: 'Оцінка має бути цілим числом від 1 до 5' })
  @Min(1, { message: 'Оцінка має бути цілим числом від 1 до 5' })
  @Max(5, { message: 'Оцінка має бути цілим числом від 1 до 5' })
  rating!: number;

  @IsString({ message: 'Текст відгуку занадто короткий' })
  @MinLength(3, { message: 'Текст відгуку занадто короткий' })
  text!: string;
}

export class ModerateReviewDto {
  @IsIn(['approved', 'rejected'], { message: 'Статус модерації має бути approved або rejected' })
  status!: string;
}

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: "Ім'я має містити щонайменше 2 символи" })
  @MinLength(2, { message: "Ім'я має містити щонайменше 2 символи" })
  name!: string;

  @IsString({ message: 'Некоректна електронна пошта' })
  @IsNotEmpty({ message: 'Некоректна електронна пошта' })
  email!: string;

  @IsString({ message: 'Пароль має містити щонайменше 6 символів' })
  @MinLength(6, { message: 'Пароль має містити щонайменше 6 символів' })
  password!: string;
}

export class LoginDto {
  @IsString({ message: 'Невірна пошта або пароль' })
  @IsNotEmpty({ message: 'Невірна пошта або пароль' })
  email!: string;

  @IsString({ message: 'Невірна пошта або пароль' })
  @IsNotEmpty({ message: 'Невірна пошта або пароль' })
  password!: string;
}

export class UpdateProfileDto {
  @IsString({ message: "Ім'я має містити щонайменше 2 символи" })
  @MinLength(2, { message: "Ім'я має містити щонайменше 2 символи" })
  name!: string;
}

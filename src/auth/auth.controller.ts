import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { ROLE_LIST, Role } from '../common/roles';
import type { PublicUser } from '../domain/types';
import { AccessToken, CurrentUser, Roles } from './auth.decorators';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto';

class SetRoleDto {
  @IsIn(ROLE_LIST, { message: 'Невідома роль' })
  role!: string;
}

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Delete('auth/session')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@AccessToken() token: string): void {
    this.auth.logout(token);
  }

  @Get('profile')
  profile(@CurrentUser() user: PublicUser) {
    return this.auth.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: PublicUser, @Body() body: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, body);
  }

  @Roles(Role.ADMIN)
  @Get('admin/users')
  users() {
    return this.auth.listUsers();
  }

  @Roles(Role.ADMIN)
  @Patch('admin/users/:id/role')
  setRole(@CurrentUser() actor: PublicUser, @Param('id') id: string, @Body() body: SetRoleDto) {
    return this.auth.setRole(actor.id, id, body.role);
  }
}

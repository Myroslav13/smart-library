import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { AccessToken, CurrentUser, Public, Roles } from '../auth/auth.decorators';
import { Role } from '../common/roles';
import type { PublicUser } from '../domain/types';
import { RegisterDto, LoginDto, UpdateProfileDto } from '../auth/dto';
import { GatewayService } from './gateway.service';

@Controller()
export class AuthGatewayController {
  constructor(private readonly gateway: GatewayService) {}

  @Public()
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterDto) {
    return this.gateway.send('auth', 'register', { body });
  }

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.gateway.send('auth', 'login', { body });
  }

  @Delete('auth/session')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@AccessToken() token: string) {
    await this.gateway.send('auth', 'logout', { body: { token } });
  }

  @Get('profile')
  profile(@CurrentUser() user: PublicUser) {
    return this.gateway.send('auth', 'profile', { user });
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: PublicUser, @Body() body: UpdateProfileDto) {
    return this.gateway.send('auth', 'updateProfile', { user, body });
  }

  @Roles(Role.ADMIN)
  @Get('admin/users')
  users() {
    return this.gateway.send('auth', 'users');
  }

  @Roles(Role.ADMIN)
  @Patch('admin/users/:id/role')
  setRole(@CurrentUser() user: PublicUser, @Param('id') id: string, @Body() body: { role: string }) {
    return this.gateway.send('auth', 'setRole', { user, params: { id }, body });
  }
}

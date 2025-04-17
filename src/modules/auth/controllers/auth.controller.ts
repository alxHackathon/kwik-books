import { Request } from 'express';
import { Controller, Post,
  UseGuards, Request as NestRequest,
  Body, HttpException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterAdminDto } from '../dtos/register-admin.dto';
import { LoginDto } from '../dtos/login.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}


  @Post('/login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }
    return this.authService.login(user);
  }


  // Only super Admin can register an admin
  @UseGuards(AuthGuard('jwt'))
  @Post('register-admin')
  async registerAdmin(@NestRequest() req: Request, @Body() dto: RegisterAdminDto) {
    const user = req.user as { sub: string };
  
    const isSuperAdmin = await this.authService.isSuperAdmin(user.sub);
    if (!isSuperAdmin) {
      throw new HttpException('Unauthorized', 401);
    }
  
    return this.authService.registerAdmin(dto);
  }

  @Post('register-tenant-admin')
  async registerTenantAdmin(@Body() dto: RegisterAdminDto) {
    const user = await this.authService.registerAdmin(dto);
    return user;
  }
}
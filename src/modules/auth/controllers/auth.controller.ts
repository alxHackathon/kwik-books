import { Request } from 'express';
import { Controller, Post,
  UseGuards, Request as NestRequest,
  Body, HttpException, 
  UsePipes,
  ValidationPipe,
  HttpCode} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterAdminDto } from '../dtos/register-admin.dto';
import { LoginDto } from '../dtos/login.dto';
import { RegularUserDto } from '../dtos/regular-user.dto';
import { RegisterTenantDto } from '../dtos/register-tenant.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}


  @Post('/login')
  @UsePipes(ValidationPipe)
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }
    return this.authService.login(user);
  }


  @Post('/register')
  @UsePipes(ValidationPipe)
  async register(@Body() dto: RegularUserDto) {
    const user = await this.authService.registerUser(dto);
    if (!user) {
      throw new HttpException('User registration failed', 400);
    }
    // sends otp through email to user to verify email
    // stores otp to temporary table / redis cache
    
    return user;
  }

  // Only super Admin can register an admin
  @UseGuards(AuthGuard('jwt'))
  @Post('register-admin')
  @UsePipes(ValidationPipe)
  async registerAdmin(@NestRequest() req: Request, @Body() dto: RegisterAdminDto) {
    const user = req.user as { sub: string };
  
    const isSuperAdmin = await this.authService.isSuperAdmin(user.sub);
    if (!isSuperAdmin) {
      throw new HttpException('Unauthorized', 401);
    }
  
    return this.authService.registerAdmin(dto);
  }

  @UsePipes(ValidationPipe)
  @HttpCode(201)
  @Post('/signup-tenant')
  async registerTenantAdmin(@Body() dto: RegisterTenantDto) {
    const payload = await this.authService.registerTenant(dto);
    return payload;
  }
}
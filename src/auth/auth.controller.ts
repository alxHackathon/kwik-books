import {Controller, Post, Get, Body, UseGuards, Req} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterIndependentDto } from './dto/register-independent.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { RoleGuard } from './guards/role.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { RegisterOrgDto } from './dto/register-org.dto';
import { Roles } from './decorators/roles.decorator';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-independent')
  registerIndependent(@Body() dto: RegisterIndependentDto) {
    return this.authService.registerIndependent(dto);
  }

  @Post('register-org')
  registerOrg(@Body() dto: RegisterOrgDto) {
    return this.authService.registerOrg(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @Post('invite')
  inviteUser(@Body() dto: InviteUserDto, @Req() req: Request) {
    return this.authService.inviteUser(dto, req.user as any);
  }

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }
  
}
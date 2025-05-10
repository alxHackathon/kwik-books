import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterIndependentDto } from './dto/register-independent.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterOrgDto } from './dto/register-org.dto';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { InviteUserDto } from './dto/invite-user.dto';
import { JwtPayload } from './types/jwt-payload';
import { AcceptInviteDto } from './dto/accept-invite.dto';


@Injectable()
export class AuthService {
  private resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    // Initialize Resend instance with API key
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  /**
   * Register an independent user and send a verification email.
   */
  async registerIndependent(dto: RegisterIndependentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        password: hashedPassword,
        role: 'INDEPENDENT',
        isVerified: false,
      },
    });

    const token = uuidv4();

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 mins expiry
      },
    });

    await this.sendVerificationEmail(user.email, token);

    return { message: 'User created. Please verify your email.' };
  }

  /**
   * Register Organization
   */
  async registerOrg(dto: RegisterOrgDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
  
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }
  
    // Ensure you provide the subdomain here as part of the tenant creation.
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.orgName,
        subdomain: dto.subdomain, // Ensure the subdomain is passed from DTO
      },
    });
  
    const hashedPassword = await bcrypt.hash(dto.password, 10);
  
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        password: hashedPassword,
        role: 'ORG_ADMIN',
        isVerified: false,
        tenantId: tenant.id,
      },
    });
  
    const token = uuidv4();
  
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });
  
    await this.sendVerificationEmail(user.email, token);
  
    return { message: 'Organization registered. Please verify your email.' };
  }
  

  /**
   * Send a verification email using Resend.
   */
  private async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    const from = this.config.get<string>('RESEND_FROM') || 'KwickBooks <no-reply@kwickbooks.onresend.com>';

    try {
      await this.resend.emails.send({
        from,
        to: [email],
        subject: 'Verify your email',
        html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email. This link will expire in 30 minutes.</p>`,
      });
    } catch (err) {
      console.error('Email sending failed:', err);
      throw new BadRequestException('Could not send verification email');
    }
  }

  /**
   * Verifies a user's email using the token.
   */
  async verifyEmail(token: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
  
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Token expired or invalid');
    }
  
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isVerified: true },
    });
  
    await this.prisma.verificationToken.delete({ where: { token } });
  
    return { message: 'Email verified successfully' };
  }
  

  /**
   * Logs a user in by verifying credentials and issuing a JWT token.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? null,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async inviteUser(dto: InviteUserDto, inviter: JwtPayload) {
    const { email, fullName, role } = dto;
  
    const existing = await this.prisma.user.findUnique({ where: { email } });
  
    if (existing) throw new BadRequestException('User already exists');
  
    const tempPassword = randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        isVerified: false,
        role,
        tenantId: inviter.tenantId,
      },
    });
  
    const token = uuidv4();
  
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });
  
    const from = this.config.get<string>('RESEND_FROM') || 'KwickBooks <no-reply@kwickbooks.onresend.com>';

    await this.resend.emails.send({
      from,
      to: [email],
      subject: 'You’ve been invited!',
      html: `
        <p>Hello ${fullName},</p>
        <p>You’ve been invited to join a workspace. Click the link below to accept your invite and set your password:</p>
        <a href="${this.config.get('FRONTEND_URL')}/auth/accept-invite?token=${token}">Accept Invite</a>
        <p>This link will expire in 30 minutes.</p>
      `,
    });
  
    return { message: 'Invite sent.' };
  } 

  async acceptInvite(dto: AcceptInviteDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });
  
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Token expired or invalid');
    }
  
    const hashed = await bcrypt.hash(dto.password, 10);
  
    await this.prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashed,
        isVerified: true,
      },
    });
  
    await this.prisma.passwordResetToken.delete({ where: { token: dto.token } });
  
    return { message: 'Invite accepted. You can now log in.' };
  } 

}

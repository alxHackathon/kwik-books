//This is the key service for this domain 
//It basically would handle JWT, Login and User sessions
import { LoginDto } from '../dtos/login.dto';
import { RegisterAdminDto } from '../dtos/register-admin.dto'
import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegularUserDto } from '../dtos/regular-user.dto';
import { RegisterTenantDto } from '../dtos/register-tenant.dto';


@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    console.log(user);
    if (!user || !(await bcrypt.compare(password, user.password))) return null;
    return user;
  }

  async login(user: LoginDto) {
    const foundUser = await this.prisma.user.findUnique({ where: { email: user.email } });
    if (!foundUser) throw new HttpException("User not found", 404);
    const payload = { sub: foundUser.id, role: foundUser.role, tenantId: foundUser.tenantId };
    const { password, ...userWithoutPassword } = foundUser; // remove password from user object
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    let refreshToken;
    if (foundUser.role === 'TENANT_ADMIN' || foundUser.role === 'SUPER_ADMIN') {
      refreshToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    } else {
      refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    }
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  async registerAdmin(dto: RegisterAdminDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        fullName: dto.fullName,
        role: dto.role,
        tenantId: dto.organisationId || null,
      },
    });

    return user;
  }

  async isSuperAdmin (userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user && user.role === 'SUPER_ADMIN';
  }
  async isTenantAdmin (userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user && user.role === 'TENANT_ADMIN';
  }

  async registerUser(dto: RegularUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new HttpException('User already exists', 400);
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        fullName: dto.fullName,
        role: "INDEPENDENT_USER",
        tenantId: null
      }
    });
    const accessToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });
    const { password, ...userWithoutPassword } = user;
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async registerTenant(dto: RegisterTenantDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const existingTenant = await this.prisma.tenant.findFirst({ 
      where: { 
      OR: [
        { subdomain: dto.subdomain },
        { name: dto.companyName }
      ] 
      } 
    });
    if (existingUser) {
      throw new HttpException('User already exists', 400);
    } else if (existingTenant) {
      throw new HttpException('Tenant already exists', 400);
    }
    const hashed = await bcrypt.hash(dto.password, 10);

    // create tenant first
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.companyName,
        subdomain: dto.subdomain,
      }});

    if (!tenant) {
      throw new HttpException('Tenant creation failed', 400);
    }
    // link tenant to admin
    const tenantAdmin = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        fullName: dto.fullName,
        role: "TENANT_ADMIN",
        tenantId: tenant.id
      }
    });
    const payload = { sub: tenantAdmin.id, role: tenantAdmin.role, tenantId: tenantAdmin.tenantId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const { password, ...userWithoutPassword } = tenantAdmin;
    return {
      message: "Tenant created successfully",
      accessToken,
      refreshToken,
      tenant,
      user: userWithoutPassword,
    };
  }

  async  refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new HttpException("User not found", 404);
      const newAccessToken = this.jwtService.sign({ sub: user.id, role: user.role, tenantId: user.tenantId }, { expiresIn: '1h' });
      return { accessToken: newAccessToken };
    } catch (error) {
      console.log(error)
      throw new HttpException('Invalid refresh token', 401);
    }
  }
}

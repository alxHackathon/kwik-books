//This is the key service for this domain 
//It basically would handle JWT, Login and User sessions
import { LoginDto } from '../dtos/login.dto';
import { RegisterAdminDto } from '../dtos/register-admin.dto'
import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';


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
    const payload = { sub: foundUser.id, role: foundUser.role, tenantId: foundUser.organisationId };
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
        organisationId: dto.organisationId || null,
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
}

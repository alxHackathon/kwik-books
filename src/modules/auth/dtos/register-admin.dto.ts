import { IsEmail, IsString, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  fullName: string;

  @IsEnum(Role)
  role: Role;
}

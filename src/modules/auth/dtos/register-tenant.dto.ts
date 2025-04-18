import { IsEmail, IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class RegisterTenantDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  fullName: string;

  @IsString()
  companyName: string;

  @IsString()
  subdomain: string;

  @IsString()
  @Length(10, 15)
  @IsOptional()
  phoneNumber?: string;
}
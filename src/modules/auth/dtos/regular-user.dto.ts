import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegularUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  fullName: string;
}
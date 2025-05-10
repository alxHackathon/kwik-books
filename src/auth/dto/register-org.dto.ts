import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterOrgDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  fullName: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  orgName: string;

  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  subdomain: string;
}
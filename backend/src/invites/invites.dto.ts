import { IsEmail, IsEnum, IsISO8601, IsOptional } from 'class-validator';

export class CreateInviteDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['user', 'admin'] as const)
  role?: 'user' | 'admin';

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

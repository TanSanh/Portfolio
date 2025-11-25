import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class StartConversationDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}


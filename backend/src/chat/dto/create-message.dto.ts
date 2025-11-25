import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsEnum(['user', 'admin'])
  sender: 'user' | 'admin';

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;
}


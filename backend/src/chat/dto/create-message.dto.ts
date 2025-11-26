import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsEnum(['user', 'admin'])
  sender: 'user' | 'admin';

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  fileType?: string;

  @IsOptional()
  fileSize?: number;
}

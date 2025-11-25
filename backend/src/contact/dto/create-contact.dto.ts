import {
  IsString,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const NAME_REGEX = /^[a-zA-ZÀ-ỹ\s]{2,20}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export class CreateContactDto {
  @IsString()
  @Matches(NAME_REGEX, {
    message: 'Họ tên phải từ 2-20 ký tự, chỉ gồm chữ cái và khoảng trắng',
  })
  fullName: string;

  @IsString()
  @Matches(EMAIL_REGEX, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Chủ đề tối đa 100 ký tự' })
  subject?: string;

  @IsString()
  @MinLength(10, { message: 'Tin nhắn phải có ít nhất 10 ký tự' })
  @MaxLength(500, { message: 'Tin nhắn tối đa 500 ký tự' })
  message: string;
}


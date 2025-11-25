import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

const NAME_REGEX = /^[a-zA-ZÀ-ỹ\s]{2,20}$/;
const PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export class StartConversationDto {
  @IsString()
  @IsNotEmpty()
  @Matches(NAME_REGEX, {
    message: 'Họ tên phải từ 2-20 ký tự, chỉ gồm chữ cái và khoảng trắng',
  })
  fullName: string;

  @IsString()
  @IsOptional()
  @Matches(PHONE_REGEX, {
    message: 'Số điện thoại không đúng định dạng Việt Nam',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @Matches(EMAIL_REGEX, {
    message: 'Email không đúng định dạng',
  })
  email?: string;
}

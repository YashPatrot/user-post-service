import { IsEmail, IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email as ID' })
  @IsEmail({}, { message: 'ID must be a valid email' })
  id: string;

  @ApiProperty({
    example: 'password123!',
    description:
      'Password (12-20 chars with lowercase, numbers, special chars)',
  })
  @IsString()
  @Length(12, 20, { message: 'Password must be between 12 and 20 characters' })
  @Matches(/^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must include lowercase letters, numbers, and special characters',
  })
  password: string;

  @ApiProperty({
    example: '홍길동',
    description: 'Korean username (1-10 chars)',
  })
  @IsString()
  @Matches(/^[가-힣]{1,10}$/, {
    message: 'Username must be in Korean and between 1 and 10 characters',
  })
  username: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'password123!',
    description:
      'Password (12-20 chars with lowercase, numbers, special chars)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(12, 20, { message: 'Password must be between 12 and 20 characters' })
  @Matches(/^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must include lowercase letters, numbers, and special characters',
  })
  password?: string;

  @ApiProperty({
    example: '홍길동',
    description: 'Korean username (1-10 chars)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[가-힣]{1,10}$/, {
    message: 'Username must be in Korean and between 1 and 10 characters',
  })
  username?: string;
}

import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email as ID' })
  @IsEmail({}, { message: 'ID must be a valid email' })
  id: string;

  @ApiProperty({ example: 'password123!', description: 'User password' })
  @IsString()
  password: string;
}

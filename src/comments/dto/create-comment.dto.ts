import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'This is a comment',
    description: 'Content of the comment (1-500 characters)',
  })
  @IsString()
  @Length(1, 500, { message: 'Content must be between 1 and 500 characters' })
  content: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Post Title',
    description: 'Title of the post (1-30 characters)',
  })
  @IsString()
  @Length(1, 30, { message: 'Title must be between 1 and 30 characters' })
  title: string;

  @ApiProperty({
    example: 'This is the content of the post.',
    description: 'Content of the post (1-1000 characters)',
  })
  @IsString()
  @Length(1, 1000, { message: 'Content must be between 1 and 1000 characters' })
  content: string;
}

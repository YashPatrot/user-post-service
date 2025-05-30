import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @ApiProperty({
    example: 'comment-id',
    description: 'Cursor for pagination (comment ID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

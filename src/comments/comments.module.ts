import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [CommentsService, JwtStrategy],
})
export class CommentsModule {}

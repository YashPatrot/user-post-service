import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async createComment(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ) {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        authorId: userId,
        postId,
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        username: comment.author?.username,
        createdAt: comment.createdAt,
      },
      message: 'Comment created successfully',
    };
  }

  async getComments(postId: string, cursor?: string) {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const take = 10;

    // Build the query
    const query: any = {
      where: { postId },
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    };

    // Add cursor if provided
    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; // Skip the cursor
    }

    // Fetch comments
    const comments = await this.prisma.comment.findMany(query);

    // Format the response
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      //@ts-ignore
      username: comment.author?.username || 'Unknown User',
      createdAt: comment.createdAt,
    }));

    // Determine the next cursor
    const nextCursor =
      comments.length === take ? comments[comments.length - 1].id : null;

    return {
      success: true,
      data: {
        comments: formattedComments,
        nextCursor,
      },
      message: 'Comments retrieved successfully',
    };
  }

  async deleteComment(userId: string, commentId: string) {
    // Find the comment
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is authorized to delete the comment
    // User can delete if they are the comment author or the post author
    if (comment.authorId !== userId && comment.post.authorId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    // Delete the comment
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return {
      success: true,
      message: 'Comment deleted successfully',
    };
  }
}

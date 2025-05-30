import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        authorId: userId,
      },
    });

    return {
      success: true,
      data: post,
      message: 'Post created successfully',
    };
  }

  async getPosts(page: number = 1) {
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: {
            select: {
              username: true,
            },
          },
        },
      }),
      this.prisma.post.count(),
    ]);

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      username: post.author.username,
      createdAt: post.createdAt,
    }));

    return {
      success: true,
      data: {
        posts: formattedPosts,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      message: 'Posts retrieved successfully',
    };
  }

  async getPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      success: true,
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        username: post.author.username,
        createdAt: post.createdAt,
      },
      message: 'Post retrieved successfully',
    };
  }
}

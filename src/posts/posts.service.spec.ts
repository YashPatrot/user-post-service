import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const createPostDto = {
      title: 'Test Post',
      content: 'This is a test post content.',
    };

    it('should create a post successfully', async () => {
      const mockPost = {
        id: 'post-id',
        title: 'Test Post',
        content: 'This is a test post content.',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 'user-id',
      };

      mockPrismaService.post.create.mockResolvedValue(mockPost);

      const result = await service.createPost('user-id', createPostDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPost);
      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: {
          title: createPostDto.title,
          content: createPostDto.content,
          authorId: 'user-id',
        },
      });
    });
  });

  describe('getPosts', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Post 1',
          createdAt: new Date(),
          author: { username: '홍길동' },
        },
        {
          id: 'post-2',
          title: 'Post 2',
          createdAt: new Date(),
          author: { username: '김철수' },
        },
      ];

      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(25);

      const result = await service.getPosts(1);

      expect(result.success).toBe(true);
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.totalCount).toBe(25);
      expect(result.data.currentPage).toBe(1);
      expect(result.data.totalPages).toBe(2);
    });
  });

  describe('getPostById', () => {
    it('should return a post by ID', async () => {
      const mockPost = {
        id: 'post-id',
        title: 'Test Post',
        content: 'Test content',
        createdAt: new Date(),
        author: { username: '홍길동' },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.getPostById('post-id');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('post-id');
      expect(result.data.title).toBe('Test Post');
    });

    it('should throw NotFoundException for non-existent post', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.getPostById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

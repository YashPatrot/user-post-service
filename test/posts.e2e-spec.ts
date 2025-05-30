import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.loginRecord.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user and get auth token
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        id: 'test@example.com',
        password: 'password123!',
        username: '홍길동',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        id: 'test@example.com',
        password: 'password123!',
      });

    authToken = loginResponse.body.data.access_token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/posts (POST)', () => {
    it('should create a new post with valid data', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: 'This is a test post content.',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.title).toBe('Test Post');
          expect(res.body.data.content).toBe('This is a test post content.');
        });
    });

    it('should reject post without authentication', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Test Post',
          content: 'This is a test post content.',
        })
        .expect(401);
    });

    it('should reject post with invalid title length', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'A'.repeat(31), // Too long
          content: 'This is a test post content.',
        })
        .expect(400);
    });

    it('should reject post with invalid content length', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: 'A'.repeat(1001), // Too long
        })
        .expect(400);
    });
  });

  describe('/posts (GET)', () => {
    beforeEach(async () => {
      // Create some test posts
      for (let i = 1; i <= 25; i++) {
        await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Test Post ${i}`,
            content: `This is test post content ${i}.`,
          });
      }
    });

    it('should get paginated posts', () => {
      return request(app.getHttpServer())
        .get('/posts?page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.posts).toHaveLength(20); // Max 20 per page
          expect(res.body.data.totalCount).toBe(25);
          expect(res.body.data.currentPage).toBe(1);
          expect(res.body.data.totalPages).toBe(2);
        });
    });

    it('should get second page of posts', () => {
      return request(app.getHttpServer())
        .get('/posts?page=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.posts).toHaveLength(5); // Remaining 5 posts
          expect(res.body.data.currentPage).toBe(2);
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(401);
    });
  });

  describe('/posts/:id (GET)', () => {
    let postId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: 'This is a test post content.',
        });

      postId = response.body.data.id;
    });

    it('should get post by ID', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(postId);
          expect(res.body.data.title).toBe('Test Post');
          expect(res.body.data.content).toBe('This is a test post content.');
          expect(res.body.data.username).toBe('홍길동');
        });
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .get('/posts/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(401);
    });
  });
});

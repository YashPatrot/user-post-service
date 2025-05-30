import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';

describe('CommentsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let postId: string;
  let secondUserToken: string;

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

    // Create first test user and get auth token
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        id: 'user1@example.com',
        password: 'password123!',
        username: '홍길동',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        id: 'user1@example.com',
        password: 'password123!',
      });

    authToken = loginResponse.body.data.access_token;

    // Create second test user
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        id: 'user2@example.com',
        password: 'password123!',
        username: '김철수',
      });

    const secondLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        id: 'user2@example.com',
        password: 'password123!',
      });

    secondUserToken = secondLoginResponse.body.data.access_token;

    // Create a test post
    const postResponse = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Post for Comments',
        content: 'This is a test post for comment testing.',
      });

    postId = postResponse.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/posts/:postId/comments (POST)', () => {
    it('should create a new comment with valid data', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment.',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.content).toBe('This is a test comment.');
          expect(res.body.data.username).toBe('홍길동');
          expect(res.body.data.id).toBeDefined();
          expect(res.body.data.createdAt).toBeDefined();
        });
    });

    it('should reject comment without authentication', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .send({
          content: 'This is a test comment.',
        })
        .expect(401);
    });

    it('should reject comment with invalid content length', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'A'.repeat(501), // Too long
        })
        .expect(400);
    });

    it('should reject comment with empty content', () => {
      return request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
        })
        .expect(400);
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .post('/posts/non-existent-id/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment.',
        })
        .expect(404);
    });
  });

  describe('/posts/:postId/comments (GET)', () => {
    beforeEach(async () => {
      // Create multiple comments for pagination testing
      for (let i = 1; i <= 15; i++) {
        await request(app.getHttpServer())
          .post(`/posts/${postId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: `Test comment ${i}`,
          });
      }
    });

    it('should get comments with cursor-based pagination', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.comments).toHaveLength(10); // Max 10 per page
          expect(res.body.data.nextCursor).toBeDefined();
          expect(res.body.data.comments[0].content).toContain('Test comment');
        });
    });

    it('should get next page using cursor', async () => {
      // Get first page
      const firstPageResponse = await request(app.getHttpServer())
        .get(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const nextCursor = firstPageResponse.body.data.nextCursor;

      // Get second page using cursor
      return request(app.getHttpServer())
        .get(`/posts/${postId}/comments?cursor=${nextCursor}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.comments).toHaveLength(5); // Remaining 5 comments
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}/comments`)
        .expect(401);
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .get('/posts/non-existent-id/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/comments/:id (DELETE)', () => {
    let commentId: string;

    beforeEach(async () => {
      const commentResponse = await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment to be deleted',
        });

      commentId = commentResponse.body.data.id;
    });

    it('should allow comment author to delete comment', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Comment deleted successfully');
        });
    });

    it('should allow post author to delete any comment on their post', async () => {
      // Create comment by second user
      const commentResponse = await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          content: 'Comment by second user',
        });

      const secondUserCommentId = commentResponse.body.data.id;

      // Post author (first user) should be able to delete it
      return request(app.getHttpServer())
        .delete(`/comments/${secondUserCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject deletion by unauthorized user', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(403);
    });

    it('should reject deletion without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .expect(401);
    });

    it('should return 404 for non-existent comment', () => {
      return request(app.getHttpServer())
        .delete('/comments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

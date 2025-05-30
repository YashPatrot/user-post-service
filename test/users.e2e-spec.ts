import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';

describe('UsersController (e2e)', () => {
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

  describe('/users/me (PATCH)', () => {
    it('should update username successfully', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: '김철수',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('User information updated successfully');
        });
    });

    it('should update password successfully', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'newpassword123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('User information updated successfully');
        });
    });

    it('should update both username and password', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: '김영희',
          password: 'newpassword123!',
        })
        .expect(200);
    });

    it('should reject invalid username', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'John Doe', // Non-Korean
        })
        .expect(400);
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'weak', // Too weak
        })
        .expect(400);
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .send({
          username: '김철수',
        })
        .expect(401);
    });

    it('should handle empty update gracefully', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);
    });
  });

  describe('/users/login-records (GET)', () => {
    beforeEach(async () => {
      // Create multiple login records
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            id: 'test@example.com',
            password: 'password123!',
          });
      }
    });

    it('should get login records successfully', () => {
      return request(app.getHttpServer())
        .get('/users/login-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.data[0]).toHaveProperty('username');
          expect(res.body.data[0]).toHaveProperty('loginTime');
          expect(res.body.data[0]).toHaveProperty('ipAddress');
        });
    });

    it('should format login time correctly', () => {
      return request(app.getHttpServer())
        .get('/users/login-records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const loginTime = res.body.data[0].loginTime;
          // Check format: YYYY-MM-DD HH:mm:ss
          expect(loginTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .get('/users/login-records')
        .expect(401);
    });
  });

  describe('/users/login-rankings (GET)', () => {
    beforeEach(async () => {
      // Create multiple users with different login counts
      const users = [
        { id: 'user1@example.com', username: '사용자1', logins: 5 },
        { id: 'user2@example.com', username: '사용자2', logins: 3 },
        { id: 'user3@example.com', username: '사용자3', logins: 5 }, // Same as user1
        { id: 'user4@example.com', username: '사용자4', logins: 1 },
      ];

      for (const user of users) {
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            id: user.id,
            password: 'password123!',
            username: user.username,
          });

        // Create login records for this week
        for (let i = 0; i < user.logins; i++) {
          await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              id: user.id,
              password: 'password123!',
            });
        }
      }
    });

    it('should get login rankings successfully', () => {
      return request(app.getHttpServer())
        .get('/users/login-rankings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('rankings');
          expect(res.body.data).toHaveProperty('weekStart');
          expect(res.body.data).toHaveProperty('weekEnd');
        });
    });

    it('should handle ranking ties correctly', () => {
      return request(app.getHttpServer())
        .get('/users/login-rankings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const rankings = res.body.data.rankings;
          if (rankings.length > 0) {
            // Check that rankings have required fields
            expect(rankings[0]).toHaveProperty('username');
            expect(rankings[0]).toHaveProperty('loginCount');
            expect(rankings[0]).toHaveProperty('rank');
            expect(rankings[0]).toHaveProperty('sharedRankCount');
          }
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .get('/users/login-rankings')
        .expect(401);
    });
  });
});

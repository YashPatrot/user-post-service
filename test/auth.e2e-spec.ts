import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/auth/signup (POST)', () => {
    it('should create a new user with valid data', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          id: 'test@example.com',
          password: 'password123!',
          username: '홍길동',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe('test@example.com');
          expect(res.body.data.username).toBe('홍길동');
          expect(res.body.data.createdAt).toBeDefined();
        });
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          id: 'invalid-email',
          password: 'password123!',
          username: '홍길동',
        })
        .expect(400);
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          id: 'test@example.com',
          password: 'weak',
          username: '홍길동',
        })
        .expect(400);
    });

    it('should reject non-Korean username', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          id: 'test@example.com',
          password: 'password123!',
          username: 'John Doe',
        })
        .expect(400);
    });

    it('should reject duplicate user', async () => {
      // Create first user
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          id: 'test@example.com',
          password: 'password123!',
          username: '홍길동',
        })
        .expect(201);

      // Try to create duplicate
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          id: 'test@example.com',
          password: 'password123!',
          username: '김철수',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          id: 'test@example.com',
          password: 'password123!',
          username: '홍길동',
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'test@example.com',
          password: 'password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.access_token).toBeDefined();
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'wrong@example.com',
          password: 'password123!',
        })
        .expect(401);
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should create login record on successful login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'test@example.com',
          password: 'password123!',
        })
        .expect(200);

      const loginRecords = await prisma.loginRecord.findMany({
        where: { userId: 'test@example.com' },
      });

      expect(loginRecords).toHaveLength(1);
      expect(loginRecords[0].ipAddress).toBeDefined();
    });
  });
});

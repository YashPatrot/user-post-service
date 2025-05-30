import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    loginRecord: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const validSignupDto = {
      id: 'test@example.com',
      password: 'password123!',
      username: '홍길동',
    };

    it('should create a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'test@example.com',
        username: '홍길동',
        createdAt: new Date(),
      });

      const result = await service.signup(validSignupDto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('test@example.com');
      expect(result.data.username).toBe('홍길동');
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'test@example.com',
      });

      await expect(service.signup(validSignupDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid password', async () => {
      const invalidSignupDto = {
        ...validSignupDto,
        password: 'weak',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.signup(invalidSignupDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid username', async () => {
      const invalidSignupDto = {
        ...validSignupDto,
        username: 'John Doe',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.signup(invalidSignupDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const validLoginDto = {
      id: 'test@example.com',
      password: 'password123!',
    };

    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'test@example.com',
        password: hashedPassword,
        username: '홍길동',
      });
      mockPrismaService.loginRecord.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(validLoginDto, '127.0.0.1');

      expect(result.success).toBe(true);
      expect(result.data.access_token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login(validLoginDto, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('differentpassword', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'test@example.com',
        password: hashedPassword,
        username: '홍길동',
      });

      await expect(
        service.login(validLoginDto, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

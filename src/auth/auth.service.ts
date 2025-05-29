import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: signupDto.id },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Validate password
    this.validatePassword(signupDto.password);

    // Validate username
    this.validateUsername(signupDto.username);

    // Hash password
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: signupDto.id,
        password: hashedPassword,
        username: signupDto.username,
      },
    });

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
      message: 'User created successfully',
    };
  }

  async login(loginDto: LoginDto, ipAddress: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: loginDto.id },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create login record
    await this.prisma.loginRecord.create({
      data: {
        userId: user.id,
        ipAddress,
      },
    });

    // Generate JWT
    const payload = { sub: user.id, username: user.username };
    return {
      success: true,
      data: {
        access_token: this.jwtService.sign(payload),
      },
      message: 'Login successful',
    };
  }

  private validatePassword(password: string) {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{12,20}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password must be 12-20 characters and include lowercase letters, numbers, and special characters',
      );
    }
  }

  private validateUsername(username: string) {
    const koreanRegex = /^[가-힣]{1,10}$/;
    if (!koreanRegex.test(username)) {
      throw new BadRequestException(
        'Username must be in Korean and between 1-10 characters',
      );
    }
  }
}



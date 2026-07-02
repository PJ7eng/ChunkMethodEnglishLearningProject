import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // User Registration with existing user check, password hashing, and user preference creation
  async register(body: RegisterDto): Promise<{ success: boolean; message: string; user: { id: string; email: string; name?: string | null } }> {
    
    // Existing user check
    const existingUser = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // password hashing
    const passwordHash = bcrypt.hashSync(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
      },
    });

    // user preference creation
    await this.prisma.userPreference.create({
      data: {
        userId: user.id,
      },
    });

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  // User Login with email and password validation and token generation
  async login(body: LoginDto): Promise<{ success: boolean; message: string; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = bcrypt.compareSync(body.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    return {
      success: true,
      message: 'Login successful',
      token,
    };
  }

  async getProfile(userId: string): Promise<{ id: string; email: string; name?: string | null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}

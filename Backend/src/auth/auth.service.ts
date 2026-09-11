import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { jwtSecret } from './auth.guard';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  emailVerified: boolean;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(body: RegisterDto, context: SessionContext = {}) {
    if (!body.email?.trim() || !body.password) {
      throw new UnauthorizedException('Email and password are required');
    }
    if (body.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Existing user check
    const existingUser = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // password hashing
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: body.email.trim().toLowerCase(),
        passwordHash,
        name: body.name?.trim() || null,
        preferences: { create: {} },
      },
    });
    const verificationToken = await this.issueVerificationToken(user.id);
    await this.sendAccountEmail('verify', user.email, verificationToken);
    const session = await this.createSession(user, context);

    return {
      success: true,
      message: 'User registered. Please verify your email.',
      token: session.accessToken,
      refreshToken: session.refreshToken,
      user: this.publicUser(user),
      verificationRequired: true,
      ...(process.env.NODE_ENV !== 'production' ? { verificationToken } : {}),
    };
  }

  async login(body: LoginDto, context: SessionContext = {}) {
    if (!body.email?.trim() || !body.password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: body.email.trim().toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (
      process.env.REQUIRE_EMAIL_VERIFICATION === 'true' &&
      !user.emailVerifiedAt
    ) {
      throw new UnauthorizedException('Email verification required');
    }
    const session = await this.createSession(user, context);

    return {
      success: true,
      message: 'Login successful',
      token: session.accessToken,
      refreshToken: session.refreshToken,
      user: this.publicUser(user),
    };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.publicUser(user);
  }

  async verifyEmail(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Verification token is invalid or expired');
    }
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });
    if (!record) {
      throw new BadRequestException('Verification token is invalid or expired');
    }

    const alreadyVerified = Boolean(record.user?.emailVerifiedAt);
    if (record.usedAt) {
      if (alreadyVerified) {
        return { success: true, message: 'Email verified' };
      }
      throw new BadRequestException('Verification token is invalid or expired');
    }
    if (record.expiresAt <= new Date()) {
      throw new BadRequestException('Verification token is invalid or expired');
    }
    if (alreadyVerified) {
      await this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      return { success: true, message: 'Email verified' };
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
    return { success: true, message: 'Email verified' };
  }

  async resendVerificationEmail(email: string) {
    const generic = {
      success: true,
      message:
        'If the account exists and still needs verification, a new email has been sent.',
    };
    const normalized = email?.trim().toLowerCase();
    if (!normalized) {
      return generic;
    }
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (!user || user.emailVerifiedAt) {
      return generic;
    }

    const token = await this.issueVerificationToken(user.id);
    await this.sendAccountEmail('verify', user.email, token);
    await this.prisma.emailVerificationToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        tokenHash: { not: this.hashToken(token) },
      },
      data: { usedAt: new Date() },
    });
    return {
      ...generic,
      ...(process.env.NODE_ENV !== 'production' ? { verificationToken: token } : {}),
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    let developmentToken: string | undefined;
    if (user) {
      const token = randomBytes(32).toString('base64url');
      developmentToken = token;
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      await this.sendAccountEmail('reset', user.email, token);
    }
    return {
      success: true,
      message: 'If the account exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && developmentToken
        ? { resetToken: developmentToken }
        : {}),
    };
  }

  async resetPassword(token: string, password: string) {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException('Reset token is invalid or expired');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.userSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { success: true, message: 'Password updated' };
  }

  async refresh(refreshToken: string, context: SessionContext = {}) {
    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      if (session) {
        await this.prisma.userSession.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const next = await this.createSession(session.user, context);
    return {
      success: true,
      token: next.accessToken,
      refreshToken: next.refreshToken,
      user: this.publicUser(session.user),
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.userSession.updateMany({
        where: { refreshTokenHash: this.hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async exportAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerifiedAt: true,
        timezone: true,
        createdAt: true,
        preferences: true,
        notes: true,
        learningProgress: true,
        dailyProgress: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { exportedAt: new Date().toISOString(), user };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Password confirmation failed');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  private async issueVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return token;
  }

  private async createSession(
    user: { id: string; email: string; role: UserRole },
    context: SessionContext,
  ) {
    const refreshToken = randomBytes(48).toString('base64url');
    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      },
    });
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
      },
      jwtSecret(),
      {
        expiresIn: '15m',
        issuer: 'chunkmaster-api',
        audience: 'chunkmaster-web',
      },
    );
    return { accessToken, refreshToken };
  }

  private hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private publicUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    emailVerifiedAt: Date | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  private async sendAccountEmail(
    type: 'verify' | 'reset',
    email: string,
    token: string,
  ): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const path = type === 'verify' ? 'verify-email' : 'reset-password';
    const subject = type === 'verify' ? 'Verify your ChunkMaster email' : 'Reset your ChunkMaster password';
    if (!apiKey) return;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'ChunkMaster <noreply@example.com>',
        to: [email],
        subject,
        html: `<p><a href="${appUrl}/${path}?token=${encodeURIComponent(token)}">${subject}</a></p>`,
      }),
    });
    if (!response.ok) {
      throw new Error(`Email provider failed with ${response.status}`);
    }
  }
}

import { Body, Controller, Delete, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';
import { Throttle } from '@nestjs/throttler';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() body: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body, this.context(req));
    this.setSessionCookies(res, result.token, result.refreshToken);
    return result;
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body, this.context(req));
    this.setSessionCookies(res, result.token, result.refreshToken);
    return result;
  }

  @Post('verify-email')
  verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email || '');
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token || '', body.password || '');
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
    @Body() body: { refreshToken?: string },
  ) {
    const refreshToken = req.cookies?.chunk_refresh_token || body.refreshToken;
    const result = await this.authService.refresh(refreshToken || '', this.context(req));
    this.setSessionCookies(res, result.token, result.refreshToken);
    return result;
  }

  @Post('logout')
  async logout(
    @Req() req: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
    @Body() body: { refreshToken?: string },
  ) {
    await this.authService.logout(
      req.cookies?.chunk_refresh_token || body.refreshToken,
    );
    res.clearCookie('chunk_access_token', this.cookieOptions(0));
    res.clearCookie('chunk_refresh_token', this.cookieOptions(0));
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const authenticatedRequest = req as Request & { user?: AuthenticatedUser };
    const userId = authenticatedRequest.user?.sub;
    if (!userId) {
      throw new Error('Missing authenticated user id');
    }

    const user = await this.authService.getProfile(userId);
    return { success: true, message: 'Authenticated user profile', user };
  }

  @UseGuards(AuthGuard)
  @Get('account/export')
  exportAccount(@Req() req: Request & { user?: AuthenticatedUser }) {
    return this.authService.exportAccount(req.user!.sub);
  }

  @UseGuards(AuthGuard)
  @Delete('account')
  async deleteAccount(
    @Req() req: Request & { user?: AuthenticatedUser },
    @Res({ passthrough: true }) res: Response,
    @Body() body: { password: string },
  ) {
    const result = await this.authService.deleteAccount(
      req.user!.sub,
      body.password || '',
    );
    res.clearCookie('chunk_access_token', this.cookieOptions(0));
    res.clearCookie('chunk_refresh_token', this.cookieOptions(0));
    return result;
  }

  private context(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }

  private setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(
      'chunk_access_token',
      accessToken,
      this.cookieOptions(15 * 60 * 1000),
    );
    res.cookie(
      'chunk_refresh_token',
      refreshToken,
      this.cookieOptions(30 * 24 * 60 * 60 * 1000),
    );
  }

  private cookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge,
      path: '/',
    };
  }
}

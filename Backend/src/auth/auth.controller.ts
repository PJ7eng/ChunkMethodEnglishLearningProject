import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

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
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: Request): Promise<{ success: boolean; message: string; user: { id: string; email: string; name?: string | null } }> {
    const authenticatedRequest = req as Request & { user?: { sub?: string; email?: string } };
    const userId = authenticatedRequest.user?.sub;
    if (!userId) {
      throw new Error('Missing authenticated user id');
    }

    const user = await this.authService.getProfile(userId);
    return { success: true, message: 'Authenticated user profile', user };
  }
}

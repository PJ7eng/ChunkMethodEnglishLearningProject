import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ContentStatus, UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.content_reviewer, UserRole.content_admin, UserRole.super_admin)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('content')
  content(
    @Query('status') status?: ContentStatus,
    @Query('category') category?: string,
  ) {
    return this.admin.listContent(status, category);
  }

  @Get('content/:id')
  contentDetail(@Param('id') id: string) {
    return this.admin.getContent(id);
  }

  @Patch('content/:id/chunks/:chunkId')
  editChunk(
    @Param('id') id: string,
    @Param('chunkId') chunkId: string,
    @Body() body: {
      phrase?: string;
      translation?: string;
      pinyin?: string | null;
      usage?: string;
      register?: string;
      cefr?: string;
      blank?: string;
      answer?: string;
      options?: string[];
      examples?: Array<string | { sentence: string; translation?: string | null }>;
    },
    @Req() request: Request & { user?: AuthenticatedUser },
  ) {
    return this.admin.editChunk(id, chunkId, body, this.actor(request));
  }

  @Post('content/:id/approve')
  approve(
    @Param('id') id: string,
    @Req() request: Request & { user?: AuthenticatedUser },
  ) {
    return this.admin.transition(id, 'approve', this.actor(request));
  }

  @Post('content/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() request: Request & { user?: AuthenticatedUser },
  ) {
    return this.admin.transition(id, 'reject', this.actor(request), body.reason);
  }

  @Post('content/:id/retire')
  @Roles(UserRole.content_admin, UserRole.super_admin)
  retire(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() request: Request & { user?: AuthenticatedUser },
  ) {
    return this.admin.transition(id, 'retire', this.actor(request), body.reason);
  }

  @Post('content/:id/restore')
  @Roles(UserRole.content_admin, UserRole.super_admin)
  restore(
    @Param('id') id: string,
    @Req() request: Request & { user?: AuthenticatedUser },
  ) {
    return this.admin.transition(id, 'restore', this.actor(request));
  }

  @Get('audit')
  @Roles(UserRole.content_admin, UserRole.super_admin)
  audit() {
    return this.admin.auditLog();
  }

  private actor(request: Request & { user?: AuthenticatedUser }): string {
    if (!request.user?.sub) throw new Error('Missing actor');
    return request.user.sub;
  }
}

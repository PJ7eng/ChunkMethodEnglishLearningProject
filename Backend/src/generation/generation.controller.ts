import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GenerationService } from './generation.service';
import { Throttle } from '@nestjs/throttler';

export interface CreateGenerationJobRequest {
  category: string;
  difficulty: string;
  batchSize: number;
  triggerReason: string;
}

@Controller('admin/generation')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.content_admin, UserRole.super_admin)
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post('jobs')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  async createJob(
    @Body() body: CreateGenerationJobRequest,
    @Req() req: Request & { user?: AuthenticatedUser },
  ) {
    return this.generationService.createJob({
      category: body.category,
      difficulty: body.difficulty,
      batchSize: body.batchSize,
      triggerReason: body.triggerReason,
    }, req.user?.sub);
  }

  @Get('jobs')
  async getJobs() {
    return this.generationService.getJobs();
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return this.generationService.getJob(id);
  }
}

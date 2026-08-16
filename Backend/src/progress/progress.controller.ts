import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ProgressService } from './progress.service';

export interface RecordAnswerRequest {
  chunkId: string;
  isCorrect: boolean;
  date?: string;
  responseMs?: number;
}

function getUserId(req: Request): string {
  const authenticatedRequest = req as Request & { user?: { sub?: string } };
  const userId = authenticatedRequest.user?.sub;
  if (!userId) {
    throw new Error('Missing authenticated user id');
  }
  return userId;
}

@Controller('progress')
@UseGuards(AuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('answer')
  async recordAnswer(@Req() req: Request, @Body() body: RecordAnswerRequest) {
    return this.progressService.recordAnswer({
      userId: getUserId(req),
      chunkId: body.chunkId,
      isCorrect: body.isCorrect,
      date: body.date ? new Date(body.date) : undefined,
      responseMs: body.responseMs,
    });
  }

  @Get('today')
  getToday(@Req() req: Request) {
    return this.progressService.getToday(getUserId(req));
  }

  @Get('streak')
  getStreak(@Req() req: Request) {
    return this.progressService.getStreak(getUserId(req));
  }

  @Get('calendar')
  getCalendar(
    @Req() req: Request,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    const y = year ? Number(year) : now.getFullYear();
    const m = month !== undefined ? Number(month) : now.getMonth();
    return this.progressService.getCalendar(getUserId(req), y, m);
  }

  @Get('learning')
  getLearning(@Req() req: Request) {
    return this.progressService.getLearningMap(getUserId(req));
  }

  @Get('review')
  getReview(@Req() req: Request) {
    return this.progressService.getReviewQueue(getUserId(req));
  }

  @Get('stats/categories')
  getCategoryStats(@Req() req: Request) {
    return this.progressService.getCategoryStats(getUserId(req));
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { ProgressService } from './progress.service';

export interface RecordAnswerRequest {
  userId: string;
  chunkId: string;
  isCorrect: boolean;
  date?: string;
}

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('answer')
  async recordAnswer(@Body() body: RecordAnswerRequest) {
    return this.progressService.recordAnswer({
      userId: body.userId,
      chunkId: body.chunkId,
      isCorrect: body.isCorrect,
      date: body.date ? new Date(body.date) : undefined,
    });
  }
}

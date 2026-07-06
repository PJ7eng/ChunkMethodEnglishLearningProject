import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GenerationService } from './generation.service';

export interface CreateGenerationJobRequest {
  category: string;
  difficulty: string;
  batchSize: number;
  triggerReason: string;
}

@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post('jobs')
  async createJob(@Body() body: CreateGenerationJobRequest) {
    return this.generationService.createAndRunJob({
      category: body.category,
      difficulty: body.difficulty,
      batchSize: body.batchSize,
      triggerReason: body.triggerReason,
    });
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

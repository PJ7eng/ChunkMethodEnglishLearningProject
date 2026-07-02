import { Controller, Get, Query } from '@nestjs/common';
import { ContentPoolService } from './content-pool.service';

export interface ChunkResponse {
  id: string;
  phrase: string;
  translation: string;
  pinyin?: string;
  category: string;
  difficulty: string;
  blank: string;
  answer: string;
  options: string[];
  examples: string[];
}

@Controller('chunks')
export class ContentPoolController {
  constructor(private readonly contentPoolService: ContentPoolService) {}

  @Get()
  async getChunks(@Query('category') category?: string): Promise<ChunkResponse[]> {
    return this.contentPoolService.getChunks(category);
  }

  @Get('random')
  async getRandomChunk(@Query('category') category?: string): Promise<ChunkResponse> {
    return this.contentPoolService.getRandomChunk(category);
  }
}

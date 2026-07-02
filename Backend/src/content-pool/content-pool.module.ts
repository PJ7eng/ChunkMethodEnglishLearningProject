import { Module } from '@nestjs/common';
import { ContentPoolController } from './content-pool.controller';
import { ContentPoolService } from './content-pool.service';

@Module({
  controllers: [ContentPoolController],
  providers: [ContentPoolService],
})
export class ContentPoolModule {}

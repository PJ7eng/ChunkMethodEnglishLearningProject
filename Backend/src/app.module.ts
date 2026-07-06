import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ContentPoolModule } from './content-pool/content-pool.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { GenerationModule } from './generation/generation.module';

@Module({
  imports: [PrismaModule, AuthModule, ContentPoolModule, ProgressModule, GenerationModule],
})
export class AppModule {}

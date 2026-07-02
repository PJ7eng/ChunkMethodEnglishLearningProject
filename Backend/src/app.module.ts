import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ContentPoolModule } from './content-pool/content-pool.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, ContentPoolModule],
})
export class AppModule {}

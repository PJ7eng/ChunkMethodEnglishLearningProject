import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ContentPoolModule } from './content-pool/content-pool.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { GenerationModule } from './generation/generation.module';
import { PreferencesModule } from './preferences/preferences.module';
import { NotesModule } from './notes/notes.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';
import { AdminModule } from './admin/admin.module';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ContentPoolModule,
    ProgressModule,
    GenerationModule,
    PreferencesModule,
    NotesModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: Number(process.env.RATE_LIMIT_PER_MINUTE || 120),
      },
    ]),
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}

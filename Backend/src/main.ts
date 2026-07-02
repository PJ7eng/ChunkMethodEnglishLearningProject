import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cors from 'cors';
import { json } from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );

  app.use(json());

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  console.log(`Backend is running on http://localhost:${port}`);
}

bootstrap();

import assert from 'node:assert/strict';
import test from 'node:test';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';

test('accounts cannot read another learner notes', async () => {
  const prisma = new PrismaClient();
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const firstEmail = `e2e-first-${suffix}@example.com`;
  const secondEmail = `e2e-second-${suffix}@example.com`;

  try {
    const first = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: firstEmail, password: 'secure-pass-123', name: 'First' })
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: secondEmail, password: 'secure-pass-123', name: 'Second' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/notes')
      .set('Authorization', `Bearer ${first.body.token}`)
      .send({ english: 'break the ice', translation: '打破僵局', category: 'smalltalk' })
      .expect(201);

    const own = await request(app.getHttpServer())
      .get('/notes')
      .set('Authorization', `Bearer ${first.body.token}`)
      .expect(200);
    const other = await request(app.getHttpServer())
      .get('/notes')
      .set('Authorization', `Bearer ${second.body.token}`)
      .expect(200);

    assert.equal(own.body.length, 1);
    assert.equal(other.body.length, 0);
  } finally {
    await prisma.user.deleteMany({ where: { email: { in: [firstEmail, secondEmail] } } });
    await app.close();
    await prisma.$disconnect();
  }
});

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [users, pending, published, rejected, retired, failedJobs, recentJobs] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.contentPoolItem.count({ where: { status: 'pending_review' } }),
        this.prisma.contentPoolItem.count({ where: { status: 'published' } }),
        this.prisma.contentPoolItem.count({ where: { status: 'rejected' } }),
        this.prisma.contentPoolItem.count({ where: { status: 'retired' } }),
        this.prisma.generationJob.count({ where: { status: 'failed' } }),
        this.prisma.generationJob.findMany({
          take: 10,
          orderBy: { startedAt: 'desc' },
        }),
      ]);
    return { users, pending, published, rejected, retired, failedJobs, recentJobs };
  }

  listContent(status?: ContentStatus, category?: string) {
    return this.prisma.contentPoolItem.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        chunks: { include: { examples: { orderBy: { orderIndex: 'asc' } } } },
        generationJob: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async getContent(id: string) {
    const item = await this.prisma.contentPoolItem.findUnique({
      where: { id },
      include: {
        chunks: { include: { examples: { orderBy: { orderIndex: 'asc' } } } },
        quizzes: true,
        versions: { orderBy: { version: 'desc' } },
        generationJob: true,
      },
    });
    if (!item) throw new NotFoundException('Content not found');
    return item;
  }

  async editChunk(
    itemId: string,
    chunkId: string,
    patch: {
      phrase?: string;
      translation?: string;
      pinyin?: string | null;
      usage?: string;
      register?: string;
      cefr?: string;
      blank?: string;
      answer?: string;
      options?: string[];
      examples?: Array<string | { sentence: string; translation?: string | null }>;
    },
    actorId: string,
  ) {
    const before = await this.getContent(itemId);
    const chunk = before.chunks.find((candidate) => candidate.id === chunkId);
    if (!chunk) throw new NotFoundException('Chunk not found');
    if (!['pending_review', 'rejected', 'draft'].includes(before.status)) {
      throw new BadRequestException('Published content must be retired before editing');
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.chunk.update({
          where: { id: chunkId },
          data: {
            phrase: patch.phrase?.trim(),
            phraseKey: patch.phrase ? this.phraseKey(patch.phrase) : undefined,
            translation: patch.translation?.trim(),
            pinyin: patch.pinyin === null ? null : patch.pinyin?.trim(),
            usage: patch.usage?.trim(),
            register: patch.register?.trim(),
            cefr: patch.cefr?.trim().toUpperCase(),
            blank: patch.blank?.trim(),
            answer: patch.answer?.trim(),
            options: patch.options?.map((option) => option.trim()).filter(Boolean),
          },
        });
        if (patch.examples) {
          const examples = patch.examples
            .map((example) => typeof example === 'string'
              ? { sentence: example.trim(), translation: null }
              : {
                  sentence: example.sentence.trim(),
                  translation: example.translation?.trim() || null,
                })
            .filter((example) => example.sentence);
          await tx.chunkExample.deleteMany({ where: { chunkId } });
          await tx.chunkExample.createMany({
            data: examples.map((example, orderIndex) => ({ chunkId, orderIndex, ...example })),
          });
        }
        await tx.auditEvent.create({
          data: {
            actorId,
            action: 'content.edit',
            targetType: 'ContentPoolItem',
            targetId: itemId,
            before: this.json(before),
            after: this.json(patch),
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Phrase already exists');
      }
      throw error;
    }
    return this.getContent(itemId);
  }

  async transition(
    id: string,
    action: 'approve' | 'reject' | 'retire' | 'restore',
    actorId: string,
    reason?: string,
  ) {
    const item = await this.getContent(id);
    const allowed: Record<typeof action, ContentStatus[]> = {
      approve: ['pending_review'],
      reject: ['pending_review'],
      retire: ['published'],
      restore: ['retired'],
    };
    if (!allowed[action].includes(item.status)) {
      throw new BadRequestException(`Cannot ${action} content in ${item.status}`);
    }
    if (action === 'approve') this.assertReviewComplete(item);
    const next: Record<typeof action, ContentStatus> = {
      approve: 'published',
      reject: 'rejected',
      retire: 'retired',
      restore: 'published',
    };
    return this.prisma.$transaction(async (tx) => {
      const version = (await tx.contentVersion.count({
        where: { contentPoolItemId: id },
      })) + 1;
      await tx.contentVersion.create({
        data: {
          contentPoolItemId: id,
          version,
          snapshot: this.json(item),
          createdById: actorId,
        },
      });
      const updated = await tx.contentPoolItem.update({
        where: { id },
        data: { status: next[action] },
      });
      await tx.auditEvent.create({
        data: {
          actorId,
          action: `content.${action}`,
          targetType: 'ContentPoolItem',
          targetId: id,
          before: this.json({ status: item.status }),
          after: this.json({ status: updated.status, reason }),
        },
      });
      return updated;
    });
  }

  auditLog() {
    return this.prisma.auditEvent.findMany({
      include: { actor: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private json(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private phraseKey(phrase: string): string {
    return phrase.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private assertReviewComplete(item: Awaited<ReturnType<AdminService['getContent']>>): void {
    if (!item.chunks.length) throw new BadRequestException('Content has no chunks');
    for (const chunk of item.chunks) {
      const options = Array.isArray(chunk.options) ? chunk.options as string[] : [];
      if (
        !chunk.phrase.trim() ||
        !chunk.translation.trim() ||
        !chunk.usage?.trim() ||
        !chunk.register?.trim() ||
        !/^(A1|A2|B1|B2|C1|C2)$/i.test(chunk.cefr?.trim() || '') ||
        !chunk.blank.includes('___') ||
        options.length < 3 ||
        !options.some((option) => option.toLowerCase() === chunk.answer.toLowerCase()) ||
        chunk.examples.length < 2
      ) {
        throw new BadRequestException(`Chunk "${chunk.phrase}" is incomplete`);
      }
    }
  }
}

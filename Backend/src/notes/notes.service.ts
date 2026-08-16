import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const notes = await this.prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return notes.map((n) => ({
      id: n.id,
      english: n.english,
      translation: n.translation,
      category: n.category,
      chunkId: n.chunkId,
      createdAt: n.createdAt.getTime(),
    }));
  }

  async create(
    userId: string,
    data: { english: string; translation: string; category: string; chunkId?: string },
  ) {
    const note = await this.prisma.note.create({
      data: {
        userId,
        english: data.english.trim(),
        translation: data.translation.trim(),
        category: data.category || 'random',
        chunkId: data.chunkId,
      },
    });
    return {
      id: note.id,
      english: note.english,
      translation: note.translation,
      category: note.category,
      chunkId: note.chunkId,
      createdAt: note.createdAt.getTime(),
    };
  }

  async update(
    userId: string,
    id: string,
    data: { english?: string; translation?: string; category?: string },
  ) {
    const existing = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Note not found');

    const note = await this.prisma.note.update({
      where: { id },
      data: {
        english: data.english?.trim(),
        translation: data.translation?.trim(),
        category: data.category,
      },
    });
    return {
      id: note.id,
      english: note.english,
      translation: note.translation,
      category: note.category,
      createdAt: note.createdAt.getTime(),
    };
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Note not found');
    await this.prisma.note.delete({ where: { id } });
    return { success: true };
  }

  async removeMany(userId: string, ids: string[]) {
    await this.prisma.note.deleteMany({
      where: { userId, id: { in: ids } },
    });
    return { success: true, deleted: ids.length };
  }

  async categoryStats(userId: string) {
    const notes = await this.prisma.note.findMany({
      where: { userId },
      select: { category: true },
    });
    const counts = new Map<string, number>();
    for (const n of notes) {
      counts.set(n.category, (counts.get(n.category) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([id, value]) => ({ id, value }));
  }
}

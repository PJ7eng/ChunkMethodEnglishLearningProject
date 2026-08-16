import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdatePreferencesDto {
  dailyGoal?: number;
  soundEnabled?: boolean;
  reminderEnabled?: boolean;
  hapticEnabled?: boolean;
  autoNextEnabled?: boolean;
}

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    let prefs = await this.prisma.userPreference.findUnique({ where: { userId } });
    if (!prefs) {
      prefs = await this.prisma.userPreference.create({ data: { userId } });
    }
    return {
      dailyGoal: prefs.dailyGoal,
      soundEnabled: prefs.soundEnabled,
      reminderEnabled: prefs.reminderEnabled,
      hapticEnabled: prefs.hapticEnabled,
      autoNextEnabled: prefs.autoNextEnabled,
    };
  }

  async update(userId: string, dto: UpdatePreferencesDto) {
    const existing = await this.prisma.userPreference.findUnique({ where: { userId } });
    if (!existing) {
      throw new NotFoundException('Preferences not found');
    }

    const data: UpdatePreferencesDto = {};
    if (dto.dailyGoal !== undefined) {
      data.dailyGoal = Math.min(20, Math.max(1, Math.floor(dto.dailyGoal)));
    }
    if (dto.soundEnabled !== undefined) data.soundEnabled = dto.soundEnabled;
    if (dto.reminderEnabled !== undefined) data.reminderEnabled = dto.reminderEnabled;
    if (dto.hapticEnabled !== undefined) data.hapticEnabled = dto.hapticEnabled;
    if (dto.autoNextEnabled !== undefined) data.autoNextEnabled = dto.autoNextEnabled;

    const prefs = await this.prisma.userPreference.update({
      where: { userId },
      data,
    });

    return {
      dailyGoal: prefs.dailyGoal,
      soundEnabled: prefs.soundEnabled,
      reminderEnabled: prefs.reminderEnabled,
      hapticEnabled: prefs.hapticEnabled,
      autoNextEnabled: prefs.autoNextEnabled,
    };
  }
}

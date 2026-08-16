import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { PreferencesService, UpdatePreferencesDto } from './preferences.service';

function getUserId(req: Request): string {
  const authenticatedRequest = req as Request & { user?: { sub?: string } };
  const userId = authenticatedRequest.user?.sub;
  if (!userId) {
    throw new Error('Missing authenticated user id');
  }
  return userId;
}

@Controller('preferences')
@UseGuards(AuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  get(@Req() req: Request) {
    return this.preferencesService.get(getUserId(req));
  }

  @Patch()
  update(@Req() req: Request, @Body() body: UpdatePreferencesDto) {
    return this.preferencesService.update(getUserId(req), body);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { NotesService } from './notes.service';

function getUserId(req: Request): string {
  const authenticatedRequest = req as Request & { user?: { sub?: string } };
  const userId = authenticatedRequest.user?.sub;
  if (!userId) {
    throw new Error('Missing authenticated user id');
  }
  return userId;
}

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  list(@Req() req: Request) {
    return this.notesService.list(getUserId(req));
  }

  @Get('stats/categories')
  categoryStats(@Req() req: Request) {
    return this.notesService.categoryStats(getUserId(req));
  }

  @Post()
  create(
    @Req() req: Request,
    @Body() body: { english: string; translation: string; category: string; chunkId?: string },
  ) {
    return this.notesService.create(getUserId(req), body);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { english?: string; translation?: string; category?: string },
  ) {
    return this.notesService.update(getUserId(req), id, body);
  }

  @Delete()
  removeMany(@Req() req: Request, @Body() body: { ids: string[] }) {
    return this.notesService.removeMany(getUserId(req), body.ids || []);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.notesService.remove(getUserId(req), id);
  }
}

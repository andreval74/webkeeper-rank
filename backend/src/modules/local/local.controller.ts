import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocalService } from './local.service';
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/local')
export class LocalController {
  constructor(private readonly localService: LocalService) {}
  @Post('audit') runAudit(@Param('projectId') projectId: string) { return this.localService.runAudit(projectId); }
  @Get('latest') latest(@Param('projectId') projectId: string) { return this.localService.latestScore(projectId); }
}

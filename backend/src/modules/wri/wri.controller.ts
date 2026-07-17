import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WriService } from './wri.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/wri')
export class WriController {
  constructor(private readonly wriService: WriService) {}

  @Post('audit')
  runAudit(@Param('projectId') projectId: string) {
    return this.wriService.runAudit(projectId);
  }

  @Get('latest')
  latest(@Param('projectId') projectId: string) {
    return this.wriService.latestScore(projectId);
  }
}

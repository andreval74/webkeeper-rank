import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReputationService } from './reputation.service';
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}
  @Post('audit') runAudit(@Param('projectId') projectId: string) { return this.reputationService.runAudit(projectId); }
  @Get('latest') latest(@Param('projectId') projectId: string) { return this.reputationService.latestScore(projectId); }
}

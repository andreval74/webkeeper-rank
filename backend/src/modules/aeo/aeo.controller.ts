import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AeoService } from './aeo.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/aeo')
export class AeoController {
  constructor(private readonly aeoService: AeoService) {}

  @Post('audit')
  runAudit(@Param('projectId') projectId: string) {
    return this.aeoService.runAudit(projectId);
  }

  @Get('latest')
  latest(@Param('projectId') projectId: string) {
    return this.aeoService.latestScore(projectId);
  }
}

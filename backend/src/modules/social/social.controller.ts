import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SocialService } from './social.service';
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}
  @Post('audit') runAudit(@Param('projectId') projectId: string) { return this.socialService.runAudit(projectId); }
  @Get('latest') latest(@Param('projectId') projectId: string) { return this.socialService.latestScore(projectId); }
}

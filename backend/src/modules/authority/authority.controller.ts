import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthorityService } from './authority.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/authority')
export class AuthorityController {
  constructor(private readonly authorityService: AuthorityService) {}

  @Post('audit')
  runAudit(@Param('projectId') projectId: string) {
    return this.authorityService.runAudit(projectId);
  }

  @Get('latest')
  latest(@Param('projectId') projectId: string) {
    return this.authorityService.latestScore(projectId);
  }
}

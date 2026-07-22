import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UxService } from './ux.service';
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/ux')
export class UxController {
  constructor(private readonly uxService: UxService) {}
  @Post('audit') runAudit(@Param('projectId') projectId: string) { return this.uxService.runAudit(projectId); }
  @Get('latest') latest(@Param('projectId') projectId: string) { return this.uxService.latestScore(projectId); }
}

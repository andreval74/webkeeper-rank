import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GeoService } from './geo.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Post('audit')
  runAudit(@Param('projectId') projectId: string) {
    return this.geoService.runAudit(projectId);
  }

  @Get('latest')
  latest(@Param('projectId') projectId: string) {
    return this.geoService.latestScore(projectId);
  }
}

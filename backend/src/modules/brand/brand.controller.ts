import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BrandService } from './brand.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post('audit')
  runAudit(@Param('projectId') projectId: string) {
    return this.brandService.runAudit(projectId);
  }

  @Get('latest')
  latest(@Param('projectId') projectId: string) {
    return this.brandService.latestScore(projectId);
  }
}

import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversionService } from './conversion.service';
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/conversion')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}
  @Post('audit') runAudit(@Param('projectId') projectId: string) { return this.conversionService.runAudit(projectId); }
  @Get('latest') latest(@Param('projectId') projectId: string) { return this.conversionService.latestScore(projectId); }
}

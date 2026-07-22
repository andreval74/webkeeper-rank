import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { runDeterministicSocialAudit } from './social-audit.util';
@UseGuards(ThrottlerGuard)
@Controller('public/social-check')
export class PublicSocialController {
  @Post()
  async check(@Body() dto: any) {
    if (!dto.domain || dto.domain.includes('localhost')) throw new BadRequestException('Domínio inválido');
    return runDeterministicSocialAudit(dto.domain);
  }
}

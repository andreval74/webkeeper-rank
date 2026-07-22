import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { runDeterministicLocalAudit } from './local-audit.util';
@UseGuards(ThrottlerGuard)
@Controller('public/local-check')
export class PublicLocalController {
  @Post()
  async check(@Body() dto: any) {
    if (!dto.domain || dto.domain.includes('localhost')) throw new BadRequestException('Domínio inválido');
    return runDeterministicLocalAudit(dto.domain);
  }
}

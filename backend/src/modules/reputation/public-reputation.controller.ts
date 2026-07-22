import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { runDeterministicReputationAudit } from './reputation-audit.util';
class Dto { domain: string; }
@UseGuards(ThrottlerGuard)
@Controller('public/reputation-check')
export class PublicReputationController {
  @Post()
  async check(@Body() dto: Dto) {
    if (!dto.domain || dto.domain.includes('localhost')) throw new BadRequestException('Domínio inválido');
    return runDeterministicReputationAudit(dto.domain);
  }
}

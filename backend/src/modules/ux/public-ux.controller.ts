import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { runDeterministicUxAudit } from './ux-audit.util';
class CheckDomainDto { domain: string; }
@UseGuards(ThrottlerGuard)
@Controller('public/ux-check')
export class PublicUxController {
  @Post()
  async check(@Body() dto: CheckDomainDto) {
    if (!dto.domain || dto.domain.includes('localhost') || dto.domain.startsWith('127.')) throw new BadRequestException('Domínio inválido');
    return runDeterministicUxAudit(dto.domain);
  }
}

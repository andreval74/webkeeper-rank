import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { runDeterministicConversionAudit } from './conversion-audit.util';
@UseGuards(ThrottlerGuard)
@Controller('public/conversion-check')
export class PublicConversionController {
  @Post()
  async check(@Body() dto: any) {
    if (!dto.domain || dto.domain.includes('localhost')) throw new BadRequestException('Domínio inválido');
    return runDeterministicConversionAudit(dto.domain);
  }
}

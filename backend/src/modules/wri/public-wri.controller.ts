import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CheckDomainDto } from './dto/check-domain.dto';
import { isPubliclyRoutableHostname } from './public-domain-guard.util';
import { runDeterministicAudit } from './wri-audit.util';

@UseGuards(ThrottlerGuard)
@Controller('public/wri-check')
export class PublicWriController {
  @Post()
  async check(@Body() dto: CheckDomainDto) {
    if (!isPubliclyRoutableHostname(dto.domain)) {
      throw new BadRequestException('Domínio inválido para checagem pública');
    }
    return runDeterministicAudit(dto.domain);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicConversionAudit } from './conversion-audit.util';
@Injectable()
export class ConversionService {
  constructor(private readonly prisma: PrismaService) {}
  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    const audit = await runDeterministicConversionAudit(project.domain);
    await this.prisma.$transaction([this.prisma.metric.createMany({ data: audit.checks.map((c) => ({ projectId, category: c.category, key: c.key, value: c.value })) }), this.prisma.conversionScore.create({ data: { projectId, category: 'CONVERSION', score: audit.score, breakdown: audit.checks as any } })]);
    return audit;
  }
  async latestScore(projectId: string) { return this.prisma.conversionScore.findFirst({ where: { projectId, category: 'CONVERSION' }, orderBy: { createdAt: 'desc' } }); }
}

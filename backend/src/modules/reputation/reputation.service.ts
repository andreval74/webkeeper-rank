import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicReputationAudit } from './reputation-audit.util';
@Injectable()
export class ReputationService {
  constructor(private readonly prisma: PrismaService) {}
  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    const audit = await runDeterministicReputationAudit(project.domain);
    await this.prisma.$transaction([
      this.prisma.metric.createMany({ data: audit.checks.map((c) => ({ projectId, category: c.category, key: c.key, value: c.value })) }),
      this.prisma.reputationScore.create({ data: { projectId, category: 'REPUTATION', score: audit.score, breakdown: audit.checks as any } }),
    ]);
    return audit;
  }
  async latestScore(projectId: string) {
    return this.prisma.reputationScore.findFirst({ where: { projectId, category: 'REPUTATION' }, orderBy: { createdAt: 'desc' } });
  }
}

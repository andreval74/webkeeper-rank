import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicLocalAudit } from './local-audit.util';
@Injectable()
export class LocalService {
  constructor(private readonly prisma: PrismaService) {}
  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    const audit = await runDeterministicLocalAudit(project.domain);
    await this.prisma.$transaction([this.prisma.metric.createMany({ data: audit.checks.map((c) => ({ projectId, category: c.category, key: c.key, value: c.value })) }), this.prisma.localScore.create({ data: { projectId, category: 'LOCAL', score: audit.score, breakdown: audit.checks as any } })]);
    return audit;
  }
  async latestScore(projectId: string) { return this.prisma.localScore.findFirst({ where: { projectId, category: 'LOCAL' }, orderBy: { createdAt: 'desc' } }); }
}

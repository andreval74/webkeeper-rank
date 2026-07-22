import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicSocialAudit } from './social-audit.util';
@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}
  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    const audit = await runDeterministicSocialAudit(project.domain);
    await this.prisma.$transaction([this.prisma.metric.createMany({ data: audit.checks.map((c) => ({ projectId, category: c.category, key: c.key, value: c.value })) }), this.prisma.socialScore.create({ data: { projectId, category: 'SOCIAL', score: audit.score, breakdown: audit.checks as any } })]);
    return audit;
  }
  async latestScore(projectId: string) { return this.prisma.socialScore.findFirst({ where: { projectId, category: 'SOCIAL' }, orderBy: { createdAt: 'desc' } }); }
}

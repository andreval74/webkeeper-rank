import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicAuthorityAudit } from './authority-audit.util';

@Injectable()
export class AuthorityService {
  constructor(private readonly prisma: PrismaService) {}

  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const audit = await runDeterministicAuthorityAudit(project.domain);

    await this.prisma.$transaction([
      this.prisma.metric.createMany({
        data: audit.checks.map((check) => ({
          projectId,
          category: check.category,
          key: check.key,
          value: check.value,
        })),
      }),
      this.prisma.authorityScore.create({
        data: {
          projectId,
          category: 'AUTHORITY',
          score: audit.score,
          breakdown: audit.checks as unknown as object,
        },
      }),
    ]);

    return audit;
  }

  async latestScore(projectId: string) {
    return this.prisma.authorityScore.findFirst({
      where: { projectId, category: 'AUTHORITY' },
      orderBy: { createdAt: 'desc' },
    });
  }
}

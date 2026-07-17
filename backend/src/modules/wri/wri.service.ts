import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicAudit } from './wri-audit.util';

@Injectable()
export class WriService {
  constructor(private readonly prisma: PrismaService) {}

  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const audit = await runDeterministicAudit(project.domain);

    await this.prisma.$transaction([
      this.prisma.metric.createMany({
        data: audit.checks.map((check) => ({
          projectId,
          category: check.category,
          key: check.key,
          value: check.value,
        })),
      }),
      this.prisma.wriScore.create({
        data: {
          projectId,
          score: audit.score,
          breakdown: audit.checks as unknown as object,
        },
      }),
    ]);

    return audit;
  }

  async latestScore(projectId: string) {
    return this.prisma.wriScore.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

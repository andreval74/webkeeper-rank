import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicAeoAudit } from './aeo-audit.util';

@Injectable()
export class AeoService {
  constructor(private readonly prisma: PrismaService) {}

  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const audit = await runDeterministicAeoAudit(project.domain);

    await this.prisma.$transaction([
      this.prisma.metric.createMany({
        data: audit.checks.map((check) => ({
          projectId,
          category: check.category,
          key: check.key,
          value: check.value,
        })),
      }),
      this.prisma.aeoScore.create({
        data: {
          projectId,
          category: 'AEO',
          score: audit.score,
          breakdown: audit.checks as unknown as object,
        },
      }),
    ]);

    return audit;
  }

  async latestScore(projectId: string) {
    return this.prisma.aeoScore.findFirst({
      where: { projectId, category: 'AEO' },
      orderBy: { createdAt: 'desc' },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicBrandAudit } from './brand-audit.util';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const audit = await runDeterministicBrandAudit(project.domain);

    await this.prisma.$transaction([
      this.prisma.metric.createMany({
        data: audit.checks.map((check) => ({
          projectId,
          category: check.category,
          key: check.key,
          value: check.value,
        })),
      }),
      this.prisma.brandScore.create({
        data: {
          projectId,
          category: 'BRAND',
          score: audit.score,
          breakdown: audit.checks as unknown as object,
        },
      }),
    ]);

    return audit;
  }

  async latestScore(projectId: string) {
    return this.prisma.brandScore.findFirst({
      where: { projectId, category: 'BRAND' },
      orderBy: { createdAt: 'desc' },
    });
  }
}

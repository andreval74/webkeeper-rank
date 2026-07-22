import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicGeoAudit } from './geo-audit.util';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async runAudit(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const audit = await runDeterministicGeoAudit(project.domain);

    await this.prisma.$transaction([
      this.prisma.metric.createMany({
        data: audit.checks.map((check) => ({
          projectId,
          category: check.category,
          key: check.key,
          value: check.value,
        })),
      }),
      this.prisma.geoScore.create({
        data: {
          projectId,
          category: 'GEO',
          score: audit.score,
          breakdown: audit.checks as unknown as object,
        },
      }),
    ]);

    return audit;
  }

  async latestScore(projectId: string) {
    return this.prisma.geoScore.findFirst({
      where: { projectId, category: 'GEO' },
      orderBy: { createdAt: 'desc' },
    });
  }
}

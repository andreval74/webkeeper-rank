import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicGeoAudit } from './geo-audit.util';
import { GeoService } from './geo.service';

jest.mock('./geo-audit.util');

describe('GeoService', () => {
  const mockPrisma = {
    project: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    metric: { createMany: jest.fn() },
    geoScore: { create: jest.fn(), findFirst: jest.fn() },
  };
  let service: GeoService;

  const mockedRunAudit = runDeterministicGeoAudit as jest.MockedFunction<typeof runDeterministicGeoAudit>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockResolvedValue([]);
    service = new GeoService(mockPrisma as unknown as PrismaService);
  });

  describe('runAudit', () => {
    it('should run deterministic audit and persist metrics + score', async () => {
      const projectId = 'p1';
      mockPrisma.project.findUnique.mockResolvedValue({ id: projectId, domain: 'acme.com' });
      const audit = {
        domain: 'acme.com',
        score: 75,
        checks: [{ category: 'GEO' as const, key: 'schema_org_completeness', value: 1, weight: 12.5 }],
      };
      mockedRunAudit.mockResolvedValue(audit);

      const result = await service.runAudit(projectId);

      expect(mockedRunAudit).toHaveBeenCalledWith('acme.com');
      expect(mockPrisma.metric.createMany).toHaveBeenCalledWith({
        data: [{ projectId, category: 'GEO', key: 'schema_org_completeness', value: 1 }],
      });
      expect(mockPrisma.geoScore.create).toHaveBeenCalledWith({
        data: { projectId, category: 'GEO', score: 75, breakdown: audit.checks },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toBe(audit);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.runAudit('missing')).rejects.toThrow(NotFoundException);
      expect(mockedRunAudit).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('latestScore', () => {
    it('should fetch the most recent GEO score for the project', async () => {
      const projectId = 'p1';
      const score = { id: 's1', projectId, category: 'GEO', score: 75 };

      mockPrisma.geoScore.findFirst.mockResolvedValue(score);

      const result = await service.latestScore(projectId);

      expect(mockPrisma.geoScore.findFirst).toHaveBeenCalledWith({
        where: { projectId, category: 'GEO' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(score);
    });

    it('should return null when no score exists', async () => {
      const projectId = 'p1';

      mockPrisma.geoScore.findFirst.mockResolvedValue(null);

      const result = await service.latestScore(projectId);

      expect(result).toBeNull();
    });
  });
});

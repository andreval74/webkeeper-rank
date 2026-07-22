import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicBrandAudit } from './brand-audit.util';
import { BrandService } from './brand.service';

jest.mock('./brand-audit.util');

describe('BrandService', () => {
  const mockPrisma = {
    project: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    metric: { createMany: jest.fn() },
    brandScore: { create: jest.fn(), findFirst: jest.fn() },
  };
  let service: BrandService;

  const mockedRunAudit = runDeterministicBrandAudit as jest.MockedFunction<typeof runDeterministicBrandAudit>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockResolvedValue([]);
    service = new BrandService(mockPrisma as unknown as PrismaService);
  });

  describe('runAudit', () => {
    it('should run deterministic audit and persist metrics + score', async () => {
      const projectId = 'p1';
      mockPrisma.project.findUnique.mockResolvedValue({ id: projectId, domain: 'acme.com' });
      const audit = {
        domain: 'acme.com',
        score: 75,
        checks: [{ category: 'BRAND' as const, key: 'brand_consistency', value: 1, weight: 12.5 }],
      };
      mockedRunAudit.mockResolvedValue(audit);

      const result = await service.runAudit(projectId);

      expect(mockedRunAudit).toHaveBeenCalledWith('acme.com');
      expect(mockPrisma.metric.createMany).toHaveBeenCalledWith({
        data: [{ projectId, category: 'BRAND', key: 'brand_consistency', value: 1 }],
      });
      expect(mockPrisma.brandScore.create).toHaveBeenCalledWith({
        data: { projectId, category: 'BRAND', score: 75, breakdown: audit.checks },
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
    it('should fetch the most recent BRAND score for the project', async () => {
      const projectId = 'p1';
      const score = { id: 's1', projectId, category: 'BRAND', score: 75 };

      mockPrisma.brandScore.findFirst.mockResolvedValue(score);

      const result = await service.latestScore(projectId);

      expect(mockPrisma.brandScore.findFirst).toHaveBeenCalledWith({
        where: { projectId, category: 'BRAND' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(score);
    });

    it('should return null when no score exists', async () => {
      const projectId = 'p1';

      mockPrisma.brandScore.findFirst.mockResolvedValue(null);

      const result = await service.latestScore(projectId);

      expect(result).toBeNull();
    });
  });
});

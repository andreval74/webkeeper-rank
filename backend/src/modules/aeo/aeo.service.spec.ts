import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicAeoAudit } from './aeo-audit.util';
import { AeoService } from './aeo.service';

jest.mock('./aeo-audit.util');

describe('AeoService', () => {
  const mockPrisma = {
    project: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    metric: { createMany: jest.fn() },
    aeoScore: { create: jest.fn(), findFirst: jest.fn() },
  };
  let service: AeoService;

  const mockedRunAudit = runDeterministicAeoAudit as jest.MockedFunction<typeof runDeterministicAeoAudit>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockResolvedValue([]);
    service = new AeoService(mockPrisma as unknown as PrismaService);
  });

  describe('runAudit', () => {
    it('should run deterministic audit and persist metrics + score', async () => {
      const projectId = 'p1';
      mockPrisma.project.findUnique.mockResolvedValue({ id: projectId, domain: 'acme.com' });
      const audit = {
        domain: 'acme.com',
        score: 75,
        checks: [{ category: 'AEO' as const, key: 'snippet_optimization', value: 1, weight: 12.5 }],
      };
      mockedRunAudit.mockResolvedValue(audit);

      const result = await service.runAudit(projectId);

      expect(mockedRunAudit).toHaveBeenCalledWith('acme.com');
      expect(mockPrisma.metric.createMany).toHaveBeenCalledWith({
        data: [{ projectId, category: 'AEO', key: 'snippet_optimization', value: 1 }],
      });
      expect(mockPrisma.aeoScore.create).toHaveBeenCalledWith({
        data: { projectId, category: 'AEO', score: 75, breakdown: audit.checks },
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
    it('should fetch the most recent AEO score for the project', async () => {
      const projectId = 'p1';
      const score = { id: 's1', projectId, category: 'AEO', score: 75 };

      mockPrisma.aeoScore.findFirst.mockResolvedValue(score);

      const result = await service.latestScore(projectId);

      expect(mockPrisma.aeoScore.findFirst).toHaveBeenCalledWith({
        where: { projectId, category: 'AEO' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(score);
    });

    it('should return null when no score exists', async () => {
      const projectId = 'p1';

      mockPrisma.aeoScore.findFirst.mockResolvedValue(null);

      const result = await service.latestScore(projectId);

      expect(result).toBeNull();
    });
  });
});

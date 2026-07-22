import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicAuthorityAudit } from './authority-audit.util';
import { AuthorityService } from './authority.service';

jest.mock('./authority-audit.util');

describe('AuthorityService', () => {
  const mockPrisma = {
    project: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    metric: { createMany: jest.fn() },
    authorityScore: { create: jest.fn(), findFirst: jest.fn() },
  };
  let service: AuthorityService;

  const mockedRunAudit = runDeterministicAuthorityAudit as jest.MockedFunction<typeof runDeterministicAuthorityAudit>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockResolvedValue([]);
    service = new AuthorityService(mockPrisma as unknown as PrismaService);
  });

  describe('runAudit', () => {
    it('should run deterministic audit and persist metrics + score', async () => {
      const projectId = 'p1';
      mockPrisma.project.findUnique.mockResolvedValue({ id: projectId, domain: 'acme.com' });
      const audit = {
        domain: 'acme.com',
        score: 75,
        checks: [{ category: 'AUTHORITY' as const, key: 'security_certificate', value: 1, weight: 12.5 }],
      };
      mockedRunAudit.mockResolvedValue(audit);

      const result = await service.runAudit(projectId);

      expect(mockedRunAudit).toHaveBeenCalledWith('acme.com');
      expect(mockPrisma.metric.createMany).toHaveBeenCalled();
      expect(mockPrisma.authorityScore.create).toHaveBeenCalled();
      expect(result).toBe(audit);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.runAudit('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('latestScore', () => {
    it('should fetch the most recent AUTHORITY score', async () => {
      const projectId = 'p1';
      const score = { id: 's1', projectId, category: 'AUTHORITY', score: 75 };

      mockPrisma.authorityScore.findFirst.mockResolvedValue(score);

      const result = await service.latestScore(projectId);

      expect(mockPrisma.authorityScore.findFirst).toHaveBeenCalled();
      expect(result).toEqual(score);
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { runDeterministicReputationAudit } from './reputation-audit.util';
import { ReputationService } from './reputation.service';
jest.mock('./reputation-audit.util');
describe('ReputationService', () => {
  const mockPrisma = { project: { findUnique: jest.fn() }, $transaction: jest.fn(), metric: { createMany: jest.fn() }, reputationScore: { create: jest.fn(), findFirst: jest.fn() } };
  let service: ReputationService;
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockResolvedValue([]);
    service = new ReputationService(mockPrisma as any);
  });
  it('should run audit', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1', domain: 'a.com' });
    (runDeterministicReputationAudit as any).mockResolvedValue({ domain: 'a.com', score: 75, checks: [{ category: 'REPUTATION', key: 'reviews_present', value: 1, weight: 12.5 }] });
    const result = await service.runAudit('p1');
    expect(result.score).toBe(75);
  });
  it('should throw on missing project', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);
    await expect(service.runAudit('missing')).rejects.toThrow(NotFoundException);
  });
});

import { NotFoundException } from '@nestjs/common';
import { runDeterministicUxAudit } from './ux-audit.util';
import { UxService } from './ux.service';
jest.mock('./ux-audit.util');
describe('UxService', () => {
  const mockPrisma = { project: { findUnique: jest.fn() }, $transaction: jest.fn(), metric: { createMany: jest.fn() }, uxScore: { create: jest.fn(), findFirst: jest.fn() } };
  let service: UxService;
  const mockedRunAudit = runDeterministicUxAudit as jest.MockedFunction<typeof runDeterministicUxAudit>;
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockResolvedValue([]);
    service = new UxService(mockPrisma as any);
  });
  it('should run audit', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1', domain: 'a.com' });
    mockedRunAudit.mockResolvedValue({ domain: 'a.com', score: 75, checks: [{ category: 'UX' as const, key: 'mobile_responsive', value: 1, weight: 12.5 }] });
    const result = await service.runAudit('p1');
    expect(result.score).toBe(75);
  });
  it('should throw on missing project', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);
    await expect(service.runAudit('missing')).rejects.toThrow(NotFoundException);
  });
});

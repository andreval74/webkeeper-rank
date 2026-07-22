import { runDeterministicLocalAudit } from './local-audit.util';
import { LocalService } from './local.service';
jest.mock('./local-audit.util');
describe('LocalService', () => {
  const mockPrisma = { project: { findUnique: jest.fn() }, $transaction: jest.fn(), metric: { createMany: jest.fn() }, localScore: { create: jest.fn(), findFirst: jest.fn() } };
  let service: LocalService;
  beforeEach(() => { jest.clearAllMocks(); mockPrisma.$transaction.mockResolvedValue([]); service = new LocalService(mockPrisma as any); });
  it('should run audit', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1', domain: 'a.com' });
    (runDeterministicLocalAudit as any).mockResolvedValue({ domain: 'a.com', score: 75, checks: [{ category: 'LOCAL', key: 'google_business', value: 1, weight: 12.5 }] });
    const result = await service.runAudit('p1');
    expect(result.score).toBe(75);
  });
});

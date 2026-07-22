import { runDeterministicSocialAudit } from './social-audit.util';
import { SocialService } from './social.service';
jest.mock('./social-audit.util');
describe('SocialService', () => {
  const mockPrisma = { project: { findUnique: jest.fn() }, $transaction: jest.fn(), metric: { createMany: jest.fn() }, socialScore: { create: jest.fn(), findFirst: jest.fn() } };
  let service: SocialService;
  beforeEach(() => { jest.clearAllMocks(); mockPrisma.$transaction.mockResolvedValue([]); service = new SocialService(mockPrisma as any); });
  it('should run audit', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1', domain: 'a.com' });
    (runDeterministicSocialAudit as any).mockResolvedValue({ domain: 'a.com', score: 75, checks: [{ category: 'SOCIAL', key: 'facebook_presence', value: 1, weight: 12.5 }] });
    const result = await service.runAudit('p1');
    expect(result.score).toBe(75);
  });
});

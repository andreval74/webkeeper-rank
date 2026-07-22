import { runDeterministicConversionAudit } from './conversion-audit.util';
import { ConversionService } from './conversion.service';
jest.mock('./conversion-audit.util');
describe('ConversionService', () => {
  const mockPrisma = { project: { findUnique: jest.fn() }, $transaction: jest.fn(), metric: { createMany: jest.fn() }, conversionScore: { create: jest.fn(), findFirst: jest.fn() } };
  let service: ConversionService;
  beforeEach(() => { jest.clearAllMocks(); mockPrisma.$transaction.mockResolvedValue([]); service = new ConversionService(mockPrisma as any); });
  it('should run audit', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1', domain: 'a.com' });
    (runDeterministicConversionAudit as any).mockResolvedValue({ domain: 'a.com', score: 75, checks: [{ category: 'CONVERSION', key: 'cta_buttons', value: 1, weight: 12.5 }] });
    const result = await service.runAudit('p1');
    expect(result.score).toBe(75);
  });
});

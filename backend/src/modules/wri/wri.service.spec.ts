import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { runDeterministicAudit } from './wri-audit.util';
import { WriService } from './wri.service';

jest.mock('./wri-audit.util');
const mockedRunAudit = runDeterministicAudit as jest.MockedFunction<typeof runDeterministicAudit>;

describe('WriService', () => {
  const mockPrisma = {
    project: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    metric: { createMany: jest.fn() },
    wriScore: { create: jest.fn(), findFirst: jest.fn() },
  };
  let service: WriService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockResolvedValue([]);
    service = new WriService(mockPrisma as unknown as PrismaService);
  });

  it('runAudit runs the deterministic audit and persists metrics + score', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1', domain: 'acme.com' });
    const audit = {
      domain: 'acme.com',
      score: 70,
      checks: [{ category: 'Security' as const, key: 'https', value: 1, weight: 30 }],
    };
    mockedRunAudit.mockResolvedValue(audit);

    const result = await service.runAudit('p1');

    expect(mockedRunAudit).toHaveBeenCalledWith('acme.com');
    expect(mockPrisma.metric.createMany).toHaveBeenCalledWith({
      data: [{ projectId: 'p1', category: 'Security', key: 'https', value: 1 }],
    });
    expect(mockPrisma.wriScore.create).toHaveBeenCalledWith({
      data: { projectId: 'p1', score: 70, breakdown: audit.checks },
    });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toBe(audit);
  });

  it('runAudit throws NotFoundException when the project does not exist', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);

    await expect(service.runAudit('missing')).rejects.toThrow(NotFoundException);
    expect(mockedRunAudit).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('latestScore queries the most recent WriScore for the project', async () => {
    mockPrisma.wriScore.findFirst.mockResolvedValue({ id: 's1', projectId: 'p1', score: 70 });

    await service.latestScore('p1');

    expect(mockPrisma.wriScore.findFirst).toHaveBeenCalledWith({
      where: { projectId: 'p1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});

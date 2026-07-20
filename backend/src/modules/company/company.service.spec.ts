import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  const mockPrisma = {
    company: { create: jest.fn(), findMany: jest.fn() },
    companyMember: { findUnique: jest.fn() },
    project: { create: jest.fn() },
  };
  let service: CompanyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CompanyService(mockPrisma as unknown as PrismaService);
  });

  it('createCompany creates the company with the user as owner member', async () => {
    mockPrisma.company.create.mockResolvedValue({ id: 'c1', name: 'Acme' });

    const result = await service.createCompany('u1', { name: 'Acme' });

    expect(mockPrisma.company.create).toHaveBeenCalledWith({
      data: { name: 'Acme', members: { create: { userId: 'u1', role: 'owner' } } },
    });
    expect(result).toEqual({ id: 'c1', name: 'Acme' });
  });

  it('listCompaniesForUser queries by membership and includes projects', async () => {
    mockPrisma.company.findMany.mockResolvedValue([{ id: 'c1', name: 'Acme', projects: [] }]);

    await service.listCompaniesForUser('u1');

    expect(mockPrisma.company.findMany).toHaveBeenCalledWith({
      where: { members: { some: { userId: 'u1' } } },
      include: { projects: true },
    });
  });

  it('createProject creates the project when membership exists', async () => {
    mockPrisma.companyMember.findUnique.mockResolvedValue({ id: 'm1', userId: 'u1', companyId: 'c1' });
    mockPrisma.project.create.mockResolvedValue({ id: 'p1', domain: 'acme.com', companyId: 'c1' });

    const result = await service.createProject('u1', { companyId: 'c1', domain: 'acme.com' });

    expect(mockPrisma.companyMember.findUnique).toHaveBeenCalledWith({
      where: { userId_companyId: { userId: 'u1', companyId: 'c1' } },
    });
    expect(mockPrisma.project.create).toHaveBeenCalledWith({
      data: { domain: 'acme.com', companyId: 'c1' },
    });
    expect(result.id).toBe('p1');
  });

  it('createProject throws NotFoundException when membership does not exist', async () => {
    mockPrisma.companyMember.findUnique.mockResolvedValue(null);

    await expect(
      service.createProject('u1', { companyId: 'c1', domain: 'acme.com' }),
    ).rejects.toThrow(NotFoundException);
    expect(mockPrisma.project.create).not.toHaveBeenCalled();
  });
});

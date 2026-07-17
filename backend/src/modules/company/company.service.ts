import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(userId: string, dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: dto.name,
        members: { create: { userId, role: 'owner' } },
      },
    });
  }

  async listCompaniesForUser(userId: string) {
    return this.prisma.company.findMany({
      where: { members: { some: { userId } } },
      include: { projects: true },
    });
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    const membership = await this.prisma.companyMember.findUnique({
      where: { userId_companyId: { userId, companyId: dto.companyId } },
    });
    if (!membership) {
      throw new NotFoundException('Empresa não encontrada para este usuário');
    }

    return this.prisma.project.create({
      data: { domain: dto.domain, companyId: dto.companyId },
    });
  }
}

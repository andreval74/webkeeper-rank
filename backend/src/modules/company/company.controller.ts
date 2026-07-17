import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateProjectDto } from './dto/create-project.dto';

interface AuthenticatedRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCompanyDto) {
    return this.companyService.createCompany(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.companyService.listCompaniesForUser(req.user.userId);
  }

  @Post('projects')
  createProject(@Req() req: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    return this.companyService.createProject(req.user.userId, dto);
  }
}

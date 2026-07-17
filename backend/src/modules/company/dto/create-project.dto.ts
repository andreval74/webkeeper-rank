import { IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  companyId!: string;

  @IsString()
  domain!: string;
}

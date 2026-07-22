import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { PublicBrandController } from './public-brand.controller';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [BrandController, PublicBrandController],
  providers: [BrandService, ThrottlerGuard],
})
export class BrandModule {}

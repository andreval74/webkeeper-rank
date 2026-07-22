import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { WriModule } from './modules/wri/wri.module';
import { GeoModule } from './modules/geo/geo.module';
import { AeoModule } from './modules/aeo/aeo.module';
import { BrandModule } from './modules/brand/brand.module';
import { AuthorityModule } from './modules/authority/authority.module';
import { UxModule } from './modules/ux/ux.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { SocialModule } from './modules/social/social.module';
import { LocalModule } from './modules/local/local.module';
import { ConversionModule } from './modules/conversion/conversion.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompanyModule,
    WriModule,
    GeoModule,
    AeoModule,
    BrandModule,
    AuthorityModule,
    UxModule,
    ReputationModule,
    SocialModule,
    LocalModule,
    ConversionModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

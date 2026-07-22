import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { WriModule } from './modules/wri/wri.module';
import { GeoModule } from './modules/geo/geo.module';
import { AeoModule } from './modules/aeo/aeo.module';
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
  ],
  controllers: [AppController],
})
export class AppModule {}

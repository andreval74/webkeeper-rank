import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { GeoService } from './geo.service';
import { GeoController } from './geo.controller';
import { PublicGeoController } from './public-geo.controller';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [GeoController, PublicGeoController],
  providers: [GeoService, ThrottlerGuard],
})
export class GeoModule {}

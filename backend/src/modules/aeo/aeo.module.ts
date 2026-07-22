import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { AeoService } from './aeo.service';
import { AeoController } from './aeo.controller';
import { PublicAeoController } from './public-aeo.controller';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [AeoController, PublicAeoController],
  providers: [AeoService, ThrottlerGuard],
})
export class AeoModule {}

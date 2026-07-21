import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { WriService } from './wri.service';
import { WriController } from './wri.controller';
import { PublicWriController } from './public-wri.controller';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [WriController, PublicWriController],
  providers: [WriService, ThrottlerGuard],
})
export class WriModule {}

import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { PublicReputationController } from './public-reputation.controller';
@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [ReputationController, PublicReputationController],
  providers: [ReputationService, ThrottlerGuard],
})
export class ReputationModule {}

import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { LocalService } from './local.service';
import { LocalController } from './local.controller';
import { PublicLocalController } from './public-local.controller';
@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [LocalController, PublicLocalController],
  providers: [LocalService, ThrottlerGuard],
})
export class LocalModule {}

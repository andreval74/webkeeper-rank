import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { UxService } from './ux.service';
import { UxController } from './ux.controller';
import { PublicUxController } from './public-ux.controller';
@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [UxController, PublicUxController],
  providers: [UxService, ThrottlerGuard],
})
export class UxModule {}

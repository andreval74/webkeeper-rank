import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { PublicSocialController } from './public-social.controller';
@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [SocialController, PublicSocialController],
  providers: [SocialService, ThrottlerGuard],
})
export class SocialModule {}

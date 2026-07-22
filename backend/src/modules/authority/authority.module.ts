import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { AuthorityService } from './authority.service';
import { AuthorityController } from './authority.controller';
import { PublicAuthorityController } from './public-authority.controller';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [AuthorityController, PublicAuthorityController],
  providers: [AuthorityService, ThrottlerGuard],
})
export class AuthorityModule {}

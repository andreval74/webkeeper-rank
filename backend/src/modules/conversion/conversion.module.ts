import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { ConversionService } from './conversion.service';
import { ConversionController } from './conversion.controller';
import { PublicConversionController } from './public-conversion.controller';
@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [ConversionController, PublicConversionController],
  providers: [ConversionService, ThrottlerGuard],
})
export class ConversionModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WriService } from './wri.service';
import { WriController } from './wri.controller';

@Module({
  imports: [AuthModule],
  controllers: [WriController],
  providers: [WriService],
})
export class WriModule {}

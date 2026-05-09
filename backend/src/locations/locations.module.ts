import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';

@Module({
  imports: [AuthModule],
  providers: [LocationsService],
  controllers: [LocationsController],
})
export class LocationsModule {}

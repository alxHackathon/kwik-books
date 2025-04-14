import { Module } from '@nestjs/common';
import { FloorplansController } from './floorplans.controller';
import { FloorplansService } from './floorplans.service';

@Module({
  controllers: [FloorplansController],
  providers: [FloorplansService]
})
export class FloorplansModule {}

import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';

@Module({
  controllers: [SpacesController],
  providers: [SpacesService]
})
export class SpacesModule {}

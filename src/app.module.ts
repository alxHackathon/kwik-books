import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { FloorplansModule } from './modules/floorplans/floorplans.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';

@Module({
  imports: [WorkspacesModule, FloorplansModule, SpacesModule, BookingsModule, OrganisationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

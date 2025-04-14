import { Test, TestingModule } from '@nestjs/testing';
import { FloorplansController } from './floorplans.controller';

describe('FloorplansController', () => {
  let controller: FloorplansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FloorplansController],
    }).compile();

    controller = module.get<FloorplansController>(FloorplansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

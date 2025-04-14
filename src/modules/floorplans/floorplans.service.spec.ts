import { Test, TestingModule } from '@nestjs/testing';
import { FloorplansService } from './floorplans.service';

describe('FloorplansService', () => {
  let service: FloorplansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FloorplansService],
    }).compile();

    service = module.get<FloorplansService>(FloorplansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

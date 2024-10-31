import { TestBed } from '@angular/core/testing';

import { ArlasMapService } from './arlas-map.service';

describe('ArlasMapService', () => {
  let service: ArlasMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArlasMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

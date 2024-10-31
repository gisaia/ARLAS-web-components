import { TestBed } from '@angular/core/testing';

import { ArlasMaplibreService } from './arlas-maplibre.service';

describe('ArlasMaplibreService', () => {
  let service: ArlasMaplibreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArlasMaplibreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed, waitForAsync } from '@angular/core/testing';

import { ArlasMaplibreService } from './arlas-maplibre.service';

describe('ArlasMaplibreService', () => {
  let service: ArlasMaplibreService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        ArlasMaplibreService
      ]
    });
    service = TestBed.inject(ArlasMaplibreService);
  }));

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

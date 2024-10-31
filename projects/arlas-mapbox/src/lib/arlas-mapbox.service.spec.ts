import { TestBed } from '@angular/core/testing';

import { ArlasMapboxService } from './arlas-mapbox.service';

describe('ArlasMapboxService', () => {
  let service: ArlasMapboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArlasMapboxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

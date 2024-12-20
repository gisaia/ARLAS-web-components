import { TestBed, waitForAsync } from '@angular/core/testing';

import { ArlasMapboxService } from './arlas-mapbox.service';

describe('ArlasMapboxService', () => {
  let service: ArlasMapboxService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        ArlasMapboxService
      ]
    });
    service = TestBed.inject(ArlasMapboxService);
  }));

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { ArlasMapFrameworkService } from './arlas-map-framework.service';

describe('ArlasMapService', () => {
  let service: ArlasMapFrameworkService<any, any, any>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArlasMapFrameworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { ArlasComponentsService } from './arlas-components.service';

describe('ArlasComponentsService', () => {
  let service: ArlasComponentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArlasComponentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader } from '@ngx-translate/core';
import { ArlasMapboxService } from './arlas-mapbox.service';

describe('ArlasMapboxService', () => {
  let service: ArlasMapboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader } })
      ],
      providers: [
        ArlasMapboxService
      ]
    });
    service = TestBed.inject(ArlasMapboxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

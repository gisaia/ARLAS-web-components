import { TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ArlasMapboxService } from './arlas-mapbox.service';

describe('ArlasMapboxService', () => {
  let service: ArlasMapboxService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } })
      ],
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

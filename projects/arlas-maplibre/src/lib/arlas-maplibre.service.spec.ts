import { TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ArlasMaplibreService } from './arlas-maplibre.service';

describe('ArlasMaplibreService', () => {
  let service: ArlasMaplibreService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } })
      ],
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

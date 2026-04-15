import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ArlasMaplibreService } from './arlas-maplibre.service';

describe('ArlasMaplibreService', () => {
  let service: ArlasMaplibreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader } })
      ],
      providers: [
        ArlasMaplibreService
      ]
    });
    service = TestBed.inject(ArlasMaplibreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

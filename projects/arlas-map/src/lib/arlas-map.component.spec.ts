import {
  HttpClient, provideHttpClient, withInterceptorsFromDi
} from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  TranslateLoader, TranslateModule, TranslateNoOpLoader
} from '@ngx-translate/core';
import { from, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArlasMapComponent } from './arlas-map.component';
import { BasemapService } from './basemaps/basemap.service';
import { MapboxAoiDrawService } from './draw/draw.service';

describe('ArlasMapComponent', () => {
  let component: ArlasMapComponent<any, any, any>;
  let fixture: ComponentFixture<ArlasMapComponent<any, any, any>>;

  beforeEach(async () => {
    const mockBasemapService = {
      fetchSources$: vi.fn().mockName('BasemapService.fetchSources$'),
      setBasemaps: vi.fn().mockName('BasemapService.setBasemaps'),
      protomapBasemapAdded$: from(''),
      basemapChanged$: of()
    };
    mockBasemapService.fetchSources$.mockReturnValue(from(''));

    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        }),
        ArlasMapComponent,
      ],
      providers: [
        MapboxAoiDrawService,
        {
          provide: BasemapService,
          useValue: mockBasemapService,
        },
        HttpClient,
        provideHttpClient(withInterceptorsFromDi()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArlasMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

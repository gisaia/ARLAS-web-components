import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ArlasMapComponent } from './arlas-map.component';
import { MapboxAoiDrawService } from './draw/draw.service';
import { BasemapService } from './basemaps/basemap.service';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { from } from 'rxjs';

describe('ArlasMapComponent', () => {
  let component: ArlasMapComponent<any, any, any>;
  let fixture: ComponentFixture<ArlasMapComponent<any, any, any>>;

  beforeEach(waitForAsync(() => {

    const mockBasemapService = jasmine.createSpyObj('BasemapService', ['fetchSources$', 'setBasemaps'], {
      protomapBasemapAdded$: from('')
    });
    mockBasemapService.fetchSources$.and.returnValue(from(''));

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),
      ],
      declarations: [ ArlasMapComponent ],
      providers: [
        MapboxAoiDrawService,
        {
          provide: BasemapService,
          useValue: mockBasemapService
        },
        HttpClient,
        provideHttpClient(withInterceptorsFromDi())
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArlasMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

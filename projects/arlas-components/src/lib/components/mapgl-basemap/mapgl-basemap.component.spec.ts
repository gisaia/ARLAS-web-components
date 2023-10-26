import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglBasemapComponent } from './mapgl-basemap.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MapboxBasemapService } from '../mapgl/basemaps/basemap.service';

describe('MapglBasemapComponent', () => {
  let component: MapglBasemapComponent;
  let fixture: ComponentFixture<MapglBasemapComponent>;
  const mockMapboxBasemapService = jasmine.createSpyObj('MapboxBasemapService', ['isOnline']);
  mockMapboxBasemapService.isOnline.and.returnValue(false);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapglBasemapComponent],
      imports: [
        HttpClientModule
      ],
      providers: [
        HttpClient,
        {
          provide: MapboxBasemapService,
          useValue:  mockMapboxBasemapService
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglBasemapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

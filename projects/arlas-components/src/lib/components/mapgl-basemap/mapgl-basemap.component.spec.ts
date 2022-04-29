import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglBasemapComponent } from './mapgl-basemap.component';

describe('MapglBasemapComponent', () => {
  let component: MapglBasemapComponent;
  let fixture: ComponentFixture<MapglBasemapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapglBasemapComponent]
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

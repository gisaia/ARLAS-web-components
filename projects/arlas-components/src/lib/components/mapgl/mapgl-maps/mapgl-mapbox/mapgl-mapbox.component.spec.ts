import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglMapboxComponent } from './mapgl-mapbox.component';

describe('MapglMapboxComponent', () => {
  let component: MapglMapboxComponent;
  let fixture: ComponentFixture<MapglMapboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MapglMapboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapglMapboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

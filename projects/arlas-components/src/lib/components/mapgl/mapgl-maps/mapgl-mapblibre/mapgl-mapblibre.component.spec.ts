import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglMapblibreComponent } from './mapgl-mapblibre.component';

describe('MapglMapblibreComponent', () => {
  let component: MapglMapblibreComponent;
  let fixture: ComponentFixture<MapglMapblibreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MapglMapblibreComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapglMapblibreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglLayerIconComponent } from './mapgl-layer-icon.component';

describe('MapglLayerIconComponent', () => {
  let component: MapglLayerIconComponent;
  let fixture: ComponentFixture<MapglLayerIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapglLayerIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglLayerIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

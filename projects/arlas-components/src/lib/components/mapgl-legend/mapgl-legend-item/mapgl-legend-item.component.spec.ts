import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglLegendItemComponent } from './mapgl-legend-item.component';

describe('MapglLegendColorComponent', () => {
  let component: MapglLegendItemComponent;
  let fixture: ComponentFixture<MapglLegendItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MapglLegendItemComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MapglLegendItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

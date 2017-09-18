import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglComponent } from './mapgl.component';

describe('MapglComponent', () => {
  let component: MapglComponent;
  let fixture: ComponentFixture<MapglComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapglComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

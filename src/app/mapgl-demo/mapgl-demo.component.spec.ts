import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglDemoComponent } from './mapgl-demo.component';

describe('MapglDemoComponent', () => {
  let component: MapglDemoComponent;
  let fixture: ComponentFixture<MapglDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapglDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

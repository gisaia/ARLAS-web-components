import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglSettingsComponent } from './mapgl-settings.component';

describe('MapglSettingsComponent', () => {
  let component: MapglSettingsComponent;
  let fixture: ComponentFixture<MapglSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapglSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

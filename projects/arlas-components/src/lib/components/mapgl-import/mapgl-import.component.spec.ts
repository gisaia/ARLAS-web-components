import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglImportComponent } from './mapgl-import.component';

describe('MapglImportComponent', () => {
  let component: MapglImportComponent;
  let fixture: ComponentFixture<MapglImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapglImportComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

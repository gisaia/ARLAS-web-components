import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArlasMapboxComponent } from './arlas-mapbox.component';

describe('ArlasMapboxComponent', () => {
  let component: ArlasMapboxComponent;
  let fixture: ComponentFixture<ArlasMapboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArlasMapboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArlasMapboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArlasMaplibreComponent } from './arlas-maplibre.component';

describe('ArlasMaplibreComponent', () => {
  let component: ArlasMaplibreComponent;
  let fixture: ComponentFixture<ArlasMaplibreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArlasMaplibreComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArlasMaplibreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

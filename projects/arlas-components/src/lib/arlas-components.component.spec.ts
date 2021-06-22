import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArlasComponentsComponent } from './arlas-components.component';

describe('ArlasComponentsComponent', () => {
  let component: ArlasComponentsComponent;
  let fixture: ComponentFixture<ArlasComponentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArlasComponentsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArlasComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

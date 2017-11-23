import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerbarsComponent } from './powerbars.component';

describe('PowerbarsComponent', () => {
  let component: PowerbarsComponent;
  let fixture: ComponentFixture<PowerbarsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PowerbarsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PowerbarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerbarsDemoComponent } from './powerbars-demo.component';

describe('PowerbarsDemoComponent', () => {
  let component: PowerbarsDemoComponent;
  let fixture: ComponentFixture<PowerbarsDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PowerbarsDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PowerbarsDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

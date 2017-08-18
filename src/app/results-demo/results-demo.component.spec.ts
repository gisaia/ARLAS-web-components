import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsDemoComponent } from './results-demo.component';

describe('ResultsDemoComponent', () => {
  let component: ResultsDemoComponent;
  let fixture: ComponentFixture<ResultsDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResultsDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultsDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

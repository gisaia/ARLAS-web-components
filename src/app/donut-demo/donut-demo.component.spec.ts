import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DonutDemoComponent } from './donut-demo.component';

describe('DonutDemoComponent', () => {
  let component: DonutDemoComponent;
  let fixture: ComponentFixture<DonutDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DonutDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DonutDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

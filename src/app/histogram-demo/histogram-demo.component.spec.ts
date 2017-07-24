import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HistogramDemoComponent } from './histogram-demo.component';

describe('HistogramDemoComponent', () => {
  let component: HistogramDemoComponent;
  let fixture: ComponentFixture<HistogramDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HistogramDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistogramDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

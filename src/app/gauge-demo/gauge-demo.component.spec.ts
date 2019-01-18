import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GaugeDemoComponent } from './gauge-demo.component';

describe('GaugeDemoComponent', () => {
  let component: GaugeDemoComponent;
  let fixture: ComponentFixture<GaugeDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GaugeDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GaugeDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

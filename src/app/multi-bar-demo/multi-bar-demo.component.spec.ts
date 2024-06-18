import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiBarDemoComponent } from './multi-bar-demo.component';

describe('MultiBarDemoComponent', () => {
  let component: MultiBarDemoComponent;
  let fixture: ComponentFixture<MultiBarDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiBarDemoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiBarDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

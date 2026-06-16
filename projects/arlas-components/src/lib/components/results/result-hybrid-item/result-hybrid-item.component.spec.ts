import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultHybridItemComponent } from './result-hybrid-item.component';

describe('ResultHybrideItemComponent', () => {
  let component: ResultHybridItemComponent;
  let fixture: ComponentFixture<ResultHybridItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultHybridItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultHybridItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

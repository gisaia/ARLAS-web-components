import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultMetaBadgeComponent } from './result-meta-badge.component';

describe('ResultMetaBadgeComponent', () => {
  let component: ResultMetaBadgeComponent;
  let fixture: ComponentFixture<ResultMetaBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultMetaBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultMetaBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

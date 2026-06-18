import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultMetaBadgesComponent } from './result-meta-badges.component';

describe('ResultMetaBadgesComponent', () => {
  let component: ResultMetaBadgesComponent;
  let fixture: ComponentFixture<ResultMetaBadgesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultMetaBadgesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultMetaBadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

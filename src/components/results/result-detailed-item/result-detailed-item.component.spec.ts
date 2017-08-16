import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultDetailedItemComponent } from './result-detailed-item.component';

describe('ResultDetailedItemComponent', () => {
  let component: ResultDetailedItemComponent;
  let fixture: ComponentFixture<ResultDetailedItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResultDetailedItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultDetailedItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

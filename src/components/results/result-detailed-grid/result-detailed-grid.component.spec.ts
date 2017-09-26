import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultDetailedGridComponent } from './result-detailed-grid.component';

describe('ResultDetailedGridComponent', () => {
  let component: ResultDetailedGridComponent;
  let fixture: ComponentFixture<ResultDetailedGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResultDetailedGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultDetailedGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

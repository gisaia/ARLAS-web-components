import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultFilterComponent } from './result-filter.component';

describe('ResultFilterComponent', () => {
  let component: ResultFilterComponent;
  let fixture: ComponentFixture<ResultFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResultFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

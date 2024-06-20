import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsTableRowComponent } from './metrics-table-row.component';

describe('MultiBarsRowComponent', () => {
  let component: MetricsTableRowComponent;
  let fixture: ComponentFixture<MetricsTableRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MetricsTableRowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetricsTableRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

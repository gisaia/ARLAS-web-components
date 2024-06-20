import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsTableComponent } from './metrics-table.component';
import { MetricsTableRowComponent } from './multi-bars-row/metrics-table-row.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

describe('MultiCollectionBarsComponent', () => {
  let component: MetricsTableComponent;
  let fixture: ComponentFixture<MetricsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
     imports: [MetricsTableRowComponent,
       MetricsTableComponent,
       TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetricsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

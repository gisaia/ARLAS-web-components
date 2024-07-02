import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsTableComponent } from './metrics-table.component';
import { MetricsTableRowComponent } from './multi-bars-row/metrics-table-row.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { ColorGeneratorModule } from '../../services/color.generator.module';
import { AwcColorGeneratorLoader, ColorGeneratorLoader } from '../componentsUtils';
import { ArlasColorService } from '../../services/color.generator.service';
import { FormatLongTitlePipe } from '../../pipes/format-title/format-long-title.pipe';

describe('MultiCollectionBarsComponent', () => {
  let component: MetricsTableComponent;
  let fixture: ComponentFixture<MetricsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormatLongTitlePipe,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),
        MatTooltipModule,
        MatInputModule,
        ColorGeneratorModule.forRoot({
          loader: {
            provide: ColorGeneratorLoader,
            useClass: AwcColorGeneratorLoader
          }
        })
      ],
      declarations: [MetricsTableRowComponent, MetricsTableComponent],
      providers: [
        ArlasColorService
      ]
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

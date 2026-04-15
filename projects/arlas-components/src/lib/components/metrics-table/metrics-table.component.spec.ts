import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormatLongTitlePipe } from '../../pipes/format-title/format-long-title.pipe';
import { ColorGeneratorModule } from '../../services/color.generator.module';
import { ArlasColorService } from '../../services/color.generator.service';
import { AwcColorGeneratorLoader, ColorGeneratorLoader } from '../componentsUtils';
import { MetricsTableComponent } from './metrics-table.component';
import { MetricsTableRowComponent } from './multi-bars-row/metrics-table-row.component';

describe('MultiCollectionBarsComponent', () => {
  let component: MetricsTableComponent;
  let fixture: ComponentFixture<MetricsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        FormatLongTitlePipe,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader } }),
        MatTooltipModule,
        MatInputModule,
        ColorGeneratorModule.forRoot({
            loader: {
                provide: ColorGeneratorLoader,
                useClass: AwcColorGeneratorLoader
            }
        }),
        MetricsTableRowComponent, MetricsTableComponent
    ],
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

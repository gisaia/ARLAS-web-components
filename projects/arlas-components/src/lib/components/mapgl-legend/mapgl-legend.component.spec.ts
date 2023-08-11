import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglLegendComponent } from './mapgl-legend.component';
import { FormatNumberPipe } from '../../pipes/format-number/format-number.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateLoader, TranslateFakeLoader } from '@ngx-translate/core';
import { ArlasColorService } from '../../services/color.generator.service';
import { AwcColorGeneratorLoader, ColorGeneratorLoader } from '../componentsUtils';
import { LayerIdToName } from './layer-name.pipe';
import { MapglLayerIconModule } from '../mapgl-layer-icon/mapgl-layer-icon.module';
import { MatMenuModule } from '@angular/material/menu';
import { ColorGeneratorModule } from '../../services/color.generator.module';

describe('MapglLegendComponent', () => {
  let component: MapglLegendComponent;
  let fixture: ComponentFixture<MapglLegendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MapglLegendComponent, FormatNumberPipe, LayerIdToName],
      imports: [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MapglLayerIconModule,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),
        ColorGeneratorModule.forRoot({
          loader: {
            provide: ColorGeneratorLoader,
            useClass: AwcColorGeneratorLoader
          }
        })
      ],
      providers: [
        ArlasColorService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

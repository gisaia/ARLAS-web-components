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
import { GetCollectionDisplayNamePipe } from '../../pipes/get-collection-display-name/get-collection-display-name.pipe';
import { AwcCollectionService, BaseCollectionService, CollectionService } from '../../services/collection.service';
import { CollectionModule } from '../../services/collection.module';
import { FormatLegendPipe } from '../../pipes/format-legend/format-legend.pipe';
import { GetColorPipe } from '../../pipes/get-color/get-color.pipe';

describe('MapglLegendComponent', () => {
  let component: MapglLegendComponent;
  let fixture: ComponentFixture<MapglLegendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        MapglLegendComponent,
        FormatNumberPipe,
        LayerIdToName,
        FormatLegendPipe,
        GetColorPipe,
        GetCollectionDisplayNamePipe
      ],
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
        }),
        CollectionModule.forRoot({
          loader: {
            provide: BaseCollectionService,
            useClass: AwcCollectionService
          }
        })

      ],
      providers: [
        ArlasColorService,
        CollectionService
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

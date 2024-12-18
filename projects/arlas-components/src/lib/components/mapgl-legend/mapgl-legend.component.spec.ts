import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FormatLegendPipe } from '../../pipes/format-legend/format-legend.pipe';
import { FormatNumberPipe } from '../../pipes/format-number/format-number.pipe';
import { GetCollectionDisplayNamePipe } from '../../pipes/get-collection-display-name/get-collection-display-name.pipe';
import { GetColorPipe } from '../../pipes/get-color/get-color.pipe';
import { CollectionModule } from '../../services/collection.module';
import { AwcCollectionService, BaseCollectionService, CollectionService } from '../../services/collection.service';
import { ColorGeneratorModule } from '../../services/color.generator.module';
import { ArlasColorService } from '../../services/color.generator.service';
import { AwcColorGeneratorLoader, ColorGeneratorLoader } from '../componentsUtils';
import { MapglLayerIconModule } from '../mapgl-layer-icon/mapgl-layer-icon.module';
import { LayerIdToName } from './layer-name.pipe';
import { MapglLegendComponent } from './mapgl-legend.component';

describe('MapglLegendComponent', () => {
  let component: MapglLegendComponent;
  let fixture: ComponentFixture<MapglLegendComponent>;

  beforeEach(waitForAsync(() => {
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

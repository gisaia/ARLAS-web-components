import { NgModule } from '@angular/core';
import { ArlasMapComponent } from './arlas-map.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasemapComponent } from './basemaps/basemap.component';
import { BboxGeneratorModule } from './bbox-generator/bbox-generator.module';
import { CoordinatesComponent } from './coordinates/coordinates.component';
import { MapboxAoiDrawService } from './draw/draw.service';
import { CommonModule } from '@angular/common';
import { LayerIconComponent } from './legend/legend-icon/layer-icon.component';
import { LegendComponent } from './legend/legend.component';
import { LegendItemComponent } from './legend/legend-item/legend-item.component';
import { LayerIdToName } from './legend/layer-name.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { GetCollectionDisplayModule } from 'arlas-web-components';
import { ArlasColorService } from 'arlas-web-components';
import { GetColorModule } from 'arlas-web-components';



@NgModule({
  declarations: [
    ArlasMapComponent,
    BasemapComponent,
    CoordinatesComponent,
    LayerIconComponent,
    LegendComponent,
    LegendItemComponent,
    LayerIdToName
  ],
  imports: [
    CommonModule,
    MatSnackBarModule,
    TranslateModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    BboxGeneratorModule,
    GetCollectionDisplayModule,
    GetColorModule
  ],
  providers: [
    MapboxAoiDrawService,
    ArlasColorService
  ],
  exports: [
    ArlasMapComponent,
    BasemapComponent,
    CoordinatesComponent,
    LayerIconComponent,
    LegendComponent,
    LegendItemComponent,
    LayerIdToName
  ]
})
export class ArlasMapModule { }

import { NgModule } from '@angular/core';
import { ArlasMapComponent } from './arlas-map.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasemapComponent } from './basemaps/basemap.component';
import { CoordinatesComponent } from './coordinates/coordinates.component';
import { MapboxAoiDrawService } from './draw/draw.service';
import { LayerIconComponent } from './legend/legend-icon/layer-icon.component';
import { LegendComponent } from './legend/legend.component';
import { LegendItemComponent } from './legend/legend-item/legend-item.component';
import { LayerIdToName } from './legend/layer-name.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { GetCollectionDisplayModule } from 'arlas-web-components';
import { ArlasColorService } from 'arlas-web-components';
import { GetColorModule } from 'arlas-web-components';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GetCollectionPipe } from './arlas-map.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GetValueModule } from 'arlas-web-components';
import { CommonModule } from '@angular/common';
import { FormatNumberModule } from 'arlas-web-components';
import { FormatLegendModule } from 'arlas-web-components';



@NgModule({
  declarations: [
    ArlasMapComponent,
    BasemapComponent,
    CoordinatesComponent,
    LayerIconComponent,
    LegendComponent,
    LegendItemComponent,
    LayerIdToName,
    GetCollectionPipe
  ],
  imports: [
    MatSnackBarModule,
    TranslateModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatFormFieldModule,
    GetCollectionDisplayModule,
    GetColorModule,
    DragDropModule,
    GetValueModule,
    FormatNumberModule,
    FormatLegendModule,
    CommonModule
  ],
  providers: [
    MapboxAoiDrawService,
    ArlasColorService
  ],
  exports: [
    BasemapComponent,
    CoordinatesComponent,
    LayerIconComponent,
    LegendComponent,
    LegendItemComponent,
    LayerIdToName,
    ArlasMapComponent,
    GetCollectionPipe
  ]
})
export class ArlasMapModule { }

/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { NgModule } from '@angular/core';
import { ArlasMapComponent } from './arlas-map.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { BasemapModule } from './basemaps/basemap.module';
import { CoordinatesModule } from './coordinates/coordinates.module';
import { MapSettingsModule } from './map-settings/map-settings.module';
import { MapImportModule } from './map-import/map-import.module';
import { MapImportComponent } from './map-import/map-import.component';
import { MapSettingsComponent } from './map-settings/map-settings.component';
import { ArlasDrawComponent } from './draw/arlas-draw.component';



@NgModule({
  declarations: [
    ArlasMapComponent,
    LayerIconComponent,
    LegendComponent,
    LegendItemComponent,
    ArlasDrawComponent,
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
    CommonModule,
    CoordinatesModule,
    MapSettingsModule,
    MapImportModule,
    BasemapModule
  ],
  providers: [
    MapboxAoiDrawService,
    ArlasColorService
  ],
  exports: [
    LayerIconComponent,
    LegendComponent,
    LegendItemComponent,
    LayerIdToName,
    ArlasMapComponent,
    MapImportComponent,
    MapSettingsComponent,
    GetCollectionPipe
  ]
})
export class ArlasMapModule { }

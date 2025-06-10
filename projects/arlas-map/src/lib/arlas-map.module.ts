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

import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MarkerModule } from '@colsen1991/ngx-translate-extract-marker/extras';
import { TranslateModule } from '@ngx-translate/core';
import {
  ArlasColorService, FormatNumberModule,
  GetCollectionDisplayModule, GetColorModule, GetValueModule,
  ShortenNumberModule
} from 'arlas-web-components';
import { ArlasMapComponent } from './arlas-map.component';
import { GetCollectionPipe } from './arlas-map.pipe';
import { BasemapModule } from './basemaps/basemap.module';
import { CoordinatesModule } from './coordinates/coordinates.module';
import { ArlasDrawComponent } from './draw/arlas-draw.component';
import { MapboxAoiDrawService } from './draw/draw.service';
import { FormatLegendPipe } from './legend/format-legend.pipe';
import { LayerIdToName } from './legend/layer-name.pipe';
import { LayerIconComponent } from './legend/legend-icon/layer-icon.component';
import { LegendItemComponent } from './legend/legend-item/legend-item.component';
import { LegendComponent } from './legend/legend.component';
import { MapImportComponent } from './map-import/map-import.component';
import { MapImportModule } from './map-import/map-import.module';
import { MapSettingsComponent } from './map-settings/map-settings.component';
import { MapSettingsModule } from './map-settings/map-settings.module';


@NgModule({
  declarations: [
    ArlasMapComponent,
    LayerIconComponent,
    LegendComponent,
    LegendItemComponent,
    ArlasDrawComponent,
    LayerIdToName,
    GetCollectionPipe,
    FormatLegendPipe
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
    CommonModule,
    CoordinatesModule,
    MapSettingsModule,
    MapImportModule,
    BasemapModule,
    MarkerModule,
    ShortenNumberModule
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
    GetCollectionPipe,
    FormatLegendPipe
  ]
})
export class ArlasMapModule { }

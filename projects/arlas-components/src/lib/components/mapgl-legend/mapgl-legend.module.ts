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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MapglLegendComponent } from './mapgl-legend.component';
import { MapglLayerIconModule } from '../mapgl-layer-icon/mapgl-layer-icon.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormatNumberModule } from '../../pipes/format-number/format-number.module';
import { LayerIdToName } from './layer-name.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { GetCollectionDisplayModule } from '../../pipes/get-collection-display-name/get-collection-display.module';


@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    MapglLayerIconModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    FormatNumberModule,
    GetCollectionDisplayModule
  ],
  declarations: [MapglLegendComponent, LayerIdToName],
  exports: [MapglLegendComponent, LayerIdToName]
})
export class MapglLegendModule {

}

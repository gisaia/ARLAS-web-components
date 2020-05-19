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
import { CommonModule } from '@angular/common';
import { MatSelectModule, MatRadioModule, MatButtonModule, MatIconModule,
   MatSlideToggleModule, MatTooltipModule, MatChipsModule } from '@angular/material';
import { MapglComponent } from './mapgl.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MapglLegendModule } from '../mapgl-legend/map-legend.module';
import { MapglLayerIconModule } from '../mapgl-layer-icon/mapgel-layer-icon.module';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    TranslateModule,
    MapglLegendModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatChipsModule
  ],
  declarations: [MapglComponent],
  exports: [MapglComponent]
})
export class MapglModule {

}

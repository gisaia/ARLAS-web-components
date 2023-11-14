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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { MapglComponent } from './mapgl.component';
import { MapglLegendModule } from '../mapgl-legend/mapgl-legend.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GetCollectionPipe, GetLayerPipe } from './mapgl.component.util';
import { MapglBasemapModule } from '../mapgl-basemap/mapgl-basemap.module';
import { MapboxAoiDrawService } from './draw/draw.service';
import { CoordinatesComponent } from './coordinates/coordinates.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    TranslateModule,
    MapglLegendModule,
    MapglBasemapModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatChipsModule,
    FormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    DragDropModule,
  ],
  declarations: [MapglComponent, GetCollectionPipe, GetLayerPipe, CoordinatesComponent],
  providers: [
    MapboxAoiDrawService
  ],
  exports: [MapglComponent]
})
export class MapglModule {

}

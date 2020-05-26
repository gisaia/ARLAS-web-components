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
import { FormsModule } from '@angular/forms';
import { ResultListComponent } from './result-list/result-list.component';
import { ResultGridTileComponent } from './result-grid-tile/result-grid-tile.component';
import { ResultDetailedGridComponent } from './result-detailed-grid/result-detailed-grid.component';

import { ResultItemComponent } from './result-item/result-item.component';
import { ResultDetailedItemComponent } from './result-detailed-item/result-detailed-item.component';
import { ResultFilterComponent } from './result-filter/result-filter.component';
import { ResultScrollDirective } from './result-directive/result-scroll.directive';
import { LoadingModule } from 'ngx-loading';
import {
  MatIconModule, MatChipsModule, MatButtonToggleModule, MatButtonModule,
  MatGridListModule, MatCheckboxModule, MatMenuModule, MatTooltipModule, MatSelectModule,
  MatSlideToggleModule,
  MatRadioModule
} from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';
import { ColorGeneratorModule } from '../../services/color.generator.module';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { FormatNumberModule } from '../../pipes/format-number/format-number.module';

@NgModule({
  imports: [
    CommonModule,
    ColorGeneratorModule.forRoot(),
    MatIconModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatGridListModule,
    MatCheckboxModule,
    MatMenuModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatRadioModule,
    FormsModule,
    LazyLoadImageModule,
    LoadingModule,
    TranslateModule,
    FormatNumberModule
  ],
  declarations: [ResultListComponent, ResultGridTileComponent,
    ResultItemComponent, ResultDetailedItemComponent, ResultDetailedGridComponent,
    ResultFilterComponent, ResultScrollDirective],
  exports: [ResultListComponent, ResultGridTileComponent,
    ResultItemComponent, ResultDetailedItemComponent, ResultDetailedGridComponent,
    ResultFilterComponent, ResultScrollDirective],

})
export class ResultsModule { }

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
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { NgxLoadingModule } from 'ngx-loading';
import { ColorGeneratorModule } from '../../services/color.generator.module';
import { ResultDetailedGridComponent } from './result-detailed-grid/result-detailed-grid.component';
import { ResultDetailedItemComponent } from './result-detailed-item/result-detailed-item.component';
import { ResultScrollDirective } from './result-directive/result-scroll.directive';
import { ResultFilterComponent } from './result-filter/result-filter.component';
import { ResultGridTileComponent } from './result-grid-tile/result-grid-tile.component';
import { ResultItemComponent } from './result-item/result-item.component';
import { ResultListComponent } from './result-list/result-list.component';
import { FormatNumberModule } from '../../pipes/format-number/format-number.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReplaceModule } from '../../pipes/replace/replace.module';

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
    MatProgressSpinnerModule,
    FormsModule,
    LazyLoadImageModule,
    NgxLoadingModule,
    TranslateModule,
    FormatNumberModule,
    ReplaceModule
  ],
  declarations: [ResultListComponent, ResultGridTileComponent,
    ResultItemComponent, ResultDetailedItemComponent, ResultDetailedGridComponent,
    ResultFilterComponent, ResultScrollDirective],
  exports: [ResultListComponent, ResultGridTileComponent,
    ResultItemComponent, ResultDetailedItemComponent, ResultDetailedGridComponent,
    ResultFilterComponent, ResultScrollDirective],

})
export class ResultsModule { }

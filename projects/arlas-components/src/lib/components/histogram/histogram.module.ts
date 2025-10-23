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
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { GetCollectionUnitModule } from '../../pipes/get-collection-unit/get-collection-unit.module';
import { HistogramKeyPipe } from './histogram-key.pipe';
import { HistogramComponent } from './histogram.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    MatTooltipModule,
    GetCollectionUnitModule,
    MatIconModule,
    MatButtonModule
  ],
  declarations: [HistogramComponent, HistogramKeyPipe],
  exports: [HistogramComponent]
})
export class HistogramModule {}

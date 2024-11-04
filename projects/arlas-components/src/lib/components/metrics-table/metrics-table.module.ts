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

import { AsyncPipe, KeyValuePipe, NgClass, NgForOf, NgIf, UpperCasePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MetricsTableComponent } from './metrics-table.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PowerbarModule } from '../powerbars/powerbar/powerbar.module';
import { FormatLongTitlePipe } from '../../pipes/format-title/format-long-title.pipe';
import { MetricsTableRowModule } from './multi-bars-row/metrics-table-row.module';
import { GetCollectionDisplayModule } from '../../pipes/get-collection-display-name/get-collection-display.module';
import { GetFieldDisplayModule } from '../../pipes/get-field-display-name/get-field-display.module';
@NgModule({
    imports: [
        PowerbarModule,
        MatTooltipModule,
        NgForOf,
        NgClass,
        NgIf,
        UpperCasePipe,
        MatCheckboxModule,
        TranslateModule,
        MetricsTableRowModule,
        FormatLongTitlePipe,
        AsyncPipe,
        KeyValuePipe,
        GetCollectionDisplayModule,
        GetFieldDisplayModule
    ],
    declarations: [MetricsTableComponent],
    exports: [MetricsTableComponent]
})
export class MetricsTableModule { }

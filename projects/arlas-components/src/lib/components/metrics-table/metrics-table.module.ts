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

import { AsyncPipe, CommonModule, KeyValuePipe, NgClass, NgForOf, NgIf, UpperCasePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ColorGeneratorModule } from '../../services/color.generator.module';
import { FormatNumberModule } from '../../pipes/format-number/format-number.module';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MetricsTableComponent } from './metrics-table.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PowerbarModule } from '../powerbars/powerbar/powerbar.module';
import { MetricsTableRowComponent } from './multi-bars-row/metrics-table-row.component';
import { FormatLongTitlePipe } from '../../pipes/format-title/format-long-title.pipe';
import { MetricsTableRowModule } from './multi-bars-row/metrics-table-row.module';

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
        KeyValuePipe
    ],
    declarations: [MetricsTableComponent],
    exports: [MetricsTableComponent]
})
export class MetricsTableModule { }

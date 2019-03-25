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

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';

import { MapglDemoComponent } from './mapgl-demo/mapgl-demo.component';
import { ResultsDemoComponent } from './results-demo/results-demo.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { PowerbarsDemoComponent } from './powerbars-demo/powerbars-demo.component';

import {
  MatChipsModule, MatIconModule, MatSidenavModule,
  MatSlideToggleModule, MatSelectModule, MatTabsModule, MatRadioModule
} from '@angular/material';
import { FormsModule } from '@angular/forms';
import { HistogramModule } from '../components/histogram/histogram.module';
import { ResultsModule } from '../components/results/results.module';
import { MapglModule } from '../components/mapgl/mapgl.module';
import { PowerbarsModule } from '../components/powerbars/powerbars.module';
import { DonutModule } from '../components/donut/donut.module';
import { DonutDemoComponent } from './donut-demo/donut-demo.component';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { RouterModule, Routes } from '@angular/router';
import { GaugeDemoComponent } from './gauge-demo/gauge-demo.component';
import { GaugeModule } from '../components/gauge/gauge.module';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const routes: Routes = [
  { path: '', component: MapglDemoComponent },
  { path: 'histogram', component: HistogramDemoComponent },
  { path: 'donut', component: DonutDemoComponent },
  { path: 'powerbars', component: PowerbarsDemoComponent },
  { path: 'list', component: ResultsDemoComponent },
  { path: 'gauge', component: GaugeDemoComponent },

];


@NgModule({
  declarations: [
    AppComponent,
    HistogramDemoComponent,
    ResultsDemoComponent,
    MapglDemoComponent,
    PowerbarsDemoComponent,
    DonutDemoComponent,
    GaugeDemoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatChipsModule,
    MatIconModule,
    MatSidenavModule,
    MatSelectModule,
    MatTabsModule,
    MatRadioModule,
    FormsModule,
    MapglModule,
    HistogramModule,
    DonutModule,
    ResultsModule,
    GaugeModule,
    RouterModule.forRoot(routes),
    PowerbarsModule,
    MatSlideToggleModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

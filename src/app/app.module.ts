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

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MapglImportDialogComponent } from 'components/mapgl-import/mapgl-import.component';
import { WmtsLayerManagertDialogComponent } from 'components/wmts-layer-manager/wmts-layer-manager.component';
import { DonutModule } from '../components/donut/donut.module';
import { HistogramModule } from '../components/histogram/histogram.module';
import { MapglImportModule } from '../components/mapgl-import/mapgl-import.module';
import { MapglSettingsDialogComponent } from '../components/mapgl-settings/mapgl-settings.component';
import { MapglSettingsModule } from '../components/mapgl-settings/mapgl-settings.module';
import { MapglModule } from '../components/mapgl/mapgl.module';
import { MetricModule } from '../components/metric/metric.module';
import { PowerbarsModule } from '../components/powerbars/powerbars.module';
import { ResultsModule } from '../components/results/results.module';
import { WmtsLayerManagerModule } from '../components/wmts-layer-manager/wmts-layer-manager.module';
import { AppComponent } from './app.component';
import { DonutDemoComponent } from './donut-demo/donut-demo.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { MapglDemoComponent } from './mapgl-demo/mapgl-demo.component';
import { PowerbarsDemoComponent } from './powerbars-demo/powerbars-demo.component';
import { ResultsDemoComponent } from './results-demo/results-demo.component';
import { WmtsLayerManagerDemoComponent } from './wmts-layer-manager-demo/wmts-layer-manager-demo.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MapglLegendModule } from '../components/mapgl-legend/mapgl-legend.module';
import { MapglLayerIconModule } from '../components/mapgl-layer-icon/mapgl-layer-icon.module';




export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const routes: Routes = [
  { path: '', component: MapglDemoComponent },
  { path: 'histogram', component: HistogramDemoComponent },
  { path: 'donut', component: DonutDemoComponent },
  { path: 'powerbars', component: PowerbarsDemoComponent },
  { path: 'list', component: ResultsDemoComponent },
  { path: 'wmts-layer-manager', component: WmtsLayerManagerDemoComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HistogramDemoComponent,
    ResultsDemoComponent,
    MapglDemoComponent,
    PowerbarsDemoComponent,
    DonutDemoComponent,
    WmtsLayerManagerDemoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MapglModule,
    MapglImportModule,
    MapglSettingsModule,
    MapglLegendModule,
    MapglLayerIconModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatTabsModule,
    HistogramModule,
    DonutModule,
    ResultsModule,
    MetricModule,
    RouterModule.forRoot(routes),
    PowerbarsModule,
    WmtsLayerManagerModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  bootstrap: [AppComponent],
  entryComponents: [MapglImportDialogComponent, WmtsLayerManagertDialogComponent, MapglSettingsDialogComponent]
})
export class AppModule { }

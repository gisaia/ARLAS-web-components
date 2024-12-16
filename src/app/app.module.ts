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

import { HttpClient, HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
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
import {
  AwcCollectionService,
  BaseCollectionService,
  CollectionModule,
  DonutModule,
  FormatLegendModule,
  HistogramModule,
  MetricModule,
  MetricsTableModule,
  PowerbarsModule,
  ResultsModule,
  WmtsLayerManagerModule,
  WmtsLayerManagertDialogComponent
} from '../../projects/arlas-components/src/public-api';

import {
  CalendarTimelineModule
} from '../../projects/arlas-components/src/lib/components/calendar-timeline/calendar-timeline.module';
import { CalendarTimelineDemoComponent } from './calendar-timeline-demo/calendar-timeline-demo.component';
import { MetricsTableDemoComponent } from './metrics-table-demo/metrics-table-demo.component';
import { MapglLibreDemoComponent } from "./mapgl-libre-demo/mapgl-libre-demo.component";
import { ArlasMaplibreModule } from '../../projects/arlas-maplibre/src/public-api';
import { ArlasMapboxModule } from '../../projects/arlas-mapbox/src/public-api';
import { ArlasMapModule, MapSettingsModule } from '../../projects/arlas-map/src/public-api';
import { MaplibreDemoModule } from './mapgl-libre-demo/maplibre-demo.module';
import { MapboxDemoModule } from './mapgl-demo/mapbox-demo.module';


export function httpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const routes: Routes = [
  { path: '', component: MapglDemoComponent },
  { path: 'maplibre', component: MapglLibreDemoComponent },
  { path: 'histogram', component: HistogramDemoComponent },
  { path: 'donut', component: DonutDemoComponent },
  { path: 'powerbars', component: PowerbarsDemoComponent },
  { path: 'calendar-timeline', component: CalendarTimelineDemoComponent },
  { path: 'list', component: ResultsDemoComponent },
  { path: 'wmts-layer-manager', component: WmtsLayerManagerDemoComponent },
  { path: 'multi-collection', component: MetricsTableDemoComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HistogramDemoComponent,
    ResultsDemoComponent,
    PowerbarsDemoComponent,
    DonutDemoComponent,
    WmtsLayerManagerDemoComponent,
    CalendarTimelineDemoComponent,
    MetricsTableDemoComponent,
    
  ],
  imports: [
    BrowserModule,
    FormatLegendModule,
    BrowserAnimationsModule,
    CalendarTimelineModule,
    FormsModule,
    MapSettingsModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatTabsModule,
    HistogramModule,
    ArlasMaplibreModule,
    ArlasMapboxModule,
    ArlasMapModule,
    DonutModule,
    ResultsModule,
    MetricModule,
    MetricsTableModule,
    MaplibreDemoModule,
    MapboxDemoModule,
    RouterModule.forRoot(routes),
    PowerbarsModule,
    WmtsLayerManagerModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    CollectionModule.forRoot({ loader: {
                provide: BaseCollectionService,
                useClass: AwcCollectionService
            } })
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  bootstrap: [AppComponent]
})
export class AppModule { }

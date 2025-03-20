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
import { ArlasMapFrameworkService, AbstractArlasMapService, BasemapService, LegendService } from 'arlas-map';
import { ArlasMaplibreService, MaplibreBasemapService, MaplibreLegendService, ArlasMapService } from 'arlas-maplibre';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { MapglDemoComponent } from './mapgl-demo/mapgl-demo.component';
import { MetricsTableDemoComponent } from './metrics-table-demo/metrics-table-demo.component';
import { CalendarTimelineDemoComponent } from './calendar-timeline-demo/calendar-timeline-demo.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { ResultsDemoComponent } from './results-demo/results-demo.component';
import { PowerbarsDemoComponent } from './powerbars-demo/powerbars-demo.component';
import { DonutDemoComponent } from './donut-demo/donut-demo.component';
import { WmtsLayerManagerDemoComponent } from './wmts-layer-manager-demo/wmts-layer-manager-demo.component';
import { RouterModule, Routes } from '@angular/router';
import { ArlasMaplibreModule } from 'arlas-maplibre';


const routes: Routes = [
  { path: '', component: MapglDemoComponent },
  { path: 'maplibre', component: MapglDemoComponent },
  { path: 'histogram', component: HistogramDemoComponent },
  { path: 'donut', component: DonutDemoComponent },
  { path: 'powerbars', component: PowerbarsDemoComponent },
  { path: 'calendar-timeline', component: CalendarTimelineDemoComponent },
  { path: 'list', component: ResultsDemoComponent },
  { path: 'wmts-layer-manager', component: WmtsLayerManagerDemoComponent },
  { path: 'multi-collection', component: MetricsTableDemoComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    AppModule
  ],
  providers: [
    ArlasMaplibreModule,
    {
      provide: AbstractArlasMapService,
      useClass: ArlasMapService
    },
    ArlasMaplibreService,
    {
      provide: BasemapService,
      useClass: MaplibreBasemapService
    },
    {
      provide: LegendService,
      useClass: MaplibreLegendService
    },
    {
      provide: ArlasMapFrameworkService,
      useClass: ArlasMaplibreService
    },
    ArlasMapService,
  ],
  bootstrap: [AppComponent],
})
export class AppMaplibreModule {
}

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

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AbstractArlasMapService, ArlasMapFrameworkService, BasemapService, LegendService } from 'arlas-map';
import { ArlasMaplibreService, ArlasMapService, MaplibreBasemapService, MaplibreLegendService } from 'arlas-maplibre';
import { AwcCollectionService, AwcColorGeneratorLoader, BaseCollectionService, CollectionModule, ColorGeneratorLoader } from 'arlas-web-components';
import { AppComponent } from './app/app.component';
import { CalendarTimelineDemoComponent } from './app/calendar-timeline-demo/calendar-timeline-demo.component';
import { CogVisualisationComponent } from './app/cog-visualisation/cog-visualisation.component';
import { DonutDemoComponent } from './app/donut-demo/donut-demo.component';
import { HistogramDemoComponent } from './app/histogram-demo/histogram-demo.component';
import { LayerLegendDemoComponent } from './app/layer-legend/layer-legend-demo.component';
import { MapglDemoComponent } from './app/mapgl-demo/mapgl-demo.component';
import { MetricsTableDemoComponent } from './app/metrics-table-demo/metrics-table-demo.component';
import { PowerbarsDemoComponent } from './app/powerbars-demo/powerbars-demo.component';
import { ResultsDemoComponent } from './app/results-demo/results-demo.component';
import { WmtsLayerManagerDemoComponent } from './app/wmts-layer-manager-demo/wmts-layer-manager-demo.component';
import { environment } from './environments/environment';

const routes: Routes = [
  { path: '', component: MapglDemoComponent },
  { path: 'histogram', component: HistogramDemoComponent },
  { path: 'donut', component: DonutDemoComponent },
  { path: 'powerbars', component: PowerbarsDemoComponent },
  { path: 'calendar-timeline', component: CalendarTimelineDemoComponent },
  { path: 'list', component: ResultsDemoComponent },
  { path: 'wmts-layer-manager', component: WmtsLayerManagerDemoComponent },
  { path: 'multi-collection', component: MetricsTableDemoComponent },
  { path: 'cog-visualisation', component: CogVisualisationComponent },
  { path: 'layer-legend', component: LayerLegendDemoComponent }
];



if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(CollectionModule.forRoot({
            loader: {
                provide: BaseCollectionService,
                useClass: AwcCollectionService
            }
        })),
        { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
        provideHttpClient(withInterceptorsFromDi()),
        provideTranslateService({
            loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' })
        }),
        provideRouter(routes),
        {
            provide: ColorGeneratorLoader,
            useClass: AwcColorGeneratorLoader
        },
        {
            provide: BasemapService,
            useClass: MaplibreBasemapService
        },
        {
            provide: ArlasMapFrameworkService,
            useClass: ArlasMaplibreService
        },
        {
            provide: AbstractArlasMapService,
            useClass: ArlasMapService
        },
        {
            provide: LegendService,
            useClass: MaplibreLegendService
        }
    ]
});

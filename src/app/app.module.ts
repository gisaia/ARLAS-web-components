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

import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CalendarTimelineModule } from '../../projects/arlas-components/src/lib/components/calendar-timeline/calendar-timeline.module';
import { DonutModule } from '../../projects/arlas-components/src/lib/components/donut/donut.module';
import { HistogramModule } from '../../projects/arlas-components/src/lib/components/histogram/histogram.module';
import { MapglImportModule } from '../../projects/arlas-components/src/lib/components/mapgl-import/mapgl-import.module';
import { MapglLayerIconModule } from '../../projects/arlas-components/src/lib/components/mapgl-layer-icon/mapgl-layer-icon.module';
import { MapglLegendModule } from '../../projects/arlas-components/src/lib/components/mapgl-legend/mapgl-legend.module';
import { MapglSettingsModule } from '../../projects/arlas-components/src/lib/components/mapgl-settings/mapgl-settings.module';
import { MapglModule } from '../../projects/arlas-components/src/lib/components/mapgl/mapgl.module';
import { MetricModule } from '../../projects/arlas-components/src/lib/components/metric/metric.module';
import { MetricsTableModule } from '../../projects/arlas-components/src/lib/components/metrics-table/metrics-table.module';
import { PowerbarsModule } from '../../projects/arlas-components/src/lib/components/powerbars/powerbars.module';
import { ResultsModule } from '../../projects/arlas-components/src/lib/components/results/results.module';
import { WmtsLayerManagerModule } from '../../projects/arlas-components/src/lib/components/wmts-layer-manager/wmts-layer-manager.module';
import { FormatLegendModule } from '../../projects/arlas-components/src/lib/pipes/format-legend/format-legend.module';
import { CollectionModule } from '../../projects/arlas-components/src/lib/services/collection.module';
import { AwcCollectionService, BaseCollectionService } from '../../projects/arlas-components/src/lib/services/collection.service';
import { AppComponent } from './app.component';
import { CalendarTimelineDemoComponent } from './calendar-timeline-demo/calendar-timeline-demo.component';
import { DonutDemoComponent } from './donut-demo/donut-demo.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { MapglDemoComponent } from './mapgl-demo/mapgl-demo.component';
import { MetricsTableDemoComponent } from './metrics-table-demo/metrics-table-demo.component';
import { PowerbarsDemoComponent } from './powerbars-demo/powerbars-demo.component';
import { ResultsDemoComponent } from './results-demo/results-demo.component';
import { WmtsLayerManagerDemoComponent } from './wmts-layer-manager-demo/wmts-layer-manager-demo.component';


export function httpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const routes: Routes = [
  { path: '', component: MapglDemoComponent },
  { path: 'histogram', component: HistogramDemoComponent },
  { path: 'donut', component: DonutDemoComponent },
  { path: 'powerbars', component: PowerbarsDemoComponent },
  { path: 'calendar-timeline', component: CalendarTimelineDemoComponent },
  { path: 'list', component: ResultsDemoComponent },
  { path: 'wmts-layer-manager', component: WmtsLayerManagerDemoComponent },
  { path: 'multi-collection', component: MetricsTableDemoComponent }
];

@NgModule({ declarations: [
        AppComponent,
        HistogramDemoComponent,
        ResultsDemoComponent,
        MapglDemoComponent,
        PowerbarsDemoComponent,
        DonutDemoComponent,
        WmtsLayerManagerDemoComponent,
        CalendarTimelineDemoComponent,
        MetricsTableDemoComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormatLegendModule,
        BrowserAnimationsModule,
        CalendarTimelineModule,
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
        MetricsTableModule,
        RouterModule.forRoot(routes),
        PowerbarsModule,
        WmtsLayerManagerModule,
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
            } })], providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }

import {Injectable, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {
  CalendarTimelineModule, DonutModule,
  HistogramModule,
  MapglImportModule,
  MapglModule,
  MapglSettingsModule, PowerbarsModule, ResultsModule, WmtsLayerManagerModule
} from "arlas-web-components"
import {AppComponent} from './app.component';
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {MatTabsModule} from "@angular/material/tabs";
import {RouterModule, Routes} from "@angular/router";
import {MapglDemoComponent} from "./mapgl-demo/mapgl-demo.component";
import {HistogramDemoComponent} from "./histogram-demo/histogram-demo.component";
import {DonutDemoComponent} from "./donut-demo/donut-demo.component";
import {PowerbarsDemoComponent} from "./powerbars-demo/powerbars-demo.component";
import {CalendarTimelineDemoComponent} from "./calendar-timeline-demo/calendar-timeline-demo.component";
import {ResultsDemoComponent} from "./results-demo/results-demo.component";
import {WmtsLayerManagerDemoComponent} from "./wmts-layer-manager-demo/wmts-layer-manager-demo.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatRadioModule} from "@angular/material/radio";
import {MatSelectModule} from "@angular/material/select";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MAT_DATE_LOCALE} from "@angular/material/core";

import {CommonModule} from "@angular/common";


const routes: Routes = [
  { path: '', component: MapglDemoComponent },
  { path: 'histogram', component: HistogramDemoComponent },
  { path: 'donut', component: DonutDemoComponent },
  { path: 'powerbars', component: PowerbarsDemoComponent },
  { path: 'calendar-timeline', component: CalendarTimelineDemoComponent },
  { path: 'list', component: ResultsDemoComponent },
  { path: 'wmts-layer-manager', component: WmtsLayerManagerDemoComponent }
];

export function httpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HistogramDemoComponent,
    ResultsDemoComponent,
    MapglDemoComponent,
    PowerbarsDemoComponent,
    DonutDemoComponent,
    WmtsLayerManagerDemoComponent,
    CalendarTimelineDemoComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MapglModule,
    MapglImportModule,
    MapglSettingsModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatTabsModule,
    HistogramModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    CalendarTimelineModule,
    DonutModule,
    PowerbarsModule,
    WmtsLayerManagerModule,
    ResultsModule,
    MapglSettingsModule,
    MapglModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-ES' }],
  bootstrap: [AppComponent]
})
export class AppModule { }

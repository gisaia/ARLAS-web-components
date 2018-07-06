import { HttpModule } from '@angular/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';

import { MapglDemoComponent } from './mapgl-demo/mapgl-demo.component';
import { ResultsDemoComponent } from './results-demo/results-demo.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { PowerbarsDemoComponent } from './powerbars-demo/powerbars-demo.component';

import { MatChipsModule, MatIconModule, MatSidenavModule, MatSlideToggleModule, MatSelectModule, MatTabsModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { HistogramModule } from '../components/histogram/histogram.module';
import { ResultsModule } from '../components/results/results.module';
import { ResultGridTileComponent } from '../components/results/result-grid-tile/result-grid-tile.component';
import { MapglModule } from '../components/mapgl/mapgl.module';
import { PowerbarsModule } from '../components/powerbars/powerbars.module';
import { DonutModule } from '../components/donut/donut.module';
import { DonutDemoComponent } from './donut-demo/donut-demo.component';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { RouterModule, Routes } from '@angular/router';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const routes: Routes = [
  { path: '', component: MapglDemoComponent },
  { path: 'histogram', component: HistogramDemoComponent },
  { path: 'donut', component: DonutDemoComponent },
  { path: 'map', component: MapglDemoComponent },
  { path: 'powerbars', component: PowerbarsDemoComponent },
  { path: 'list', component: ResultsDemoComponent },
];


@NgModule({
  declarations: [
    AppComponent,
    HistogramDemoComponent,
    ResultsDemoComponent,
    MapglDemoComponent,
    PowerbarsDemoComponent,
    DonutDemoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatChipsModule,
    MatIconModule,
    MatSidenavModule,
    MatSelectModule,
    MatTabsModule,
    FormsModule,
    MapglModule,
    HistogramModule,
    DonutModule,
    ResultsModule,
    RouterModule.forRoot(routes),
    PowerbarsModule,
    MatSlideToggleModule,
    HttpModule,
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

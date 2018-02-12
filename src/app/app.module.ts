import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';

import { MapglDemoComponent } from './mapgl-demo/mapgl-demo.component';
import { ResultsDemoComponent } from './results-demo/results-demo.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { PowerbarsDemoComponent } from './powerbars-demo/powerbars-demo.component';

import { MatChipsModule, MatIconModule, MatSidenavModule, MatSlideToggleModule, MatSelectModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { HistogramModule } from '../components/histogram/histogram.module';
import { ResultsModule } from '../components/results/results.module';
import { ResultGridTileComponent } from '../components/results/result-grid-tile/result-grid-tile.component';
import { MapglModule } from '../components/mapgl/mapgl.module';
import { PowerbarsModule } from '../components/powerbars/powerbars.module';
import { DonutModule } from '../components/donut/donut.module';
import { DonutDemoComponent } from './donut-demo/donut-demo.component';

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
    FormsModule,
    MapglModule,
    HistogramModule,
    DonutModule,
    ResultsModule,
    PowerbarsModule,
    MatSlideToggleModule,
    HttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

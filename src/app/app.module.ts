import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HistogramComponent } from '../components/histogram/histogram.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { ResultListComponent } from '../components/results/result-list/result-list.component';
import { ResultFilterComponent } from '../components/results/result-filter/result-filter.component';
import { ResultItemComponent } from '../components/results/result-item/result-item.component';
import { ResultDetailedItemComponent } from '../components/results/result-detailed-item/result-detailed-item.component';

import { ResultScrollDirective } from '../components/results/result-directive/result-scroll.directive';

import { MapglDemoComponent } from './mapgl-demo/mapgl-demo.component';
import { ResultsDemoComponent } from './results-demo/results-demo.component';

import { MatChipsModule, MatIconModule, MatSidenavModule, MatSlideToggleModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { HistogramModule } from '../components/histogram/histogram.module';
import { ResultsModule } from '../components/results/results.module';
import { ResultGridTileComponent } from '../components/results/result-grid-tile/result-grid-tile.component';
import { MapglModule } from '../components/mapgl/mapgl.module';


@NgModule({
  declarations: [
    AppComponent,
    HistogramDemoComponent,
    ResultsDemoComponent,
    MapglDemoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatChipsModule,
    MatIconModule,
    MatSidenavModule,
    FormsModule,
    MapglModule,
    HistogramModule,
    ResultsModule,
    MatSlideToggleModule,
    HttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

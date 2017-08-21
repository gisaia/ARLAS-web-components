import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HistogramComponent } from '../components/histogram/histogram.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { MapComponent } from '../components/map/map.component';
import { ErrorModalComponent } from '../components/errormodal/errormodal.component';
import { ErrorModalMsgComponent } from '../components/errormodal/errormodal.component';
import { ResultListComponent } from '../components/results/result-list/result-list.component';
import { ResultItemComponent } from '../components/results/result-item/result-item.component';
import { ResultDetailedItemComponent } from '../components/results/result-detailed-item/result-detailed-item.component';
import { MapDemoComponent } from './map-demo/map-demo.component';
import { ResultsDemoComponent } from './results-demo/results-demo.component';
import { ResultFilterComponent } from '../components/results/result-filter/result-filter.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    AppComponent,
    HistogramComponent,
    HistogramDemoComponent,
    MapComponent,
    MapDemoComponent,
    ErrorModalComponent,
    ErrorModalMsgComponent,
    ResultListComponent,
    ResultItemComponent,
    ResultDetailedItemComponent,
    ResultsDemoComponent,
    ResultFilterComponent

  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

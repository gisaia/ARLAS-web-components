import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HistogramComponent } from '../components/histogram/histogram.component';
import { HistogramDemoComponent } from './histogram-demo/histogram-demo.component';
import { TableComponent } from '../components/table/table.component';
import { TableDemoComponent } from './table-demo/table-demo.component';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { TableModule } from '../components/table/table.module';
import { MapComponent } from '../components/map/map.component';
import { ErrorModalComponent } from '../components/errormodal/errormodal.component';
import { ErrorModalMsgComponent } from '../components/errormodal/errormodal.component';

@NgModule({
  declarations: [
    AppComponent,
    HistogramComponent,
    HistogramDemoComponent,
    TableComponent,
    TableDemoComponent,
    MapComponent,
    ErrorModalComponent,
    ErrorModalMsgComponent

  ],
  imports: [
    BrowserModule,
    Ng2SmartTableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

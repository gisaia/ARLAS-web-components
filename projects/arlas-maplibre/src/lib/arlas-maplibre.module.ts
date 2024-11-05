import { NgModule } from '@angular/core';
import { ArlasMaplibreComponent } from './arlas-maplibre.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MapboxAoiDrawService } from 'arlas-map';
import { CommonModule } from '@angular/common';
import { GetValueModule } from 'arlas-components';



@NgModule({
  declarations: [
    ArlasMaplibreComponent
  ],
  imports: [
    TranslateModule,
    MatTooltipModule,
    MatIconModule,
    CommonModule,
    GetValueModule
  ],
  providers: [
    MapboxAoiDrawService
  ],
  exports: [
    ArlasMaplibreComponent
  ]
})
export class ArlasMaplibreModule { }

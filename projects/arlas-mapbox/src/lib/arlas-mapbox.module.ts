import { NgModule } from '@angular/core';
import { ArlasMapboxComponent } from './arlas-mapbox.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MapboxAoiDrawService } from 'arlas-map';
import { CommonModule } from '@angular/common';


@NgModule({
  declarations: [
    ArlasMapboxComponent
  ],
  imports: [
    TranslateModule,
    MatTooltipModule,
    MatIconModule,
    CommonModule,
  ],
  providers: [
    MapboxAoiDrawService
  ],
  exports: [
    ArlasMapboxComponent
  ]
})
export class ArlasMapboxModule { }

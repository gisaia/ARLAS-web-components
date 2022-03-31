import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapglBasemapComponent } from './mapgl-basemap.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [
    MapglBasemapComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule
  ],
  exports: [
    MapglBasemapComponent
  ]
})
export class MapglBasemapModule { }

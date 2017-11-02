import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapglComponent } from './mapgl.component';
import { MatChipsModule } from '@angular/material';
import { MatSlideToggleModule } from '@angular/material';


@NgModule({
  imports: [
    CommonModule,
    MatChipsModule,
    MatSlideToggleModule

  ],
  declarations: [MapglComponent],
  exports: [MapglComponent]
})
export class MapglModule {

}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapglComponent } from './mapgl.component';
import { MdChipsModule } from '@angular/material';
import { MdSlideToggleModule } from '@angular/material';


@NgModule({
  imports: [
    CommonModule,
    MdChipsModule,
    MdSlideToggleModule

  ],
  declarations: [MapglComponent],
  exports: [MapglComponent]
})
export class MapglModule {

}

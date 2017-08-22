import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map.component';
import { MdChipsModule } from "@angular/material";

@NgModule({
  imports: [
    CommonModule,
        MdChipsModule

  ],
  declarations: [MapComponent],
  exports: [MapComponent]
})
export class MapModule {}

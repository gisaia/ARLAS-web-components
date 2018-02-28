import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule, MatOptionModule } from '@angular/material';
import { MapglComponent } from './mapgl.component';

@NgModule({
  imports: [
    CommonModule,
    MatSelectModule,
    MatOptionModule
  ],
  declarations: [MapglComponent],
  exports: [MapglComponent]
})
export class MapglModule {

}

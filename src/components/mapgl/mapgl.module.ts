import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule, MatRadioModule } from '@angular/material';
import { MapglComponent } from './mapgl.component';

@NgModule({
  imports: [
    CommonModule,
    MatSelectModule,
    MatRadioModule
  ],
  declarations: [MapglComponent],
  exports: [MapglComponent]
})
export class MapglModule {

}

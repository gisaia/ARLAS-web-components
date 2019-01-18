import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GaugeComponent } from './gauge.component';
import { MatTooltipModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule
  ],
  declarations: [GaugeComponent],
  exports: [GaugeComponent]
})
export class GaugeModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonutComponent } from './donut.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [DonutComponent],
  exports: [DonutComponent]
})
export class DonutModule {}

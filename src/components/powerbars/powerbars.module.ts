import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PowerbarsComponent } from './powerbars.component';
import { MatCardModule, MatIconModule, MatTooltipModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule
  ],
  declarations: [PowerbarsComponent],
  exports: [PowerbarsComponent]
})
export class PowerbarsModule {}

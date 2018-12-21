import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PowerbarsComponent } from './powerbars.component';
import { MatCardModule, MatIconModule, MatTooltipModule, MatInputModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule
  ],
  declarations: [PowerbarsComponent],
  exports: [PowerbarsComponent]
})
export class PowerbarsModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PowerbarsComponent } from './powerbars.component';
import { MatCardModule, MatIconModule, MatTooltipModule, MatInputModule } from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    TranslateModule
  ],
  declarations: [PowerbarsComponent],
  exports: [PowerbarsComponent]
})
export class PowerbarsModule {}

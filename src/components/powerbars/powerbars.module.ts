import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PowerbarsComponent } from './powerbars.component';
import { MatCardModule, MatIconModule, MatTooltipModule, MatInputModule } from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';
import { ColorGeneratorModule } from '../../services/color.generator.module';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    ColorGeneratorModule.forRoot(),
    TranslateModule
  ],
  declarations: [PowerbarsComponent],
  exports: [PowerbarsComponent]
})
export class PowerbarsModule {}

import { NgModule, Provider, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonutComponent } from './donut.component';
import { ColorGeneratorModule } from '../../services/color.generator.module';

@NgModule({
  imports: [
    CommonModule,
    ColorGeneratorModule.forRoot()
  ],
  declarations: [DonutComponent],
  exports: [DonutComponent]
})
export class DonutModule {
}

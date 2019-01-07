import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule, MatRadioModule } from '@angular/material';
import { MapglComponent } from './mapgl.component';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  imports: [
    CommonModule,
    MatSelectModule,
    MatRadioModule,
    TranslateModule
  ],
  declarations: [MapglComponent],
  exports: [MapglComponent]
})
export class MapglModule {

}

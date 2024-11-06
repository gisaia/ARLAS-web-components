import { NgModule } from '@angular/core';
import { ArlasMapComponent } from './arlas-map.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasemapComponent } from './basemaps/basemap.component';
import { BboxGeneratorModule } from './bbox-generator/bbox-generator.module';
import { CoordinatesComponent } from './coordinates/coordinates.component';



@NgModule({
  declarations: [
    ArlasMapComponent,
    BasemapComponent,
    CoordinatesComponent
  ],
  imports: [
    MatSnackBarModule,
    TranslateModule,
    MatIconModule,
    MatTooltipModule,
    BboxGeneratorModule
  ],
  exports: [
    ArlasMapComponent,
    BasemapComponent,
    CoordinatesComponent
  ]
})
export class ArlasMapModule { }

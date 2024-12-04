import { NgModule } from '@angular/core';
import { ArlasMaplibreService } from './arlas-maplibre.service';
import { MaplibreBasemapService } from './basemaps/maplibre-basemap.service';
import { MaplibreLegendService } from './legend/legend.service';



@NgModule({
  declarations: [
  ],
  imports: [
  ],
  providers: [
    ArlasMaplibreService,
    MaplibreBasemapService,
    MaplibreLegendService
  ],
  exports: [
  ]
})
export class ArlasMaplibreModule { }

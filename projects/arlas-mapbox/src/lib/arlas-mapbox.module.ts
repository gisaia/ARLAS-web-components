import { NgModule } from '@angular/core';
import { ArlasMapboxService } from './arlas-mapbox.service';
import { MapboxBasemapService } from './basemaps/mapbox-basemap.service';
import { MapboxLegendService } from './legend/legend.service';

@NgModule({
  declarations: [
  ],
  imports: [

  ],
  providers: [
    ArlasMapboxService,
    MapboxBasemapService,
    MapboxLegendService
  ],
  exports: [
  ]
})
export class ArlasMapboxModule { }

import { NgModule } from '@angular/core';
import { ArlasMapboxService } from './arlas-mapbox.service';
import { MapboxBasemapService } from './basemaps/mapbox-basemap.service';

@NgModule({
  declarations: [
  ],
  imports: [

  ],
  providers: [
    ArlasMapboxService,
    MapboxBasemapService
  ],
  exports: [
  ]
})
export class ArlasMapboxModule { }

import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MapboxAoiDrawService} from "../../draw/draw.service";
import {MapboxBasemapService} from "../../basemaps/basemap.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TranslateService} from "@ngx-translate/core";
import {MapglMapCommonComponent} from "../mapgl-map-common.component";
import mapboxgl from "mapbox-gl";

@Component({
  selector: 'arlas-mapgl-mapbox',
  templateUrl: '../mapgl-map-common.html',
  styleUrls: ['../mapgl-map-common.css']
})
export class MapglMapboxComponent extends MapglMapCommonComponent implements OnInit {
  map: mapboxgl.Map

  ngOnInit(): void {
  }

}

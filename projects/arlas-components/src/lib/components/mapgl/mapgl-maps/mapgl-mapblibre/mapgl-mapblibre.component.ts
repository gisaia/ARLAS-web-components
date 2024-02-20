import {Component, OnInit} from '@angular/core';
import {MapglMapCommonComponent} from "../mapgl-map-common.component";
import {HttpClient} from "@angular/common/http";
import {MapboxAoiDrawService} from "../../draw/draw.service";
import {MapboxBasemapService} from "../../basemaps/basemap.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TranslateService} from "@ngx-translate/core";
import * as  maplibre from "maplibre-gl";

@Component({
  selector: 'arlas-mapgl-mapblibre',
  templateUrl: '../mapgl-map-common.html',
  styleUrls: ['../mapgl-map-common.css']
})
export class MapglMapblibreComponent extends  MapglMapCommonComponent implements OnInit {

  map: maplibre.Map


  ngOnInit(): void {
  }

}

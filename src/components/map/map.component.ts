import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import * as leaflet from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';

export interface Named {
  properties;
  name: string;
}
@Component({
  selector: 'arlas-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  public map: L.Map;
  public geojsonLayer: L.Layer;
  @Input() public layerSubject = new Subject<any>();
  @Input() public basemapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
  constructor() { }

  public ngOnInit() { }

  public ngAfterViewInit(): void {
    this.map = leaflet.map('map', {
      center: [48.8534, 2.3488],
      zoom: 10,
      zoomControl: false
    });
    const layer: leaflet.TileLayer = leaflet.tileLayer(this.basemapUrl);
    this.map.addLayer(layer);
    this.layerSubject.subscribe(
      value => {
        if (this.geojsonLayer !== undefined) {
          this.map.removeLayer(this.geojsonLayer);
        }
        if (value.features) {
          this.geojsonLayer = L.geoJSON(value, {
            onEachFeature: function (feature: any, l) {
              l.bindPopup('<h1>' + <Named>feature.properties.name + '</h1>');
            }
          });
          this.geojsonLayer.addTo(this.map);
        }
      }
    );
  }
}

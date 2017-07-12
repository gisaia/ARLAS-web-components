import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import * as leaflet from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
export interface p {
  properties
  name: string
}
@Component({
  selector: 'arlas-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  map: L.Map;
  geojsonLayer: L.Layer;
  @Input() layerSubject = new Subject<any>();
  ngAfterViewInit(): void {
    this.map = leaflet.map('map', {
      center: [48.8534, 2.3488],
      zoom: 10
    });
    const layer: leaflet.TileLayer = leaflet.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');
    this.map.addLayer(layer);
    this.layerSubject.subscribe(value => {
      if (this.geojsonLayer != undefined) {
        this.map.removeLayer(this.geojsonLayer)
      }
      this.geojsonLayer = L.geoJSON(value, {
        onEachFeature: function (feature: any, layer) {
          layer.bindPopup('<h1>' + <p>feature.properties.name + '</h1>');
        }
      })
      this.geojsonLayer.addTo(this.map)

    }
    )
  }

  constructor() { }

  ngOnInit() {
  }

}

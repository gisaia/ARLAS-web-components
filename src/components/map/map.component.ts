import { Component, OnInit, AfterViewInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import * as leaflet from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet-editable';
import 'leaflet.path.drag';

@Component({
  selector: 'arlas-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  private map: leaflet.Map;
  public textButton = 'Add GeoBox';
  private editLayerGroup: L.LayerGroup = new L.LayerGroup();
  private isGeoBox = false;

  @Input() public basemapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
  @Output() public selectedBbox: Subject<Array<number>> = new Subject<Array<number>>();
  @Output() public removeBbox: Subject<boolean> = new Subject<boolean>();

  constructor() {
    this.removeBbox.subscribe(value => {
      if (value) {
        this.editLayerGroup.clearLayers();
      }
    });
  }

  public ngOnInit() { }

  public ngAfterViewInit(): void {

    this.map = leaflet.map('map', <any>{
      center: [48.8534, 2.3488],
      zoom: 10,
      zoomControl: false,
      editable: true,
      editOptions: {
        featuresLayer: this.editLayerGroup,
        zIndex: 2000
      }
    });

    const layer: leaflet.TileLayer = leaflet.tileLayer(this.basemapUrl);
    this.map.addLayer(layer);
    this.map.addLayer(this.editLayerGroup);

    this.map.on('editable:vertex:dragend', (e) => {
      this.setBbox(e);
    });

    this.map.on('editable:dragend ', (e) => {
      this.setBbox(e);
    });
  }

  public toggleGeoBox() {
    this.isGeoBox = !this.isGeoBox;
    if (this.isGeoBox) {
      if (this.editLayerGroup.hasLayer) {
        this.removeBbox.next(true);
      }
      (<any>this.map).editTools.startRectangle();
      this.textButton = 'Remove GeoBox';
    } else {
      this.removeBbox.next(true);
      this.textButton = 'Add GeoBox';

    }
  }
  private setBbox(e: leaflet.Event) {
    const west = (<any>e).layer.getBounds().getWest();
    const north = (<any>e).layer.getBounds().getNorth();
    const east = (<any>e).layer.getBounds().getEast();
    const south = (<any>e).layer.getBounds().getSouth();
    this.selectedBbox.next([north, west, south, east]);
  }
}

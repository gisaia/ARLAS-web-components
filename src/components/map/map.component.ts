import { Component, OnInit, AfterViewInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import * as leaflet from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet-editable';
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
  public map: leaflet.Map;
  private editLayerGroup: L.LayerGroup = new L.LayerGroup();
  private newRectangleControl: leaflet.Control;
  private removeRectangleControl: leaflet.Control;

  @Input() public basemapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
  @Input() public controlButtonPosition = 'topright';
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

    this.setupControls();
    const layer: leaflet.TileLayer = leaflet.tileLayer(this.basemapUrl);
    this.map.addLayer(layer);
    this.map.addLayer(this.editLayerGroup);

    this.map.on('editable:vertex:dragend', (e) => {
      const west = (<any>e).layer.getBounds().getWest();
      const north = (<any>e).layer.getBounds().getNorth();
      const east = (<any>e).layer.getBounds().getEast();
      const south = (<any>e).layer.getBounds().getSouth();
      this.selectedBbox.next([north, west, south, east]);
    });
  }


  private setupControls() {
    const self = this;
    const EditControl = leaflet.Control.extend({
      options: {
        position: this.controlButtonPosition,
        callback: null,
        html: ''
      },
      onAdd: function (this: leaflet.Control) {
        const container = leaflet.DomUtil.create('div', 'leaflet-control leaflet-bar arlas-map-bar-control');
        const link = <HTMLLinkElement>leaflet.DomUtil.create('a', 'arlas-map-button-control', container);
        link.href = '#';
        link.innerHTML = (<any>this.options).html;
        leaflet.DomEvent.on(link, 'click', leaflet.DomEvent.stop)
          .on(link, 'click', function (this: leaflet.Control) {
            (<any>this.options).callback.call(
              (<any>self.map).editTools,
              undefined,

            );
          }, this);
        return container;
      }
    });


    const NewRectangleControl = EditControl.extend({
      options: {
        position: this.controlButtonPosition,
        callback: () => {
          if (this.editLayerGroup.hasLayer) {
            this.removeBbox.next(true);
          }
          (<any>this.map).editTools.startRectangle();
        },
        html: '⬛'
      }
    });
    const RemoveRectangleControl = EditControl.extend({
      options: {
        position: this.controlButtonPosition,
        callback: () => {
          this.removeBbox.next(true);
        },
        html: 'X'
      }
    });
    this.newRectangleControl = new NewRectangleControl();
    this.removeRectangleControl = new RemoveRectangleControl();

    this.map.addControl(this.newRectangleControl);
    this.map.addControl(this.removeRectangleControl);

  }

}

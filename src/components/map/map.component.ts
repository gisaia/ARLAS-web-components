import { Component, OnInit, AfterViewInit, Input, Output, DoCheck, KeyValueDiffers, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import * as leaflet from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet-editable';
import 'leaflet.path.drag';
import './Pattern';
import { decode_bbox } from 'ngeohash';
import * as tinycolor from 'tinycolor2';
@Component({
  selector: 'arlas-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, DoCheck {


  public textButton = 'Add GeoBox';
  private map: leaflet.Map;
  private editLayerGroup: leaflet.LayerGroup = new leaflet.LayerGroup();
  private detailLayerGroup: leaflet.LayerGroup = new leaflet.LayerGroup();
  private detailIdToLayerId: Map<string, number> = new Map<string, number>();
  private geohashLayerGoup: leaflet.LayerGroup = new leaflet.LayerGroup();
  private geohashIdToLayerId: Map<string, number> = new Map<string, number>();
  private maxValueOgGeohash = 0;
  private isGeoBox = false;
  private geoHashDatadiffer: any;
  private detailItemDatadiffer: any;
  private detailStyle: leaflet.PathOptions;

  @Input() public basemapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
  @Input() public imagePath = 'assets/images/';
  @Input() public bboxcolor = 'black';
  @Input() public bboxfill = '#ffffff';
  @Input() public bboxfillOpacity = 0.5;
  @Input() public colorDetail = '#FC9F28';
  @Input() public geohashMapData: Map<string, [number, number]>;
  @Input() public detailItemMapData: Map<string, [string, boolean]>;
  @Input() public lowleveldetailZoom = 1;
  @Input() public mediumleveldetailZoom = 3;
  @Input() public highleveldetailZoom = 8;

  @Output() public onChangeBbox: EventEmitter<Array<number>> = new EventEmitter<Array<number>>();
  @Output() public onRemoveBbox: Subject<boolean> = new Subject<boolean>();

  constructor(private differs: KeyValueDiffers) {

    this.geoHashDatadiffer = differs.find({}).create(null);
    this.detailItemDatadiffer = differs.find({}).create(null);
    leaflet.Icon.Default.imagePath = this.imagePath;
    this.onRemoveBbox.subscribe(value => {
      if (value) {
        this.editLayerGroup.clearLayers();
        this.isGeoBox = false;
        this.textButton = 'Add GeoBox';
      }
    });

  }
  public ngDoCheck(): void {
    const geoHashDataChanges = this.geoHashDatadiffer.diff(this.geohashMapData);
    if (geoHashDataChanges) {
      geoHashDataChanges.forEachChangedItem(r => {
        this.updateGeoHash(r.key.substring(0, 2), r.currentValue);
      });
      geoHashDataChanges.forEachAddedItem(r => { this.addGeoHash(r.key.substring(0, 2), r.currentValue); });
      geoHashDataChanges.forEachRemovedItem(r => { this.removeGeoHash(r.key.substring(0, 2), r.currentValue); });
    }
    const detailItemDataChanges = this.detailItemDatadiffer.diff(this.detailItemMapData);
    if (detailItemDataChanges) {
      detailItemDataChanges.forEachAddedItem(r => { this.addDetailItem(r.key, r.currentValue[0]); });
      detailItemDataChanges.forEachRemovedItem(r => { this.removeDetailItem(r.key); });
      detailItemDataChanges.forEachChangedItem(r => { this.updateDetailItem(r.key, r.currentValue[1]); });

    }

  }
  public ngAfterViewInit(): void {

    this.map = leaflet.map('map', <any>{
      center: [45.706179285330855, 2.1972656250000004],
      zoom: 4,
      attributionControl: false,
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
    this.map.addLayer(this.detailLayerGroup);
    this.map.addLayer(this.geohashLayerGoup);

    this.map.on('zoomstart', (e) => {
      this.map.removeLayer(this.geohashLayerGoup);
    });

    this.map.on('zoomend', (e) => {
      if (this.map.getZoom() < this.highleveldetailZoom) {
        this.map.addLayer(this.geohashLayerGoup);
      }
    });

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
      (<any>this.map).editTools.startRectangle(null, {
        color: this.bboxcolor,
        fillColor: this.bboxfill,
        fillOpacity: this.bboxfillOpacity
      });
      this.textButton = 'Remove GeoBox';
    } else {
      this.onRemoveBbox.next(true);
      this.textButton = 'Add GeoBox';
    }
  }
  private setBbox(e) {
    const west = (<any>e).layer.getBounds().getWest();
    const north = (<any>e).layer.getBounds().getNorth();
    const east = (<any>e).layer.getBounds().getEast();
    const south = (<any>e).layer.getBounds().getSouth();
    this.onChangeBbox.emit([north, west, south, east]);
  }

  private addGeoHash(geohash: string, values: [number, number]) {
    if (values[1] !== 0) {
      const bbox: Array<number> = decode_bbox(geohash);
      const coordinates = [[
        [bbox[3], bbox[2]],
        [bbox[3], bbox[0]],
        [bbox[1], bbox[0]],
        [bbox[1], bbox[2]],
        [bbox[3], bbox[2]],
      ]];
      const style = this.getStyle(values[0], values[1]);
      const polygonGeojson = {
        type: 'Feature',
        properties: {
          syle: style
        },
        geometry: {
          type: 'Polygon',
          coordinates: coordinates
        }
      };
      const layergeojson = leaflet.geoJSON(polygonGeojson.geometry, style);
      layergeojson.setStyle(f => (<any>f.properties).style);
      this.geohashLayerGoup.addLayer(layergeojson);
      this.geohashIdToLayerId.set(geohash, this.geohashLayerGoup.getLayerId(layergeojson));
    }
  }

  private updateGeoHash(geohash: string, values: [number, number]) {
    if (values[1] !== 0) {
      if (this.geohashIdToLayerId.get(geohash) === undefined) {
        this.addGeoHash(geohash, values);
      } else {
        const style = this.getStyle(values[0], values[1]);
        (<any>this.geohashLayerGoup.getLayer(this.geohashIdToLayerId.get(geohash))).setStyle(style);
      }
    }
  }
  private removeGeoHash(geohash: string, values: [number, number]) {
    const layerId = this.geohashIdToLayerId.get(geohash);
    if (layerId !== null || layerId !== undefined) {
      this.geohashLayerGoup.removeLayer(layerId);
      this.geohashIdToLayerId.delete(geohash);
    }

  }

  private addDetailItem(id: string, geometry: string) {
    if (this.detailIdToLayerId.get(id) === null || this.detailIdToLayerId.get(id) === undefined) {
      this.detailStyle = { color: this.colorDetail, opacity: 1, fillOpacity: 1 };
      const detailledLayer = leaflet.geoJSON(<any>geometry, <any>{
        style: {
        }
      });
      detailledLayer.setStyle(f => this.detailStyle);
      this.detailLayerGroup.addLayer(detailledLayer);
      this.detailIdToLayerId.set(id, this.detailLayerGroup.getLayerId(detailledLayer));
    }
  }
  private updateDetailItem(id: string, isleaving: boolean) {
    const layerId = this.detailIdToLayerId.get(id);
    if (layerId !== null || layerId !== undefined) {
      if (this.detailLayerGroup.getLayer(layerId) !== undefined) {
        const layer = <any>this.detailLayerGroup.getLayer(layerId);
        if (isleaving) {
          this.detailStyle.color = this.colorDetail;
        } else {
          this.detailStyle.color = this.bboxcolor;

        }
        layer.setStyle(this.detailStyle);
      }
    }

  }
  private removeDetailItem(id: string) {
    const layerId = this.detailIdToLayerId.get(id);
    if (layerId !== null || layerId !== undefined) {
      this.detailLayerGroup.removeLayer(layerId);
      this.detailIdToLayerId.delete(id);
    }
  }

  private getColor(zeroToOne: number): tinycolorInstance {
    // Scrunch the green/cyan range in the middle
    const sign = (zeroToOne < .5) ? -1 : 1;
    zeroToOne = sign * Math.pow(2 * Math.abs(zeroToOne - .5), .35) / 2 + .5;
    // Linear interpolation between the cold and hot
    const h0 = 259;
    const h1 = 12;
    const h = (h0) * (1 - zeroToOne) + (h1) * (zeroToOne);
    return tinycolor({ h: h, s: 75, v: 90 });
  }
  private getStyle(value: number, maxValue: number): leaflet.PolylineOptions {
    const halfToOne = .5 * value / maxValue * 1.2 + 0.5;
    const color: tinycolorInstance = this.getColor(halfToOne);
    const style: leaflet.PolylineOptions = {
      weight: 0.3,
      opacity: 1,
      fillOpacity: 0.7,
      color: tinycolor('white').toHexString(),
      fillColor: color.toHexString()

    };
    return style;
  }
}

import { Component, OnInit, AfterViewInit, Input, Output, DoCheck, KeyValueDiffers } from '@angular/core';
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
import { GeoJsonObject } from "@types/geojson";
@Component({
  selector: 'arlas-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, DoCheck {

  private map: leaflet.Map;
  public textButton = 'Add GeoBox';
  public detailIdToLayerId: Map<string, number> = new Map<string, number>();
  public geohashIdToLayerId: Map<string, number> = new Map<string, number>();
  private editLayerGroup: L.LayerGroup = new L.LayerGroup();
  private detailLayerGroup: L.LayerGroup = new L.LayerGroup();
  private geohashLayerGoup: L.LayerGroup = new L.LayerGroup();
  private maxValueOgGeohash = 0;
  private isGeoBox = false;
  private differ: any;
  @Input() public basemapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
  @Input() public imagePath = 'assets/images/';
  @Input() public bboxcolor = 'black';
  @Input() public bboxfill = '#ffffff';
  @Input() public bboxfillOpacity = 0.5;
  @Input() public colorDetail = '#FC9F28';
  @Input() public addLayerDetailBus = new Subject<{ geometry: string, id: string }>();
  @Input() public removeLayerDetailBus = new Subject<string>();
  @Input() public onConsultItemSubject = new Subject<string>();
  @Input() public geohashMapData: Map<string, [number, number]>;
  @Output() public selectedBbox: Subject<Array<number>> = new Subject<Array<number>>();
  @Output() public removeBbox: Subject<boolean> = new Subject<boolean>();

  constructor(private differs: KeyValueDiffers) {

    this.differ = differs.find({}).create(null);

    L.Icon.Default.imagePath = 'assets/images/';
    this.removeBbox.subscribe(value => {
      if (value) {
        this.editLayerGroup.clearLayers();
        this.isGeoBox = false;
        this.textButton = 'Add GeoBox';
      }
    });
  }
  ngDoCheck(): void {
    var changes = this.differ.diff(this.geohashMapData);
    if (changes) {
      changes.forEachChangedItem(r => { this.updateGeoHash(r.key.substring(0,2), r.currentValue) });
      changes.forEachAddedItem(r => { this.addGeoHash(r.key.substring(0,2), r.currentValue) });
      changes.forEachRemovedItem(r => { this.removeGeoHash(r.key.substring(0,2), r.currentValue) });
    }
  }
  public ngAfterViewInit(): void {

    this.map = leaflet.map('map', <any>{
      center: [45.706179285330855, 2.1972656250000004],
      zoom: 4,
      zoomControl: false,
      editable: true,
      editOptions: {
        featuresLayer: this.editLayerGroup,
        zIndex: 2000
      }

    });

    const stripes = (<any>L).stripePattern({
      fillOpacity: 1.0,
      patternContentUnits: 'objectBoundingBox',
      patternUnits: 'objectBoundingBox',
      height: 0.2,
      weight: 0.015,
      spaceWeight: 0.5,
      spaceColor: this.colorDetail,
      color: this.colorDetail,
      opacity: 0.9,
      spaceOpacity: 0.4,
      angle: 135
    });

    const detailStyle: any = { color: this.colorDetail, opacity: 1, fillOpacity: 1 };
    stripes.addTo(this.map);

    this.addLayerDetailBus.subscribe(layer => {
      if (this.detailIdToLayerId.get(layer.id) === null || this.detailIdToLayerId.get(layer.id) === undefined) {
        const detailledLayer = leaflet.geoJSON(<any>layer.geometry, <any>{
          style: {
            fillPattern: stripes
          }
        });
        detailledLayer.setStyle(detailStyle);
        this.detailLayerGroup.addLayer(detailledLayer);
        this.detailIdToLayerId.set(layer.id, this.detailLayerGroup.getLayerId(detailledLayer));
      }
    }
    );

    this.removeLayerDetailBus.subscribe(id => {
      if (id === 'all') {
        this.detailLayerGroup.clearLayers();
        this.detailIdToLayerId.clear();

      } else {
        const layerId = this.detailIdToLayerId.get(id);
        if (layerId !== null || layerId !== undefined) {
          this.detailLayerGroup.removeLayer(layerId);
          this.detailIdToLayerId.delete(id);
        }
      }
    });

    this.onConsultItemSubject.subscribe(id => {
      let isleaving = false;
      if (id.split('-')[0] === 'leave') {
        id = id.split('-')[1];
        isleaving = true;
      }
      const layerId = this.detailIdToLayerId.get(id);
      if (layerId !== null || layerId !== undefined) {
        if (this.detailLayerGroup.getLayer(layerId) !== undefined) {
          const layer = <any>this.detailLayerGroup.getLayer(layerId);
          if (isleaving) {
            detailStyle.color = this.colorDetail;
          } else {
            detailStyle.color = this.bboxcolor;

          }
          layer.setStyle(detailStyle);
        }
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
       this.map.addLayer(this.geohashLayerGoup);
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

  private addGeoHash(geohash: string, values: [number, number]) {
    if (values[1] !== 0) {
      const bbox: Array<number> = decode_bbox(geohash)
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
      const layergeojson = leaflet.geoJSON(polygonGeojson.geometry, style)
      layergeojson.setStyle(f => { return (<any>f.properties).style })
      this.geohashLayerGoup.addLayer(layergeojson);
      this.geohashIdToLayerId.set(geohash, this.geohashLayerGoup.getLayerId(layergeojson));
    }
  }

  private updateGeoHash(geohash: string, values: [number, number]) {
    if (values[1] !== 0) {
      if (this.geohashIdToLayerId.get(geohash) === undefined) {
        this.addGeoHash(geohash, values)
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
  private getColor(zeroToOne: number): tinycolor.tinycolorInstance {
    // Scrunch the green/cyan range in the middle
    var sign = (zeroToOne < .5) ? -1 : 1;
    zeroToOne = sign * Math.pow(2 * Math.abs(zeroToOne - .5), .35) / 2 + .5;
    // Linear interpolation between the cold and hot
    var h0 = 259;
    var h1 = 12;
    var h = (h0) * (1 - zeroToOne) + (h1) * (zeroToOne);
    return tinycolor({ h: h, s: 75, v: 90 });
  };
  private getStyle(value: number, maxValue: number): L.PolylineOptions {
    const halfToOne = .5 * value / maxValue * 1.2 + 0.5
    const color: tinycolor.tinycolorInstance = this.getColor(halfToOne);
    const style: L.PolylineOptions = {
      weight: 0.3,
      opacity: 1,
      fillOpacity: 0.7,
      color: tinycolor("white").toHexString(),
      fillColor: color.toHexString()

    };
    return style;
  }
}

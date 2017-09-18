import { OnChanges } from '@angular/core/core';
import { Component, OnInit, AfterViewInit, Input, Output, DoCheck, KeyValueDiffers, EventEmitter, SimpleChanges } from '@angular/core';
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
export class MapComponent implements AfterViewInit, DoCheck, OnChanges {

  public textButton = 'Add GeoBox';
  public textCircleButton = 'Add Circle';
  public textGeohahsButton = 'Add Geohash';
  private map: leaflet.Map;
  private editLayerGroup: leaflet.LayerGroup = new leaflet.LayerGroup();
  private detailLayerGroup: leaflet.LayerGroup = new leaflet.LayerGroup();
  private detailIdToLayerId: Map<string, number> = new Map<string, number>();
  private geohashLayerGoup: leaflet.LayerGroup = new leaflet.LayerGroup();
  private circleLayerGoup: leaflet.LayerGroup = new leaflet.LayerGroup();

  private maxValueOgGeohash = 0;
  private isGeoBox = false;
  private isCircle = false;
  private isGeoHash = false;
  private detailItemDatadiffer: any;
  private stripes: any;
  private detailStyle: leaflet.PathOptions;

  @Input() public basemapUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
  @Input() public imagePath = 'assets/images/';
  @Input() public bboxcolor = 'black';
  @Input() public bboxfill = '#ffffff';
  @Input() public bboxfillOpacity = 0.5;
  @Input() public colorDetail = '#FC9F28';
  @Input() public detailItemMapData: Map<string, [string, boolean]>;
  @Input() public lowleveldetailZoom = 1;
  @Input() public mediumleveldetailZoom = 3;
  @Input() public highleveldetailZoom = 8;
  @Input() public geojsondata: { type: string, features: Array<any> } = {
    'type': 'FeatureCollection',
    'features': []
  };
  @Output() public onChangeBbox: EventEmitter<Array<number>> = new EventEmitter<Array<number>>();
  @Output() public onRemoveBbox: Subject<boolean> = new Subject<boolean>();
  @Output() public onChangeZoom: EventEmitter<number> = new EventEmitter<number>();


  constructor(private differs: KeyValueDiffers) {

    this.detailItemDatadiffer = differs.find({}).create(null);
    leaflet.Icon.Default.imagePath = this.imagePath;
    this.onRemoveBbox.subscribe(value => {
      if (value) {
        this.editLayerGroup.clearLayers();
        this.isGeoBox = false;
        this.textButton = 'Add GeoBox';
      }
    });
    this.stripes = (<any>leaflet).stripePattern({
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
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['geojsondata'] !== undefined) {
      this.geojsondata = changes['geojsondata'].currentValue;
      if (this.isCircle) {
        this.drawCircle();
      }
      if (this.isGeoHash) {
        this.drawGeoHash();
      }
    }
  }

  public ngDoCheck(): void {
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

    this.stripes.addTo(this.map);
    this.map.on('zoomstart', (e) => {
      if (this.isCircle) {
        this.map.removeLayer(this.circleLayerGoup);
      }
      if (this.isGeoHash) {
        this.map.removeLayer(this.geohashLayerGoup);
      }
    });

    this.map.on('zoomend', (e) => {
      if (this.isCircle) {
        this.map.addLayer(this.circleLayerGoup);
      }
      if (this.isGeoHash) {
        this.map.addLayer(this.geohashLayerGoup);
      }
      this.onChangeZoom.next(this.map.getZoom());
    });
    this.map.on('editable:vertex:dragend', (e) => {
      this.setBbox(e);
    });

    this.map.on('editable:dragend ', (e) => {
      this.setBbox(e);
    });
  }
  public toggleCircle() {
    this.isCircle = !this.isCircle;
    if (this.isCircle) {
      this.drawCircle();
      this.textCircleButton = 'Remove Circle';
    } else {
      this.map.removeLayer(this.circleLayerGoup);
      this.textCircleButton = 'Add Circle';
      this.isCircle = false;
    }
  }

  public toggleGeohash() {
    this.isGeoHash = !this.isGeoHash;
    if (this.isGeoHash) {
      this.drawGeoHash();
      this.textGeohahsButton = 'Remove GeoHash';
    } else {
      this.map.removeLayer(this.geohashLayerGoup);
      this.textGeohahsButton = 'Add GeoHash';
      this.isGeoHash = false;
    }
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

  private drawGeoHash() {
    const geohashLayer = leaflet.geoJSON(this.geojsondata, {
      filter: function (feature) {
        if (feature.geometry.type === 'Polygon') {
          return true;
        }
      }
    });
    this.geohashLayerGoup.clearLayers();
    this.geohashLayerGoup.addLayer(geohashLayer);
    geohashLayer.setStyle(f => ({ fillColor: (<any>f.properties).color, opacity: 0, fillOpacity: 0.7 }));
    this.map.addLayer(this.geohashLayerGoup);


  }
  private drawCircle() {
    const cricleLayer = leaflet.geoJSON(this.geojsondata, {
      filter: function (feature) {
        if (feature.geometry.type === 'Point') {
          return true;
        }
      },
      pointToLayer: function (feature, latlng) {
        return leaflet.circleMarker(latlng, {
          radius: feature.properties['radius'],
          fillColor: feature.properties['color'],
          weight: 1,
          fillOpacity: 0.7,
          opacity: 0
        });
      }
    });
    this.circleLayerGoup.clearLayers();
    this.circleLayerGoup.addLayer(cricleLayer);
    this.map.addLayer(this.circleLayerGoup);

  }

  private setBbox(e) {
    const west = (<any>e).layer.getBounds().getWest();
    const north = (<any>e).layer.getBounds().getNorth();
    const east = (<any>e).layer.getBounds().getEast();
    const south = (<any>e).layer.getBounds().getSouth();
    this.onChangeBbox.emit([north, west, south, east]);
  }

  private addDetailItem(id: string, geometry: string) {
    if (this.detailIdToLayerId.get(id) === null || this.detailIdToLayerId.get(id) === undefined) {
      this.detailStyle = { color: this.colorDetail, opacity: 1, fillOpacity: 1 };
      const detailledLayer = leaflet.geoJSON(<any>geometry, <any>{
        style: {
          fillPattern: this.stripes
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
}

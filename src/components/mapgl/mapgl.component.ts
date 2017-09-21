import { UrlMatchResult } from '@angular/router/router';
import { Url } from 'url';
import {
  Component, OnInit, Input, Output, KeyValueDiffers, AfterViewInit,
  SimpleChanges, EventEmitter, OnChanges
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { decode_bbox } from 'ngeohash';
import * as tinycolor from 'tinycolor2';
import * as supercluster from 'supercluster';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import { paddedBounds } from './mapgl.component.util';


export interface OnMoveResult {
  zoom: number;
  center: Array<number>;
  extend: Array<number>;
  extendForLoad: Array<number>;
  extendForTest: Array<number>;
}

export enum drawType {
  RECTANGLE,
  CIRCLE
}

@Component({
  selector: 'arlas-mapgl',
  templateUrl: './mapgl.component.html',
  styleUrls: ['./mapgl.component.css']
})

export class MapglComponent implements OnInit, AfterViewInit, OnChanges {
  public textButton = 'Add GeoBox';
  public textCircleButton = 'Add Circle';
  public textGeohahsButton = 'Add Geohash';
  private emptyData = {
    'type': 'FeatureCollection',
    'features': []
  };
  private map;
  private index;
  private north;
  private east;
  private west;
  private south;
  private zoom;
  private isGeoBox = false;
  private isCircle = false;
  private isGeoHash = false;
  private start;
  private canvas;
  private box;
  private current;
  private startlngLat: mapboxgl.LngLat = {};
  private endlngLat: mapboxgl.LngLat = {};
  private geoboxdata: { type: string, features: Array<any> } = this.emptyData;
  private maxCountValue = 0;
  private cluster;
  @Input() public basemapUrl = 'http://osm-liberty.lukasmartinelli.ch/style.json';
  @Input() public drawType: drawType = drawType.CIRCLE;
  @Input() public countPath = 'point_count';
  @Input() public countNormalizePath = 'point_count_normalize';
  @Input() public circleSize: number;
  @Input() public paintRuleGeoBox: Object;
  @Input() public paintRuleCLusterFeatureFill: Object;
  @Input() public paintRuleClusterFeatureLine: Object;
  @Input() public paintRuleClusterCircle: Object;

  @Input() public useMapBoxCluster: boolean;
  @Input() public margePanForLoad: number;
  @Input() public margePanForTest: number;
  @Input() public geojsondata: { type: string, features: Array<any> } = this.emptyData;
  @Input() public redrawClientCluster: Subject<boolean>;
  @Input() public fitBoundsBus: Subject<Array<Array<number>>>;
  @Output() public onRemoveBbox: Subject<boolean> = new Subject<boolean>();
  @Output() public onChangeBbox: EventEmitter<Array<number>> = new EventEmitter<Array<number>>();
  @Output() public onMove: EventEmitter<OnMoveResult> = new EventEmitter<OnMoveResult>();

  constructor() {
    this.onRemoveBbox.subscribe(value => {
      if (value) {
        this.geoboxdata = this.emptyData;
        this.map.getSource('geobox').setData(this.geoboxdata);
        this.isGeoBox = false;
        this.textButton = 'Add GeoBox';
      }
    });

  }

  public ngOnInit() {
    this.map = new mapboxgl.Map({
      container: 'mapgl',
      style: this.basemapUrl,
      center: [2.1972656250000004, 45.706179285330855],
      zoom: 2,
      renderWorldCopies: false
    });
    this.map.boxZoom.disable();
  }
  public ngOnChanges(changes: SimpleChanges): void {

    if (changes['useMapBoxCluster'] !== undefined) {
      this.useMapBoxCluster = changes['useMapBoxCluster'].currentValue;
    }
    if (this.map !== undefined) {
      if (this.map.getSource('cluster') !== undefined) {
        if (changes['geojsondata'] !== undefined) {
          this.geojsondata = changes['geojsondata'].currentValue;
          if (this.useMapBoxCluster) {
            this.map.getSource('cluster').setData(this.emptyData);
            this.index = supercluster({
              radius: 50,
              maxZoom: 22
            });
            this.index.load(<any>this.geojsondata.features);
            this.cluster = this.index.getClusters([this.west, this.south, this.east, this.north], Math.ceil(this.zoom) - 1);
            this.cluster.forEach(c => {
              if (this.maxCountValue <= c.properties[this.countPath]) {
                this.maxCountValue = c.properties[this.countPath];
              }
            });
            this.cluster.forEach(c => {
              if (c.properties.cluster) {
                c.properties[this.countNormalizePath] = c.properties[this.countPath] / this.maxCountValue * 100;
              } else {
                c.geometry = c.properties.featuregeometry;
              }
            });
            this.map.getSource('cluster').setData({
              'type': 'FeatureCollection',
              'features': this.cluster
            });
          } else {
            this.map.getSource('cluster').setData(this.geojsondata);
            this.maxCountValue = 0;
          }

        }
      }
    }
  }

  public ngAfterViewInit() {
    this.redrawClientCluster.subscribe(value => {
      if (value) {
        this.cluster = this.index.getClusters([this.west, this.south, this.east, this.north], Math.ceil(this.zoom) - 1);
        this.cluster.forEach(c => {
          if (this.maxCountValue <= c.properties[this.countPath]) {
            this.maxCountValue = c.properties[this.countPath];
          }
        });
        this.cluster.forEach(c => {
          if (c.properties.cluster) {
            c.properties[this.countNormalizePath] = c.properties[this.countPath] / this.maxCountValue * 100;
          } else {
            c.geometry = c.properties.featuregeometry;
          }
        });
        this.map.getSource('cluster').setData({
          'type': 'FeatureCollection',
          'features': this.cluster
        });
      }
    });
    this.fitBoundsBus.subscribe(value => { this.map.fitBounds(value); });
    this.map.on('load', () => {
      this.map.addSource('cluster', {
        'type': 'geojson',
        'data': this.geojsondata
      });
      // Add GeoBox Source
      this.map.addSource('geobox', {
        'type': 'geojson',
        'data': this.geoboxdata
      });
      // Add GeoBox Lae-yer
      this.map.addLayer({
        'id': 'geobox',
        'type': 'fill',
        'source': 'geobox',
        'layout': {
          'visibility': 'visible'
        },
        'paint': this.paintRuleGeoBox
      });
      if (this.drawType === drawType.RECTANGLE) {
        this.map.addLayer({
          'id': 'polygon',
          'type': 'fill',
          'source': 'cluster',
          'layout': {
            'visibility': 'visible'
          },
          'paint': {
            'fill-color': {
              'type': 'identity',
              'property': 'color'
            },
            'fill-opacity': 0.7
          },
          'filter': ['==', '$type', 'Polygon'],
        });
      } else {
        this.map.addLayer({
          'id': 'point',
          'type': 'circle',
          'source': 'cluster',
          'layout': {
            'visibility': 'visible'
          },
          paint: this.paintRuleClusterCircle,
          'filter': [
            'all', [
              'has',
              this.countNormalizePath,
            ], ['==', '$type', 'Point']
          ]
        });

        this.map.addLayer({
          'id': 'cluster-count',
          'type': 'symbol',
          'source': 'cluster',
          'filter': ['has', this.countPath],
          'layout': {
            'text-field': '{' + this.countPath + '}',
            'text-font': ['Roboto Regular'],
            'text-size': 12,
            'visibility': 'visible'
          }
        });

        this.map.addLayer({
          'id': 'features-line',
          'type': 'line',
          'source': 'cluster',
          'filter': [
            'all', [
              'has',
              'featureid',
            ], ['==', '$type', 'Polygon']
          ],
          'paint': this.paintRuleClusterFeatureLine
        });
        this.map.addLayer({
          'id': 'features-fill',
          'type': 'fill',
          'source': 'cluster',
          'filter': [
            'all', [
              'has',
              'featureid',
            ], ['==', '$type', 'Polygon']
          ],
          'paint': this.paintRuleCLusterFeatureFill
        });
      }

      this.canvas = this.map.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);

    });
    this.map.on('moveend', () => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();
      const onMoveData: OnMoveResult = {
        zoom: this.zoom,
        center: this.map.getCenter(),
        extend: [this.north, this.west, this.south, this.east],
        extendForLoad: [],
        extendForTest: []
      };
      const canvas = this.map.getCanvasContainer();
      const positionInfo = canvas.getBoundingClientRect();
      const height = positionInfo.height;
      const width = positionInfo.width;
      const panLoad = this.margePanForLoad * Math.max(height, width) / 100;
      const panTest = this.margePanForTest * Math.max(height, width) / 100;
      const extendForLoadLatLng = paddedBounds(panLoad, panLoad, panLoad, panLoad,
        this.map, this.map.getBounds()._sw, this.map.getBounds()._ne);
      const extendForTestdLatLng = paddedBounds(panTest, panTest, panTest, panTest,
        this.map, this.map.getBounds()._sw, this.map.getBounds()._ne);
      onMoveData.extendForLoad = [
        Math.min(extendForLoadLatLng[1].lat, 90),
        Math.max(extendForLoadLatLng[0].lng, -180),
        Math.max(extendForLoadLatLng[0].lat, -90),
        Math.min(extendForLoadLatLng[1].lng, 180)
      ];
      onMoveData.extendForTest = [
        Math.min(extendForTestdLatLng[1].lat, 90),
        Math.max(extendForTestdLatLng[0].lng, -180),
        Math.max(extendForTestdLatLng[0].lat, -90),
        Math.min(extendForTestdLatLng[1].lng, 180)
      ];
      this.onMove.next(onMoveData);
    });
    this.map.on('mousedown', (e) => {
      if (this.isGeoBox) {
        this.startlngLat = e.lngLat;
      } else {
        this.startlngLat = undefined;
      }
    });
    this.map.on('mouseup', (e) => {
      if (this.isGeoBox) {
        this.endlngLat = e.lngLat;
      } else {
        this.endlngLat = undefined;
      }
    });
  }
  public toggleGeoBox() {
    this.isGeoBox = !this.isGeoBox;
    if (this.isGeoBox) {
      this.map.getCanvas().style.cursor = 'crosshair';
      this.textButton = 'Remove GeoBox';
    } else {
      this.map.getCanvas().style.cursor = '';
      this.geoboxdata = {
        type: 'FeatureCollection',
        features: []
      };
      this.map.getSource('geobox').setData(this.geoboxdata);
      this.onRemoveBbox.next(true);
      this.textButton = 'Add GeoBox';
    }
  }


  private mousedown = (e) => {
    // Continue the rest of the function if we add a geobox.
    if (!this.isGeoBox || this.geoboxdata.features.length > 0) { return; }
    // Disable default drag zooming when we add a geobox.
    this.map.dragPan.disable();
    // Call functions for the following events
    document.addEventListener('mousemove', this.mousemove);
    document.addEventListener('mouseup', this.mouseup);
    // Capture the first xy coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.start = new mapboxgl.Point(
      e.clientX - rect.left - this.canvas.clientLeft,
      e.clientY - rect.top - this.canvas.clientTop
    );
  }
  private mousemove = (e) => {
    // Capture the ongoing xy coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.current = new mapboxgl.Point(
      e.clientX - rect.left - this.canvas.clientLeft,
      e.clientY - rect.top - this.canvas.clientTop
    );
    // Append the box element if it doesnt exist
    if (this.box === undefined) {
      this.box = document.createElement('div');
      this.box.classList.add('boxdraw');
      this.canvas.appendChild(this.box);
    }

    const minX = Math.min(this.start.x, this.current.x);
    const maxX = Math.max(this.start.x, this.current.x);
    const minY = Math.min(this.start.y, this.current.y);
    const maxY = Math.max(this.start.y, this.current.y);

    // Adjust width and xy position of the box element ongoing
    const pos = 'translate(' + minX + 'px,' + minY + 'px)';
    this.box.style.transform = pos;
    this.box.style.WebkitTransform = pos;
    this.box.style.width = maxX - minX + 'px';
    this.box.style.height = maxY - minY + 'px';
  }
  private mouseup = (e) => {
    const rect = this.canvas.getBoundingClientRect();
    const f = new mapboxgl.Point(
      e.clientX - rect.left - this.canvas.clientLeft,
      e.clientY - rect.top - this.canvas.clientTop
    );
    // Capture xy coordinates
    this.finish([[this.start, f], [e.lngLat]]);
  }

  private finish(bbox?) {
    // Remove these events now that finish has been called.
    document.removeEventListener('mousemove', this.mousemove);
    document.removeEventListener('mouseup', this.mouseup);
    if (bbox) {
      this.map.getCanvas().style.cursor = '';
      this.map.dragPan.enable();
      const startlng: number = this.startlngLat.lng;
      const endlng: number = this.endlngLat.lng;
      const startlat: number = this.startlngLat.lat;
      const endlat: number = this.endlngLat.lat;
      const west = Math.min(startlng, endlng);
      const north = Math.max(startlat, endlat);
      const east = Math.max(startlng, endlng);
      const south = Math.min(startlat, endlat);
      this.onChangeBbox.emit([north, west, south, east]);
      const coordinates = [[
        [east, south],
        [east, north],
        [west, north],
        [west, south],
        [east, south],
      ]];
      const polygonGeojson = {
        type: 'Feature',
        properties: {
        },
        geometry: {
          type: 'Polygon',
          coordinates: coordinates
        }
      };
      this.geoboxdata = {
        type: 'FeatureCollection',
        features: [polygonGeojson]
      };
      this.map.getSource('geobox').setData(this.geoboxdata);
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
  }
}

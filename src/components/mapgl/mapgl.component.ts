import { ProductIdentifier } from '../results/utils/results.utils';

import {
  Component, OnInit, Input, Output, KeyValueDiffers, AfterViewInit,
  SimpleChanges, EventEmitter, OnChanges
} from '@angular/core';
import { Http, Response } from '@angular/http';

import { Subject } from 'rxjs/Subject';
import * as tinycolor from 'tinycolor2';
import { paddedBounds } from './mapgl.component.util';
import { LngLat } from 'mapbox-gl';


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
  private emptyData = {
    'type': 'FeatureCollection',
    'features': []
  };
  private map: any;
  private index: any;
  private north: number;
  private east: number;
  private west: number;
  private south: number;
  private zoom: number;
  private isGeoBox = false;
  private isCircle = false;
  private isGeoHash = false;
  private start: mapboxgl.Point;
  private canvas: HTMLElement;
  private box: HTMLElement;
  private current: mapboxgl.Point;
  private startlngLat: any;
  private endlngLat: any;
  private geoboxdata: { type: string, features: Array<any> } = this.emptyData;
  private maxCountValue = 0;
  private cluster: any;
  private showAllFeature = false;
  @Input() public style = 'http://osm-liberty.lukasmartinelli.ch/style.json';
  @Input() public fontClusterlabel = 'Roboto Regular';
  @Input() public sizeClusterlabel = 12;
  @Input() public initZoom = 2;
  @Input() public initCenter = [2.1972656250000004, 45.706179285330855];
  @Input() public drawType: drawType = drawType.CIRCLE;
  @Input() public countPath = 'point_count';
  @Input() public countNormalizePath = 'point_count_normalize';
  @Input() public paintRuleGeoBox: Object = {};
  @Input() public paintRuleCLusterFeatureFill: Object = {};
  @Input() public paintRuleClusterFeatureLine: Object = {};
  @Input() public paintRuleClusterCircle: Object = {};
  @Input() public margePanForLoad: number;
  @Input() public margePanForTest: number;
  @Input() public geojsondata: { type: string, features: Array<any> } = this.emptyData;
  @Input() public boundsToFit: Array<Array<number>>;
  @Input() public featureToHightLight: {
    isleaving: boolean,
    productIdentifier: ProductIdentifier
  };
  @Output() public onRemoveBbox: Subject<boolean> = new Subject<boolean>();
  @Output() public onChangeBbox: EventEmitter<Array<number>> = new EventEmitter<Array<number>>();
  @Output() public onMove: EventEmitter<OnMoveResult> = new EventEmitter<OnMoveResult>();

  constructor(private http: Http) {
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
      style: this.style,
      center: this.initCenter,
      zoom: this.initZoom,
      renderWorldCopies: false
    });
    this.map.boxZoom.disable();
  }
  public ngOnChanges(changes: SimpleChanges): void {

    if (this.map !== undefined) {
      if (this.map.getSource('cluster') !== undefined) {
        if (changes['geojsondata'] !== undefined) {
          this.geojsondata = changes['geojsondata'].currentValue;
          this.map.getSource('cluster').setData(this.geojsondata);
          this.maxCountValue = 0;
        }
      }
      if (changes['boundsToFit'] !== undefined) {
        const newBoundsToFit = changes['boundsToFit'].currentValue;
        this.map.fitBounds(newBoundsToFit);
      }
      if (changes['featureToHightLight'] !== undefined) {
        const featureToHightLight = changes['featureToHightLight'].currentValue;
        this.highlightFeature(featureToHightLight);
      }
    }
  }

  public ngAfterViewInit() {
    this.map.on('load', () => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();

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
          'id': 'geohash',
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
          'id': 'features-line',
          'type': 'line',
          'source': 'cluster',
          'filter': [
            'all', ['!=', '$type', 'Point']
          ],
          'paint': this.paintRuleClusterFeatureLine
        });
        this.map.addLayer({
          'id': 'features-line-hover',
          'type': 'line',
          'source': 'cluster',
          'layout': {
            'visibility': 'none'
          },
          'filter': [
            'all', ['!=', '$type', 'Point']
          ],
          'paint': {
            'line-color': '#627BC1',
            'line-opacity': 1,
            'line-width': 5
          }
        });


        this.map.addLayer({
          'id': 'features-fill',
          'type': 'fill',
          'source': 'cluster',
          'filter': [
            'all', ['!=', '$type', 'Point']
          ],
          'paint': this.paintRuleCLusterFeatureFill
        });
        this.map.addLayer({
          'id': 'cluster',
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
          'filter': [
            'all', [
              'has',
              this.countPath,
            ], ['==', '$type', 'Point']
          ],
          'layout': {
            'text-field': '{' + this.countPath + '}',
            'text-font': [this.fontClusterlabel],
            'text-size': 12,
            'visibility': 'visible'
          }
        });
      }

      this.map.on('click', 'features-fill', (e) => {
      });
      this.map.on('mousemove', 'features-fill', (e) => {
      });
      this.map.on('mouseleave', 'features-fill', (e) => {

      });
      this.map.on('click', 'cluster', (e) => {
        if (e.features[0].properties.cluster_id !== undefined) {
          const expansionZoom = this.index.getClusterExpansionZoom(e.features[0].properties.cluster_id);
          this.map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: expansionZoom });
        } else {
          const zoom = this.map.getZoom();
          let newZoom: number;
          if (zoom >= 0 && zoom < 3) {
            newZoom = 4;
          } else if (zoom >= 3 && zoom < 5) {
            newZoom = 5;
          } else if (zoom >= 5 && zoom < 7) {
            newZoom = 7;
          } else if (zoom >= 7 && zoom < 10) {
            newZoom = 10;
          } else if (zoom >= 10 && zoom < 11) {
            newZoom = 11;
          } else {
            newZoom = 12;
          }
          this.map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: newZoom });

        }
      });
      this.map.on('mousemove', 'cluster', (e) => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', 'cluster', (e) => {
        this.map.getCanvas().style.cursor = '';
      });
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


  private highlightFeature(featureToHightLight: {
    isleaving: boolean,
    productIdentifier: ProductIdentifier
  }) {
    this.map.setLayoutProperty('features-line-hover', 'visibility', 'visible');
    if (!featureToHightLight.isleaving) {
      this.map.setFilter('features-line-hover', ['all', ['!=', '$type', 'Point'], ['==',
        featureToHightLight.productIdentifier.idFieldName,
        featureToHightLight.productIdentifier.idValue]]
      );
    } else {

      this.map.setFilter('features-line-hover', ['all', ['!=', '$type', 'Point'], ['==',
        featureToHightLight.productIdentifier.idFieldName,
        ' ']]);
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
    this.box.style.webkitTransform = pos;
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

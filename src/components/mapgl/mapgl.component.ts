import { ElementIdentifier } from '../results/utils/results.utils';
import { bboxes } from 'ngeohash';
import {
  Component, OnInit, Input, Output, KeyValueDiffers, AfterViewInit,
  SimpleChanges, EventEmitter, OnChanges
} from '@angular/core';
import { Http, Response } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import * as tinycolor from 'tinycolor2';
import { paddedBounds, xyz } from './mapgl.component.util';
import { element } from 'protractor';
import { DoCheck, IterableDiffers } from '@angular/core';
import { PitchToggle, ControlButton } from './mapgl.component.control';
import { Observable } from 'rxjs/Observable';
import { MapDataEvent } from "mapbox-gl";

export interface OnMoveResult {
  zoom: number;
  center: Array<number>;
  extend: Array<number>;
  extendForLoad: Array<number>;
  extendForTest: Array<number>;
  tiles: Array<{ x: number, y: number, z: number }>;
  geohash: Array<string>;
}

export enum drawType {
  RECTANGLE,
  CIRCLE
}

/**
 * Mapgl Component allows to display and select geometrical data on a map.
 */

@Component({
  selector: 'arlas-mapgl',
  templateUrl: './mapgl.component.html',
  styleUrls: ['./mapgl.component.css']
})

export class MapglComponent implements OnInit, AfterViewInit, OnChanges {
  public map: any;
  private emptyData = {
    'type': 'FeatureCollection',
    'features': []
  };
  private index: any;
  private north: number;
  private east: number;
  private west: number;
  private south: number;
  private zoom: number;
  private isDrawingBbox = false;
  private isCircle = false;
  private isGeoHash = false;
  private start: mapboxgl.Point;
  private canvas: HTMLElement;
  private box: HTMLElement;
  private current: mapboxgl.Point;
  private startlngLat: any;
  private endlngLat: any;
  private maxCountValue = 0;
  private cluster: any;
  private showAllFeature = false;

  /**
   * @Input : Angular
   * @description Style of the map
   */
  @Input() public style = 'http://osm-liberty.lukasmartinelli.ch/style.json';
  /**
   * @Input : Angular
   * @description Font name of clusters labels.
   */
  @Input() public fontClusterlabel = 'Roboto Regular';
  /**
   * @Input : Angular
   * @description Size of clusters labels
   */
  @Input() public sizeClusterlabel = 12;
  /**
   * @Input : Angular
   * @description Zoom of the map when it's initialized
   */
  @Input() public initZoom = 2;
  /**
   * @Input : Angular
   * @description Coordinates of the map's centre.
   */
  @Input() public initCenter = [2.1972656250000004, 45.706179285330855];
  /**
   * @Input : Angular
   * @description Geometry type of clusters : Rectangles or Circles.
   */
  @Input() public drawType: drawType;
  /**
   * @Input : Angular
   * @description Path to the count property in clusters features.
   */
  @Input() public countPath = 'point_count';
  /**
   * @Input : Angular
   * @description Path to the normalized count property in clusters features.
   */
  @Input() public countNormalizePath = 'point_count_normalize';
  /**
   * @Input : Angular
   * @description Sets the style of geobox.
   */
  @Input() public paintRuleGeoBox: Object = {};
  /**
   * @Input : Angular
   * @description Sets the style of feature's fill.
   * @example paintRuleGeoBox = {line-color: '#AAAAAA', line-opacity: 0.2}
   */
  @Input() public paintRuleFeatureFill: Object = {};
  /**
   * @Input : Angular
   * @description Sets the style of feature's lines.
   */
  @Input() public paintRuleFeatureLine: Object = {};
  /**
   * @Input : Angular
   * @description Sets the style of circular clusters.
   */
  @Input() public paintRuleClusterCircle: Object = {};
  /**
   * @Input : Angular
   * @description Sets the style of rectangular clusters lines.
   */
  @Input() public paintRuleClusterLineRectangle: Object = {};
  /**
   * @Input : Angular
   * @description Sets the style of rectangular clusters fill.
   */
  @Input() public paintRuleClusterFillRectangle: Object = {};
  /**
   * @Input : Angular
   * @description Sets the style of ponctual features.
   */
  @Input() public paintRuleFeatureCirclePoint: Object = {};
  /**
   * @Input : Angular
   * @description Margin applied to the map extent. Data is loaded in all this extent
   */
  @Input() public margePanForLoad: number;
  /**
   * @Input : Angular
   * @description Margin applied to the map extent.
   * Before loading data, the components checks first if there are features  already loaded in this extent.
   */
  @Input() public margePanForTest: number;
  /**
   * @Input : Angular
   * @description The data displayed on map.
   */
  @Input() public geojsondata: { type: string, features: Array<any> } = this.emptyData;
  /**
   * @Input : Angular
   * @description The geobox feature.
   */
  @Input() public geoboxdata: { type: string, features: Array<any> } = this.emptyData;
  /**
   * @Input : Angular
   * @description the field name of ids.
   */
  @Input() public idFeatureField: string;
  /**
   * @Input : Angular
   * @description Bounds that the view map fits. It's an array of two corners. Each corner is an lat-long position :
   * For example : boundsToFit = [[30.51, -54.3],[30.57, -54.2]]
   */
  @Input() public boundsToFit: Array<Array<number>>;
  /**
   * @Input : Angular
   * @description The padding added in the top-left and bottom-right corners of a map container that shouldn't be accounted
   * for when setting the view to fit bounds.
   */
  @Input() public fitBoundsOffSet: Array<number> = [0, 0];
  /**
   * @Input : Angular
   * @description The maximum zoom level so that the bounds fit the map view.
   */
  @Input() public fitBoundsMaxZoom = 22;
  /**
   * @Input : Angular
   * @description Feature to highlight.
   */
  @Input() public featureToHightLight: {
    isleaving: boolean,
    elementidentifier: ElementIdentifier
  };
  /**
   * @Input : Angular
   * @description List of feature to select.
   */
  @Input() public featuresToSelect: Array<ElementIdentifier>;
  /**
   * @Input : Angular
   * @description List of triplet zoom-level-precision to associate a couple level-precision for each zoom.
   */
  @Input() public zoomToPrecisionCluster: Array<Array<number>>;
  /**
   * @Input : Angular
   * @description A couple of (max precision, max geohash-level) above which data is displayed as features
   */
  @Input() private maxPrecision: Array<number>;
  /**
   * @Output : Angular
   * @description Emits the event of whether redraw the tile.
   */

  @Output() public redrawTile: Subject<boolean> = new Subject<boolean>();
  /**
   * @Output : Angular
   * @description Emits the event of removing the geobox.
   */
  @Output() public onRemoveBbox: Subject<boolean> = new Subject<boolean>();
  /**
   * @Output : Angular
   * @description Emits an event at the end of drawing a geobox.
   */
  @Output() public onChangeBbox: EventEmitter<Array<Object>> = new EventEmitter<Array<Object>>();
  /**
   * @Output : Angular
   * @description Emits the event of moving the map.
   */
  @Output() public onMove: EventEmitter<OnMoveResult> = new EventEmitter<OnMoveResult>();
  /**
   * @Output : Angular
   * @description Emits the event of clicking on a feature.
   */
  @Output() public onFeatureClic: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();
  /**
   * @Output : Angular
   * @description Emits the event of hovering feature.
   */
  @Output() public onFeatureOver: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

  public isloaded = false;

  constructor(private http: Http, private differs: IterableDiffers) {
    this.onRemoveBbox.subscribe(value => {
      if (value) {
        this.geoboxdata = this.emptyData;
        if (this.map.getSource('geobox') !== undefined) {
          this.map.getSource('geobox').setData(this.geoboxdata);
        }
      }
    });
  }

  public ngOnInit() {

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
      if (this.map.getSource('geobox') !== undefined) {
        if (changes['geoboxdata'] !== undefined) {
          this.map.getSource('geobox').setData(this.geoboxdata);
        }
      }
      if (changes['boundsToFit'] !== undefined) {
        const newBoundsToFit = changes['boundsToFit'].currentValue;
        const canvas = this.map.getCanvasContainer();
        const positionInfo = canvas.getBoundingClientRect();
        const width = positionInfo.width;
        this.map.fitBounds(newBoundsToFit, {
          maxZoom: this.fitBoundsMaxZoom,
          offset: this.fitBoundsOffSet
        });
      }
      if (changes['featureToHightLight'] !== undefined) {
        const featureToHightLight = changes['featureToHightLight'].currentValue;
        this.highlightFeature(featureToHightLight);
      }
      if (changes['featuresToSelect'] !== undefined) {
        const featuresToSelect = changes['featuresToSelect'].currentValue;
        this.selectFeatures(featuresToSelect);
      }
    }
  }

  public ngAfterViewInit() {
    this.map = new mapboxgl.Map({
      container: 'mapgl',
      style: this.style,
      center: this.initCenter,
      zoom: this.initZoom,
      renderWorldCopies: true
    });
    const nav = new mapboxgl.NavigationControl();
    this.map.addControl(nav, 'top-right');
    this.map.addControl(new PitchToggle(-20, 70, 11), 'top-right');
    const addGeoboxicon = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJ' +
      'odHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+' +
      'IDxnPiAgPHRpdGxlPmJhY2tncm91bmQ8L3RpdGxlPiAgPHJlY3QgZmlsbD0ibm9uZSIgaWQ9ImNhbnZhc19iY' +
      'WNrZ3JvdW5kIiBoZWlnaHQ9Ij' +
      'QwMiIgd2lkdGg9IjU4MiIgeT0iLTEiIHg9Ii0xIi8+IDwvZz4gPGc+ICA8dGl0bGU+TGF5ZXIgMTwvd' +
      'Gl0bGU+ICA8cGF0aCBpZD0ic3ZnXzEiIG' +
      'ZpbGw9Im5vbmUiIGQ9Im0wLDBsMjQsMGwwLDI0bC0yNCwwbDAsLTI0eiIvPiAgPHBhdGggaWQ9InN2Z' +
      '18yIiAgc3R5bGU9J2ZpbGw6IzMzMzMzMz' +
      'snIGQ9Im0yMSwzbC0xOCwwYy0xLjExLDAgLTIsMC44OSAtMiwybDAsMTJjMCwxLjEgMC44OSwyIDIsMmw1LD' +
      'BsOCwwbDUsMGMxLjEsMCAxLjk5LC' +
      '0wLjkgMS45OSwtMmwwLjAxLC0xMmMwLC0xLjExIC0wLjksLTIgLTIsLTJ6bTAsMTRsLTE4LDBsMCwtMT' +
      'JsMTgsMGwwLDEyem0tNSwtN2wwLDJsL' +
      'TMsMGwwLDNsLTIsMGwwLC0zbC0zLDBsMCwtMmwzLDBsMCwtM2wyLDBsMCwzbDMsMHoiLz4gPC9nPjwvc3ZnPg==)';
    const removeGeoboxicon = 'url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB' +
      '2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIg' +
      'eG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTYgMTljMCAxLjEuOSAyIDIgMmg4YzEuMSAwIDItLjkgMi0yVjdIN' +
      'nYxMnpNMTkgNGgtMy41bC0xLTFoLTVsLTEgMUg1djJoMTRWNHoiLz4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZml' +
      'sbD0ibm9uZSIvPjwvc3ZnPg==)';


    const addGeoBoxButton = new ControlButton('addgeobox', addGeoboxicon);
    const removeBoxButton = new ControlButton('removegeobox', removeGeoboxicon);
    this.map.addControl(addGeoBoxButton, 'top-right');
    this.map.addControl(removeBoxButton, 'top-right');
    addGeoBoxButton.btn.onclick = () => {
      this.addGeoBox();
    };
    removeBoxButton.btn.onclick = () => {
      this.removeGeoBox();
    };
    this.map.boxZoom.disable();
    this.map.on('load', () => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();
      // Add GeoBox Source
      this.map.addSource('geobox', {
        'type': 'geojson',
        'data': this.geoboxdata
      });
      this.map.addSource('cluster', {
        'type': 'geojson',
        'data': this.geojsondata
      });

      // Add GeoBox Lae-yer
      this.map.addLayer({
        'id': 'geobox',
        'type': 'line',
        'source': 'geobox',
        'layout': {
          'visibility': 'visible'
        },
        'paint': this.paintRuleGeoBox
      });
      if (this.drawType === drawType.RECTANGLE) {
        this.map.addLayer({
          'id': 'cluster',
          'type': 'fill',
          'source': 'cluster',
          'layout': {
            'visibility': 'visible'
          },
          'paint': this.paintRuleClusterFillRectangle,
          'filter': ['==', '$type', 'Polygon'],
        });

        this.map.addLayer({
          'id': 'cluster-line',
          'type': 'line',
          'source': 'cluster',
          'layout': {
            'visibility': 'visible'
          },
          'paint': this.paintRuleClusterLineRectangle,
          'filter': ['==', '$type', 'Polygon'],
        });
      } else {
        this.map.addLayer({
          'id': 'cluster',
          'type': 'circle',
          'source': 'cluster',
          'layout': {
            'visibility': 'visible'
          },
          'paint': this.paintRuleClusterCircle,
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


      this.map.addLayer({
        'id': 'features-line',
        'type': 'line',
        'source': 'cluster',
        'filter': [
          'all', ['!=', '$type', 'Point']
        ],
        'paint': this.paintRuleFeatureLine
      });
      this.map.addLayer({
        'id': 'features-line-select',
        'type': 'line',
        'source': 'cluster',
        'layout': {
          'visibility': 'none'
        },
        'filter': [
          'all', ['!=', '$type', 'Point']
        ],
        'paint': {
          'line-color': this.paintRuleFeatureLine['line-color'],
          'line-opacity': this.paintRuleFeatureLine['line-opacity'],
          'line-width': 4
        }
      });
      this.map.addLayer({
        'id': 'features-fill-hover',
        'type': 'fill',
        'source': 'cluster',
        'layout': {
          'visibility': 'none'
        },
        'filter': [
          'all', ['!=', '$type', 'Point']
        ],
        'paint': {
          'fill-color': this.paintRuleFeatureFill['fill-color'],
          'fill-opacity': 0.9,
        }
      });
      this.map.addLayer({
        'id': 'features-fill',
        'type': 'fill',
        'source': 'cluster',
        'filter': [
          'all', ['!=', '$type', 'Point']
        ],
        'paint': this.paintRuleFeatureFill
      });


      this.map.addLayer({
        'id': 'features-point',
        'type': 'circle',
        'source': 'cluster',
        'filter': [
          'all', [
            '!has',
            this.countPath,
          ], ['==', '$type', 'Point']
        ],
        'paint': this.paintRuleFeatureCirclePoint

      });

      this.map.on('click', 'features-point', (e) => {
        this.onFeatureClic.next(e.features.map(f => f.properties[this.idFeatureField]));
      });

      this.map.on('click', 'features-fill', (e) => {
        this.onFeatureClic.next(e.features.map(f => f.properties[this.idFeatureField]));
      });

      this.map.on('mousemove', 'features-fill', (e) => {
        this.onFeatureOver.next(e.features.map(f => f.properties[this.idFeatureField]));
      });
      this.map.on('mouseleave', 'features-fill', (e) => {
        this.onFeatureOver.next([]);
      });

      this.map.on('mousemove', 'features-point', (e) => {
        this.onFeatureOver.next(e.features.map(f => f.properties[this.idFeatureField]));
      });
      this.map.on('mouseleave', 'features-point', (e) => {
        this.onFeatureOver.next([]);
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
      this.map.showTileBoundaries = false;
      this.map.on('mousemove', 'cluster', (e) => {
        if (this.isDrawingBbox) {
          this.map.getCanvas().style.cursor = 'crosshair';
        } else {
          this.map.getCanvas().style.cursor = 'pointer';
        }
      });
      this.map.on('mouseleave', 'cluster', (e) => {
        if (this.isDrawingBbox) {
          this.map.getCanvas().style.cursor = 'crosshair';

        } else {
          this.map.getCanvas().style.cursor = '';
        }
      });
      this.canvas = this.map.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);



    });

    this.map.on('render', () => {
      this.isloaded = true;
      if (this.map.loaded()) {
        this.isloaded = false;
      }
    });

    const moveend = Observable
      .fromEvent(this.map, 'moveend')
      .skipWhile(x => this.isloaded)
      .debounceTime(750);


    moveend.subscribe(e => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();
      let geohashList = [];
      if (this.west < -180 && this.east > 180) {
        geohashList = bboxes(Math.min(this.south, this.north),
          -180,
          Math.max(this.south, this.north),
          180, Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
      } else if (this.west < -180 && this.east < 180) {
        const geohashList_1: Array<string> = bboxes(Math.min(this.south, this.north),
          Math.min(-180, this.west + 360),
          Math.max(this.south, this.north),
          Math.max(-180, this.west + 360), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
        const geohashList_2: Array<string> = bboxes(Math.min(this.south, this.north),
          Math.min(this.east, 180),
          Math.max(this.south, this.north),
          Math.max(this.east, 180), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
        geohashList = geohashList_1.concat(geohashList_2);

      } else if (this.east > 180 && this.west > -180) {
        const geohashList_1: Array<string> = bboxes(Math.min(this.south, this.north),
          Math.min(180, this.east - 360),
          Math.max(this.south, this.north),
          Math.max(180, this.east - 360), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));

        const geohashList_2: Array<string> = bboxes(Math.min(this.south, this.north),
          Math.min(this.west, -180),
          Math.max(this.south, this.north),
          Math.max(this.west, -180), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
        geohashList = geohashList_1.concat(geohashList_2);
      } else {
        geohashList = bboxes(Math.min(this.south, this.north),
          Math.min(this.east, this.west),
          Math.max(this.south, this.north),
          Math.max(this.east, this.west), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
      }


      const onMoveData: OnMoveResult = {
        zoom: this.zoom,
        center: this.map.getCenter(),
        extend: [this.north, this.west, this.south, this.east],
        extendForLoad: [],
        extendForTest: [],
        tiles: [],
        geohash: geohashList
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
      onMoveData.tiles = xyz([[onMoveData.extendForLoad[1],
      onMoveData.extendForLoad[2]],
      [onMoveData.extendForLoad[3],
      onMoveData.extendForLoad[0]]], Math.ceil((this.zoom) - 1));
      this.onMove.next(onMoveData);
    });
    this.map.on('mousedown', (e) => {
      this.startlngLat = e.lngLat;

    });
    this.map.on('mouseup', (e) => {
      this.endlngLat = e.lngLat;
    });

    this.redrawTile.subscribe(value => {
      if (value) {
        if (this.map.getSource('cluster') !== undefined) {
          this.map.getSource('cluster').setData(this.geojsondata);
        }
      }
    });

  }

  /**
   * @description Displays the geobox
   */
  public addGeoBox() {
    this.map.getCanvas().style.cursor = 'crosshair';
    this.isDrawingBbox = true;
  }

  /**
   * @description Removes the geobox
   */
  public removeGeoBox() {

    this.map.getCanvas().style.cursor = '';
    this.geoboxdata.features = [];
    this.onRemoveBbox.next(true);
    this.isDrawingBbox = false;

  }

  private highlightFeature(featureToHightLight: {
    isleaving: boolean,
    elementidentifier: ElementIdentifier
  }) {
    if (this.map.getLayer('features-fill-hover') !== undefined) {
      this.map.setLayoutProperty('features-fill-hover', 'visibility', 'visible');
      if (!featureToHightLight.isleaving) {
        this.map.setFilter('features-fill-hover', ['all', ['!=', '$type', 'Point'], ['==',
          featureToHightLight.elementidentifier.idFieldName,
          featureToHightLight.elementidentifier.idValue]]
        );
      } else {
        this.map.setFilter('features-fill-hover', ['all', ['!=', '$type', 'Point'], ['==',
          featureToHightLight.elementidentifier.idFieldName,
          ' ']]);
      }
    }
  }

  private selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    if (this.map.getLayer('features-line-select') !== undefined) {
      if (elementToSelect.length > 0) {
        this.map.setLayoutProperty('features-line-select', 'visibility', 'visible');
        const filter = elementToSelect.reduce(function (memo, element) {
          memo.push(element.idValue);
          return memo;
        }, ['in', elementToSelect[0].idFieldName]);
        this.map.setFilter('features-line-select', filter);
      } else {
        this.map.setLayoutProperty('features-line-select', 'visibility', 'none');
      }
    }
  }

  private mousedown = (e) => {
    // Continue the rest of the function if we add a geobox.
    if (!this.isDrawingBbox) { return; }
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
      let west = Math.min(startlng, endlng);
      const north = Math.max(startlat, endlat);
      let east = Math.max(startlng, endlng);
      const south = Math.min(startlat, endlat);
      const coordinates = [[
        [east, south],
        [east, north],
        [west, north],
        [west, south],
        [east, south],
      ]];
      if (west < -180) {
        west = west + 360;
      }
      if (east > 180) {
        east = east - 360;
      }
      const polygonGeojson = {
        type: 'Feature',
        properties: {
        },
        geometry: {
          type: 'Polygon',
          coordinates: coordinates
        }
      };
      this.geoboxdata.features.push(polygonGeojson);
      this.onChangeBbox.emit(this.geoboxdata.features);
      this.map.getSource('geobox').setData(this.geoboxdata);
      this.isDrawingBbox = false;
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
  }
  private getGeohashLevelFromZoom(zoom: number): number {
    const zoomToPrecisionClusterObject = {};
    const zoomToPrecisionCluster = this.zoomToPrecisionCluster;
    zoomToPrecisionCluster.forEach(triplet => {
      zoomToPrecisionClusterObject[triplet[0]] = [triplet[1], triplet[2]];
    });
    if (zoomToPrecisionClusterObject[Math.ceil(zoom) - 1] !== undefined) {
      if (zoomToPrecisionClusterObject[Math.ceil(zoom) - 1][1] !== undefined) {
        return zoomToPrecisionClusterObject[Math.ceil(zoom) - 1][1];
      } else {
        return this.maxPrecision[1];
      }
    } else {
      return this.maxPrecision[1];
    }
  }
}

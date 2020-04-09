/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  AfterViewInit, Component, EventEmitter,
  HostListener, Input, IterableDiffers,
  OnChanges, OnInit, Output, SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { bboxes } from 'ngeohash';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ElementIdentifier } from '../results/utils/results.utils';
import { ControlButton, PitchToggle, DrawControl } from './mapgl.component.control';
import { getDefaultStyle, paddedBounds, xyz, MapExtend } from './mapgl.component.util';
import * as mapglJsonSchema from './mapgl.schema.json';
import { MapLayers, Style, StyleGroup, BasemapStyle, BasemapStylesGroup, ExternalEvent } from './model/mapLayers';
import { MapSource } from './model/mapSource';
import * as MapboxDraw from '@gisaia-team/mapbox-gl-draw/dist/mapbox-gl-draw';
import * as helpers from '@turf/helpers';
import * as centroid from '@turf/centroid';
import LimitVertexDirectSelectMode from './model/LimitVertexDirectSelectMode';
import ValidGeomDrawPolygonMode from './model/ValidGeomDrawPolygonMode';
import * as mapboxgl from 'mapbox-gl';
import { FeatureCollection } from '@turf/helpers';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { TransformRequestFunction } from 'mapbox-gl';


export interface OnMoveResult {
  zoom: number;
  zoomStart: number;
  center: Array<number>;
  centerWithOffset: Array<number>;
  extend: Array<number>;
  extendWithOffset: Array<number>;
  rawExtendWithOffset: Array<number>;
  extendForLoad: Array<number>;
  rawExtendForLoad: Array<number>;
  extendForTest: Array<number>;
  tiles: Array<{ x: number, y: number, z: number }>;
  geohash: Array<string>;
  geohashForLoad: Array<string>;
  xMoveRatio: number;
  yMoveRatio: number;
}


export const ZOOM_IN = 'Zoom in';
export const ZOOM_OUT = 'Zoom out';
export const RESET_BEARING = 'Reset bearing to north';
export const LAYER_SWITCHER_TOOLTIP = 'Manage layers';
/**
 * Mapgl Component allows to display and select geometrical data on a map.
 */

@Component({
  selector: 'arlas-mapgl',
  templateUrl: './mapgl.component.html',
  styleUrls: ['./mapgl.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MapglComponent implements OnInit, AfterViewInit, OnChanges {

  public FINISH_DRAWING = 'Double click to finish drawing';
  public map: any;
  public draw: any;
  private emptyData: FeatureCollection = {
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
  private start: mapboxgl.Point;
  private canvas: HTMLElement;
  private box: HTMLElement;
  private current: mapboxgl.Point;
  private startlngLat: any;
  private endlngLat: any;

  private DATA_SOURCE = 'data_source';
  private POLYGON_LABEL_SOURCE = 'polygon_label';
  private LOCAL_STORAGE_STYLE_GROUP = 'ARLAS_SG-';
  private LOCAL_STORAGE_BASEMAPS = 'arlas_last_base_map';

  private savedEditFeature = null;

  /**
   * @Input : Angular
   * @description List of mapgl layers
   */
  @Input() public mapLayers: MapLayers;

  /**
   * @Input : Angular
   * @description Whether the layer switcher controll is displayed.
   * If not, the map component uses the default style group and with its default style
   */
  @Input() public displayLayerSwitcher = false;
  /**
 * @Input : Angular
 * @description Whether the scale is displayed.
 */
  @Input() public displayScale = true;
  /**
   * @Input : Angular
   * @description Whether the coordinates are displayed.
   */
  @Input() public displayCurrentCoordinates = false;
  /**
 * @Input : Angular
 * @description Whether the coordinates should be wraped between -180 and 180.
 */
  @Input() public wrapLatLng = true;
  /**
   * @Input : Angular
   * @description Max width of the scale.
   */
  @Input() public maxWidthScale = 100;
  /**
   * @Input : Angular
   * @description Unit of the scale.
   */
  @Input() public unitScale = 'metric';
  /**
   * @Input : Angular
   * @description Default style of the base map
   */
  @Input() public defaultBasemapStyle: BasemapStyle = {
    name: 'Positron Style',
    styleFile: 'http://demo.arlas.io:82/styles/positron/style.json'
  };
  /**
   * @Input : Angular
   * @description List of styles to apply to the base map
   */
  @Input() public basemapStyles = new Array<BasemapStyle>();
  /**
   * @Input : Angular
   * @description Zoom of the map when it's initialized
   */
  @Input() public initZoom = 2;
  /**
   * @Input : Angular
   * @description Max zoom of the map
   */
  @Input() public maxZoom = 22;
  /**
   * @Input : Angular
   * @description Min zoom of the map
   */
  @Input() public minZoom = 0;
  /**
   * @Input : Angular
   * @description Coordinates of the map's centre when it's initialized.
   */
  @Input() public initCenter: [number, number] = [2.1972656250000004, 45.706179285330855];
  /**
   * @Input : Angular
   * @description Margin applied to the map extent. Data is loaded in all this extent.
   */
  @Input() public margePanForLoad: number;
  /**
   * @Input : Angular
   * @description Margin applied to the map extent.
   * Before loading data, the components checks first if there are features already loaded in this extent.
   */
  @Input() public margePanForTest: number;
  /**
   * @Input : Angular
   * @description The data displayed on map.
   */
  @Input() public geojsondata: FeatureCollection = Object.assign({}, this.emptyData);
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
  * @description List of mapboxgl sources to add to the map.
  */
  @Input() public mapSources: Array<MapSource>;
  /**
   * @Input : Angular
   * @description List of triplet zoom-level-precision to associate a couple level-precision for each zoom.
   */
  @Input() public zoomToPrecisionCluster: Array<Array<number>>;

  /**
   * @Input : Angular
   * @description Options object for draw tools : https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#options
   */
  @Input() public drawOption: any = {};

  /**
   * @Input : Angular
   * @description Features drawn at component start
   */
  @Input() public drawData: { type: string, features: Array<any> } = Object.assign({}, this.emptyData);

  /**
   * @Input : Angular
   * @description Whether the draw tools are activated
   */
  @Input() public drawButtonEnabled = false;

  /**
   * @Input : Angular
   * @description Maximum number of vertices allowed for a polygon
   */
  @Input() public drawPolygonVerticesLimit: number;

  /**
   * @Input : Angular
   * @description A couple of (max precision, max geohash-level) above which data is displayed as features
   */
  @Input() public maxPrecision: Array<number>;
  /**
   * @Input : Angular
   * @description A callback run before the Map makes a request for an external URL, mapbox map option
   */
  @Input() public transformRequest: TransformRequestFunction;

  /**
   * @Input : Angular
   * @description An object with noth,east,south,west properies which represent an offset in pixel
   * Origin is top-left and x axe is west to east and y axe north to south.
   */
  @Input() public offset: { north: number, east: number, south: number, west: number } =
    { north: 0, east: 0, south: 0, west: 0 };

  /**
   * @Output : Angular
   * @description Emits the event of whether redraw the tile.
   */
  @Input() public redrawTile: Subject<boolean> = new Subject<boolean>();
  @Input() public redrawSource: Subject<any> = new Subject<any>();


  @Input() public dataSources: Set<string>;
  /**
   * @Output : Angular
   * @description Emits the new chosen Style that has the attribute `geomStrategy` set.
   * @deprecated
  */
  @Output() public switchLayer: Subject<Style> = new Subject<Style>();

  /**
   * @Output : Angular
   * @description Emits all the StyleGroups of the map on style change. Each StyleGroup has its selected Style set.
  */
  @Output() public onStyleChanged: Subject<Array<StyleGroup>> = new Subject<Array<StyleGroup>>();

  /**
   * @Output : Angular
   * @description Emits true after the map is loaded and all sources & layers are added.
  */
  @Output() public onMapLoaded: Subject<boolean> = new Subject<boolean>();

  /**
   * @Output : Angular
   * @description Emits the event of moving the map.
   * @deprecated
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
  /**
   * @Output : Angular
   * @description Emit the event of updating the draw polygon
   */
  @Output() public onPolygonChange: EventEmitter<Array<Object>> = new EventEmitter<Array<Object>>();
  /**
   * @Output : Angular
   * @description Emit the event of invalid geometry creation
   */
  @Output() public onPolygonError: EventEmitter<Object> = new EventEmitter<Object>();
  /**
   * @Output : Angular
   * @description Emit the event of selecting polygon
   */
  @Output() public onPolygonSelect: EventEmitter<any> = new EventEmitter<any>();
  /**
   * @Output :  Angular
   * @description Emits the map extend on Tab close/refresh
   */
  @Output() public onMapClosed: EventEmitter<MapExtend> = new EventEmitter<MapExtend>();
  /**
 * @Output :  Angular
 * @description Emits the geojson of an aoi added to the map
 */
  @Output() public onAoiChanged: Subject<FeatureCollection> = new Subject<FeatureCollection>();

  public showLayersList = false;
  private layersMap = new Map<string, mapboxgl.Layer>();
  public basemapStylesGroup: BasemapStylesGroup;

  public currentLat: string;
  public currentLng: string;

  // Polygon
  private isDrawingPolygon = false;
  public nbPolygonVertice = 0;
  private indexId = 0;
  private customIds = new Map<number, string>();
  public polygonlabeldata: { type: string, features: Array<any> } = Object.assign({}, this.emptyData);

  public firstDrawLayer = '';

  // Drag start position
  public dragStartY: number;
  public dragStartX: number;

  // Drag end position
  public dragEndX: number;
  public dragEndY: number;

  // Moving ratio (using pixel)
  public xMoveRatio = 0;
  public yMoveRatio = 0;
  public zoomStart: number;

  public isDrawPolyonSelected = false;
  public drawClickCounter = 0;
  private drawSelectionChanged = false;
  private finishDrawTooltip: HTMLElement;

  constructor(private http: HttpClient, private _snackBar: MatSnackBar, private translate: TranslateService) {

  }

  public openInvalidGeometrySnackBar() {
    this._snackBar.open(this.translate.instant('Invalid geometry'), this.translate.instant('Ok'), {
      duration: 3 * 1000,
      verticalPosition: 'top',
      panelClass: 'invalid-geo-toast'
    });
  }

  public static getMapglJsonSchema(): Object {
    return mapglJsonSchema;
  }

  public ngOnInit() { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.map !== undefined) {
      if (changes['dataSources'] !== undefined) {

      }
      if (this.map.getSource(this.DATA_SOURCE) !== undefined) {
        if (changes['geojsondata'] !== undefined) {
          this.geojsondata = changes['geojsondata'].currentValue;
          this.map.getSource(this.DATA_SOURCE).setData(this.geojsondata);
        }
      }
      if (changes['drawData'] !== undefined) {
        this.drawData = changes['drawData'].currentValue;
        const centroides = new Array();
        this.drawData.features.forEach(feature => {
          const poly = helpers.polygon(feature.geometry.coordinates);
          const cent = centroid.default(poly);
          cent.properties.arlas_id = feature.properties.arlas_id;
          centroides.push(cent);
        });
        this.polygonlabeldata = {
          type: 'FeatureCollection',
          features: centroides
        };
        if (!this.drawSelectionChanged) {
          this.draw.deleteAll();
          this.draw.add(this.drawData);
        }
        this.drawSelectionChanged = false;
        if (this.map.getSource(this.POLYGON_LABEL_SOURCE) !== undefined) {
          this.map.getSource(this.POLYGON_LABEL_SOURCE).setData(this.polygonlabeldata);
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
      if (changes['featureToHightLight'] !== undefined
        && changes['featureToHightLight'].currentValue !== changes['featureToHightLight'].previousValue) {
        const featureToHightLight = changes['featureToHightLight'].currentValue;
        this.highlightFeature(featureToHightLight);
      }
      if (changes['featuresToSelect'] !== undefined
        && changes['featuresToSelect'].currentValue !== changes['featuresToSelect'].previousValue) {
        const featuresToSelect = changes['featuresToSelect'].currentValue;
        this.selectFeatures(featuresToSelect);
      }
    }
  }
  public setBaseMapStyle(style: string | mapboxgl.Style) {
    if (this.map) {
      if (typeof this.basemapStylesGroup.selectedBasemapStyle.styleFile === 'string') {
        this.http.get(this.basemapStylesGroup.selectedBasemapStyle.styleFile).subscribe((s: any) => this.setStyle(s, style));
      } else {
        this.setStyle(this.basemapStylesGroup.selectedBasemapStyle.styleFile, style);
      }
    }
  }

  public setStyle(s: mapboxgl.Style, style: string | mapboxgl.Style) {
    const selectedBasemapLayersSet = new Set<string>();
    const layers = (<mapboxgl.Map>this.map).getStyle().layers;
    const sources = (<mapboxgl.Map>this.map).getStyle().sources;
    if (s.layers) { s.layers.forEach(l => selectedBasemapLayersSet.add(l.id)); }
    const layersToSave = new Array<mapboxgl.Layer>();
    const sourcesToSave = new Array<MapSource>();
    layers.filter((l: mapboxgl.Layer) => !selectedBasemapLayersSet.has(l.id)).forEach(l => {
      layersToSave.push(l);
      if (sourcesToSave.filter(ms => ms.id === l.source.toString()).length === 0) {
        sourcesToSave.push({ id: l.source.toString(), source: sources[l.source.toString()] });
      }
    });
    const sourcesToSaveSet = new Set<string>();
    sourcesToSave.forEach(mapSource => sourcesToSaveSet.add(mapSource.id));
    if (this.mapSources) {
      this.mapSources.forEach(mapSource => {
        if (!sourcesToSaveSet.has(mapSource.id)) {
          sourcesToSave.push(mapSource);
        }
      });
    }
    this.map.setStyle(style).once('styledata', () => {
      this.addSourcesToMap(sourcesToSave, this.map);
      layersToSave.forEach(l => this.map.addLayer(l));
    });
  }

  public ngAfterViewInit() {

    const afterViewInitbasemapStyle: BasemapStyle = this.getAfterViewInitBasemapStyle();

    this.map = new mapboxgl.Map({
      container: 'mapgl',
      style: afterViewInitbasemapStyle.styleFile,
      center: this.initCenter,
      zoom: this.initZoom,
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      renderWorldCopies: true,
      locale: {
        'NavigationControl.ZoomIn': this.translate.instant(ZOOM_IN),
        'NavigationControl.ZoomOut': this.translate.instant(ZOOM_OUT),
        'NavigationControl.ResetBearing': this.translate.instant(RESET_BEARING)
      },
      transformRequest: this.transformRequest
    });
    fromEvent(window, 'beforeunload').subscribe(() => {
      const bounds = (<mapboxgl.Map>this.map).getBounds();
      const mapExtend: MapExtend = { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.map.getZoom() };
      this.onMapClosed.next(mapExtend);
    });

    this.finishDrawTooltip = document.getElementById('polygon-finish-draw-tooltip');
    /** [basemapStylesGroup] object includes the list of basemap styles and which one is selected */
    this.setBasemapStylesGroup(afterViewInitbasemapStyle);

    /** Whether to display scale */
    if (this.displayScale) {
      const scale = new mapboxgl.ScaleControl({
        maxWidth: this.maxWidthScale,
        unit: this.unitScale,
      });
      this.map.addControl(scale, 'bottom-right');
    }

    if (this.displayCurrentCoordinates) {
      this.map.on('mousemove', (e) => {
        let lngLat = e.lngLat;
        if (this.wrapLatLng) {
          lngLat = lngLat.wrap();
        }
        this.currentLng = String(Math.round(lngLat.lng * 100000) / 100000);
        this.currentLat = String(Math.round(lngLat.lat * 100000) / 100000);
      });
    }
    const layerSwitcherButton = new ControlButton('layersswitcher', this.translate.instant(LAYER_SWITCHER_TOOLTIP));
    const navigationControllButtons = new mapboxgl.NavigationControl();
    const addGeoBoxButton = new ControlButton('addgeobox');
    const removeAoisButton = new ControlButton('removeaois');
    if (this.displayLayerSwitcher) {
      this.map.addControl(layerSwitcherButton, 'top-right');
      layerSwitcherButton.btn.onclick = () => {
        this.showLayersList = !this.showLayersList;
      };
    }
    this.map.addControl(navigationControllButtons, 'top-right');
    this.map.addControl(new PitchToggle(-20, 70, 11), 'top-right');
    this.map.addControl(addGeoBoxButton, 'top-right');
    this.map.addControl(removeAoisButton, 'top-right');
    const drawOptions = {
      ...this.drawOption, ...{
        modes: Object.assign(
          MapboxDraw.modes,
          {
            limit_vertex: LimitVertexDirectSelectMode,
            draw_polygon: ValidGeomDrawPolygonMode
          })
      }
    };
    const drawControl = new DrawControl(drawOptions, this.drawButtonEnabled);
    this.map.addControl(drawControl, 'top-right');
    this.draw = drawControl.mapboxDraw;
    addGeoBoxButton.btn.onclick = () => {
      this.addGeoBox();
    };
    removeAoisButton.btn.onclick = () => {
      this.removeAois();
    };
    this.map.boxZoom.disable();
    this.map.on('load', () => {
      this.firstDrawLayer = this.map.getStyle().layers
        .map(layer => layer.id)
        .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0)[0];
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();

      // Add Data_source
      this.dataSources.forEach(source => {
        this.map.addSource({
          type: 'geojson',
          data: Object.assign({}, this.emptyData)
        });
      });
      this.map.addSource(this.POLYGON_LABEL_SOURCE, {
        'type': 'geojson',
        'data': this.polygonlabeldata
      });
      this.addSourcesToMap(this.mapSources, this.map);
      if (this.mapLayers !== null) {
        this.mapLayers.layers.forEach(layer => this.layersMap.set(layer.id, layer));
        this.addBaseLayers();
        this.addStylesLayers();

        this.mapLayers.events.zoomOnClick.forEach(layerId => {
          this.map.on('click', layerId, (e) => {
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
        });

        this.mapLayers.events.emitOnClick.forEach(layerId => {
          this.map.on('click', layerId, (e) => {
            this.onFeatureClic.next(e.features.map(f => f.properties[this.idFeatureField]));
          });
        });

        this.mapLayers.events.onHover.forEach(layerId => {
          this.map.on('mousemove', layerId, (e) => {
            this.onFeatureOver.next(e.features.map(f => f.properties[this.idFeatureField]));
          });

          this.map.on('mouseleave', layerId, (e) => {
            this.onFeatureOver.next([]);
          });
        });
      }
      this.map.showTileBoundaries = false;
      this.map.on('mousemove', this.DATA_SOURCE, (e) => {
        if (this.isDrawingBbox) {
          this.map.getCanvas().style.cursor = 'crosshair';
        } else {
          this.map.getCanvas().style.cursor = 'pointer';
        }
      });
      this.map.on('mouseleave', this.DATA_SOURCE, (e) => {
        if (this.isDrawingBbox) {
          this.map.getCanvas().style.cursor = 'crosshair';

        } else {
          this.map.getCanvas().style.cursor = '';
        }
      });
      this.canvas = this.map.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);
      this.map.on('draw.create', (e) => {
        this.addCustomId(e.features[0].id);
        this.onChangePolygonDraw();
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAll().features.filter(fc => {
              const coordinates = fc.geometry.coordinates;
              return fc.geometry.type === 'Polygon' && coordinates && coordinates[0] !== (null && undefined)
                && coordinates[0][0] !== (null && undefined);
            })
          });
      });

      this.map.on('draw.update', (e) => {
        if (e) {
          const features = e.features;
          if (features && features.length > 0) {
            this.savedEditFeature = Object.assign({}, features[0]);
            this.savedEditFeature.coordinates = [[]];
            features[0].geometry.coordinates[0].forEach(f => this.savedEditFeature.coordinates[0].push(f));
          }
        }
        this.onChangePolygonDraw();
      });
      this.map.on('draw.delete', () => {
        this.onChangePolygonDraw();
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAll().features.filter(fc => fc.geometry.type === 'Polygon')
          });
      });

      const mouseMoveForDraw = (e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        this.finishDrawTooltip.style.top = (y + 20) + 'px';
        this.finishDrawTooltip.style.left = (x + 20) + 'px';
      };

      this.map.on('draw.onClick', () => {
        if (this.drawClickCounter === 0) {
          window.addEventListener('mousemove', mouseMoveForDraw);
        }
        this.drawClickCounter++;
      });

      this.map.on('draw.onStop', () => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
      });

      this.map.on('draw.invalidGeometry', (e) => {
        if (this.savedEditFeature) {
          const featureCoords = this.savedEditFeature.coordinates[0].slice();
          if (featureCoords[0][0] !== featureCoords[featureCoords.length - 1][0] ||
            featureCoords[0][1] !== featureCoords[featureCoords.length - 1][1]) {
            featureCoords.push(featureCoords[0]);
          }
          const currentFeature = {
            id: '',
            type: 'Feature',
            geometry: {
              'type': 'Polygon',
              'coordinates': [featureCoords]
            },
            properties: {}
          };
          currentFeature.id = this.savedEditFeature.id;
          currentFeature.properties = this.savedEditFeature.properties;
          this.draw.add(currentFeature);
        }
        this.openInvalidGeometrySnackBar();
        this.onPolygonError.next(e);
      });

      this.map.on('draw.edit.saveInitialFeature', (edition) => {
        this.savedEditFeature = Object.assign({}, edition.feature);
        this.savedEditFeature.coordinates = [[]];
        edition.feature.coordinates[0].forEach(c => this.savedEditFeature.coordinates[0].push(c));
      });

      this.map.on('draw.selectionchange', (e) => {
        this.drawSelectionChanged = true;
        if (e.features.length > 0) {
          this.onPolygonSelect.emit({ edition: true });
          this.isDrawPolyonSelected = true;
        } else {
          this.savedEditFeature = null;
          this.onPolygonSelect.emit({ edition: false });
          this.isDrawPolyonSelected = false;
          this.onAoiChanged.next(
            {
              'type': 'FeatureCollection',
              'features': this.draw.getAll().features.filter(fc => {
                const coordinates = fc.geometry.coordinates;
                return fc.geometry.type === 'Polygon' && coordinates && coordinates[0] !== (null && undefined)
                  && coordinates[0][0] !== (null && undefined);
              })
            });
        }
      });
      this.map.on('draw.modechange', (e) => {
        if (e.mode === 'draw_polygon') {
          this.isDrawingPolygon = true;
        }
        if (e.mode === 'simple_select') {
          this.isDrawingPolygon = false;
        }
        if (e.mode === 'direct_select') {
          const selectedFeatures = this.draw.getSelected().features;
          const selectedIds = this.draw.getSelectedIds();
          if (selectedFeatures && selectedIds && selectedIds.length > 0) {
            if (selectedFeatures[0].properties.source === 'bbox') {
              this.draw.changeMode('simple_select', {
                featureIds: [selectedIds[0]]
              });
            } else if (this.drawPolygonVerticesLimit) {
              this.draw.changeMode('limit_vertex', {
                featureId: selectedIds[0],
                maxVertexByPolygon: this.drawPolygonVerticesLimit,
                selectedCoordPaths: selectedFeatures[0].geometry.coordinates
              });
            }
          }
        }
      });

      this.map.on('click', () => {
        if (this.isDrawingPolygon) {
          this.nbPolygonVertice++;
          if (this.nbPolygonVertice === this.drawPolygonVerticesLimit) {
            this.draw.changeMode('simple_select');
            this.isDrawingPolygon = false;
            this.nbPolygonVertice = 0;
          }
        } else {
          this.nbPolygonVertice = 0;
        }
      });
      this.cleanLocalStorage(this.mapLayers.styleGroups);
      this.onMapLoaded.next(true);
    });

    const zoomstart = fromEvent(this.map, 'zoomstart')
      .pipe(debounceTime(750));

    zoomstart.subscribe(e => {
      this.zoomStart = this.map.getZoom();
    });

    const dragstart = fromEvent(this.map, 'dragstart')
      .pipe(debounceTime(750));
    dragstart.subscribe(e => {
      this.dragStartX = (<any>e).originalEvent.clientX;
      this.dragStartY = (<any>e).originalEvent.clientY;
    });
    const dragend = fromEvent(this.map, 'dragend')
      .pipe(debounceTime(750));
    dragend.subscribe(e => {
      this.dragEndX = (<any>e).originalEvent.clientX;
      this.dragEndY = (<any>e).originalEvent.clientY;
      this.xMoveRatio = Math.abs(this.dragEndX - this.dragStartX) / (<any>e).target._canvas.clientWidth;
      this.yMoveRatio = Math.abs(this.dragEndY - this.dragStartY) / (<any>e).target._canvas.clientHeight;
    });

    const moveend = fromEvent(this.map, 'moveend')
      .pipe(debounceTime(750));
    moveend.subscribe(e => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();
      const geohashList = this.bboxToGeohashList(this.west, this.south, this.east, this.north, this.zoom);
      const offsetPoint = new mapboxgl.Point((this.offset.east + this.offset.west) / 2, (this.offset.north + this.offset.south) / 2);
      const centerOffsetPoint = this.map.project(this.map.getCenter()).add(offsetPoint);
      const centerOffSetLatLng = this.map.unproject(centerOffsetPoint);

      const southWest = this.map.getBounds()._sw;
      const northEast = this.map.getBounds()._ne;
      const bottomLeft = this.map.project(southWest);
      const topRght = this.map.project(northEast);
      const height = bottomLeft.y;
      const width = topRght.x;

      const bottomLeftOffset = bottomLeft.add(new mapboxgl.Point(this.offset.west, this.offset.south));
      const topRghtOffset = topRght.add(new mapboxgl.Point(this.offset.east, this.offset.north));

      const bottomLeftOffsetLatLng = this.map.unproject(bottomLeftOffset);
      const topRghtOffsetLatLng = this.map.unproject(topRghtOffset);

      const wrapWestOffset = bottomLeftOffsetLatLng.wrap().lng;
      const wrapSouthOffset = bottomLeftOffsetLatLng.wrap().lat;
      const wrapEastOffset = topRghtOffsetLatLng.wrap().lng;
      const wrapNorthOffset = topRghtOffsetLatLng.wrap().lat;

      const rawWestOffset = bottomLeftOffsetLatLng.lng;
      const rawSouthOffset = bottomLeftOffsetLatLng.lat;
      const rawEastOffset = topRghtOffsetLatLng.lng;
      const rawNorthOffset = topRghtOffsetLatLng.lat;

      const onMoveData: OnMoveResult = {
        zoom: this.zoom,
        zoomStart: this.zoomStart,
        center: this.map.getCenter(),
        centerWithOffset: [centerOffSetLatLng.lng, centerOffSetLatLng.lat],
        extendWithOffset: [wrapNorthOffset, wrapWestOffset, wrapSouthOffset, wrapEastOffset],
        rawExtendWithOffset: [rawNorthOffset, rawWestOffset, rawSouthOffset, rawEastOffset],
        extend: [this.north, this.west, this.south, this.east],
        extendForLoad: [],
        rawExtendForLoad: [],
        extendForTest: [],
        tiles: [],
        geohash: geohashList,
        geohashForLoad: [],
        xMoveRatio: this.xMoveRatio,
        yMoveRatio: this.yMoveRatio
      };

      const panLoad = this.margePanForLoad * Math.max(height, width) / 100;
      const panTest = this.margePanForTest * Math.max(height, width) / 100;
      const extendForLoadLatLng = paddedBounds(panLoad, panLoad, panLoad, panLoad, this.map, southWest, northEast);
      const extendForTestdLatLng = paddedBounds(panTest, panTest, panTest, panTest, this.map, southWest, northEast);
      onMoveData.extendForLoad = [
        Math.min(extendForLoadLatLng[1].lat, 90),
        Math.max(extendForLoadLatLng[0].lng, -180),
        Math.max(extendForLoadLatLng[0].lat, -90),
        Math.min(extendForLoadLatLng[1].lng, 180)
      ];
      const geohashForLoad = this.bboxToGeohashList(onMoveData.extendForLoad[1], onMoveData.extendForLoad[2],
        onMoveData.extendForLoad[3], onMoveData.extendForLoad[0], this.zoom);
      onMoveData.geohashForLoad = geohashForLoad;
      onMoveData.extendForTest = [
        Math.min(extendForTestdLatLng[1].lat, 90),
        Math.max(extendForTestdLatLng[0].lng, -180),
        Math.max(extendForTestdLatLng[0].lat, -90),
        Math.min(extendForTestdLatLng[1].lng, 180)
      ];
      onMoveData.rawExtendForLoad = [
        extendForTestdLatLng[1].lat,
        extendForTestdLatLng[0].lng,
        extendForTestdLatLng[0].lat,
        extendForTestdLatLng[1].lng,
      ];
      onMoveData.tiles = xyz([[onMoveData.extendForLoad[1], onMoveData.extendForLoad[2]],
      [onMoveData.extendForLoad[3], onMoveData.extendForLoad[0]]],
        Math.ceil((this.zoom) - 1));
      this.onMove.next(onMoveData);
    });
    // Fit bounds on current bounds to emit init position in moveend bus
    this.map.fitBounds(this.map.getBounds());
    this.map.on('mousedown', (e) => {
      this.startlngLat = e.lngLat;
    });
    this.map.on('mouseup', (e) => {
      this.endlngLat = e.lngLat;
    });

    this.redrawTile.subscribe(value => {
      if (value) {
        if (this.map.getSource(this.DATA_SOURCE) !== undefined) {
          this.map.getSource(this.DATA_SOURCE).setData(this.geojsondata);
        }
      }
    });

    this.redrawSource.subscribe(sd => {
      if (this.map.getSource(sd.source) !== undefined) {
        this.map.getSource(sd.source).setData({
          'type': 'FeatureCollection',
          'features': sd.data
        });
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
   * @description Removes all the aois if none of them is selected. Otherwise it removes the selected one only
   */
  public removeAois() {
    this.map.getCanvas().style.cursor = '';
    this.isDrawingBbox = false;
    this.deleteSelectedItem();
  }

  public onChangeStyle(styleGroupId: string, selectedStyleId: string) {
    if (this.mapLayers && this.mapLayers.styleGroups) {
      const selectedStyle: Style = this.getStyle(styleGroupId, selectedStyleId, this.mapLayers.styleGroups);
      if (selectedStyle) {
        this.mapLayers.styleGroups.filter(styleGroup => styleGroup.id === styleGroupId).forEach(styleGroup => {
          styleGroup.selectedStyle = selectedStyle;
        });
        this.removeAllLayers();
        if (selectedStyle.geomStrategy !== undefined) {
          this.switchLayer.next(selectedStyle);
        }
        this.mapLayers.styleGroups.forEach(styleGroup => {
          localStorage.setItem(this.LOCAL_STORAGE_STYLE_GROUP + styleGroup.id, styleGroup.selectedStyle.id);
          styleGroup.selectedStyle.layerIds.forEach(layerId => {
            this.addLayer(layerId);
          });
        });
        this.onStyleChanged.next(this.mapLayers.styleGroups);
      }
    }
  }

  public setStyleGroup(styleGroupId: string, selectedStyleId: string) {
    if (this.mapLayers && this.mapLayers.styleGroups) {
      const selectedStyle: Style = this.getStyle(styleGroupId, selectedStyleId, this.mapLayers.styleGroups);
      if (selectedStyle) {
        this.mapLayers.styleGroups.filter(styleGroup => styleGroup.id === styleGroupId).forEach(styleGroup => {
          styleGroup.selectedStyle = selectedStyle;
        });
        this.removeAllLayers();
        this.mapLayers.styleGroups.forEach(styleGroup => {
          localStorage.setItem(this.LOCAL_STORAGE_STYLE_GROUP + styleGroup.id, styleGroup.selectedStyle.id);
          styleGroup.selectedStyle.layerIds.forEach(layerId => {
            this.addLayer(layerId);
          });
        });
      }
    }
  }

  public onChangePolygonDraw() {
    this.onPolygonChange.next(this.draw.getAll().features);

    const centroides = new Array<any>();
    this.draw.getAll().features.forEach(feature => {
      const poly = helpers.polygon(feature.geometry.coordinates);
      const cent = centroid.default(poly);
      cent.properties.arlas_id = feature.properties.arlas_id;
      centroides.push(cent);
    });

    this.polygonlabeldata = {
      type: 'FeatureCollection',
      features: centroides
    };
    this.map.getSource(this.POLYGON_LABEL_SOURCE).setData(this.polygonlabeldata);
  }

  public onChangeBasemapStyle(selectedStyle: BasemapStyle) {
    this.setBaseMapStyle(selectedStyle.styleFile);
    localStorage.setItem(this.LOCAL_STORAGE_BASEMAPS, JSON.stringify(selectedStyle));
    this.basemapStylesGroup.selectedBasemapStyle = selectedStyle;
  }

  /**
   * Return the polygons geometry in WKT or GeoJson given the mode
   * @param mode : string
   */
  public getAllPolygon(mode: 'wkt' | 'geojson') {
    let polygon;
    if (mode === 'wkt') {
      polygon = this.latLngToWKT(this.draw.getAll().features);
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getAll().features
      };
    }
    return polygon;
  }

  /**
   * Return the selected polygon geometry in WKT or GeoJson given the mode
   * @param mode : string
   */
  public getSelectedPolygon(mode: 'wkt' | 'geojson') {
    let polygon;
    if (mode === 'wkt') {
      polygon = this.latLngToWKT(this.draw.getSelected().features);
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getSelected().features
      };
    }
    return polygon;
  }

  public getPolygonById(id: number, mode: 'wkt' | 'geojson') {
    let polygon;
    if (mode === 'wkt') {
      polygon = this.latLngToWKT([this.draw.get(this.customIds.get(id))]);
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': [this.draw.get(this.customIds.get(id))]
      };
    }
    return polygon;
  }

  public switchToDrawMode() {
    this.draw.changeMode('draw_polygon');
    this.isDrawingPolygon = true;
  }

  public deleteSelectedItem() {
    if (this.isDrawPolyonSelected) {
      this.draw.trash();
    } else {
      this.draw.deleteAll();
    }
    this.onPolygonSelect.emit({ edition: false });
    this.isDrawPolyonSelected = false;
    this.onChangePolygonDraw();
    this.onAoiChanged.next(this.draw.getAll());
  }

  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isDrawingBbox) {
      this.map.getCanvas().style.cursor = '';
      this.isDrawingBbox = false;
    }
  }

  private latLngToWKT(features) {
    let wktType = 'POLYGON[###]';
    if (features.length > 1) {
      wktType = 'MULTIPOLYGON([###])';
    }

    let polygons = '';
    features.forEach((feat, indexFeature) => {
      if (feat) {
        const currentFeat: Array<any> = feat.geometry.coordinates;
        polygons += (indexFeature === 0 ? '' : ',') + '((';
        currentFeat[0].forEach((coord, index) => {
          polygons += (index === 0 ? '' : ',') + coord[0] + ' ' + coord[1];
        });
        polygons += '))';
      }
    });

    let wkt = '';
    if (polygons !== '') {
      wkt = wktType.replace('[###]', polygons);
    }
    return wkt;
  }

  /**
   * @description Add map sources
   */
  private addSourcesToMap(sources: Array<MapSource>, map: any) {
    // Add sources defined as input in mapSources;
    const mapSourcesMap = new Map<string, MapSource>();
    if (sources) {
      sources.forEach(mapSource => {
        mapSourcesMap.set(mapSource.id, mapSource);
      });
      mapSourcesMap.forEach((mapSource, id) => {
        if (map.getSource(id) === undefined) {
          map.addSource(id, mapSource.source);
        }
      });
    }
  }

  /**
   *
   * @param west west longitude in EPSG4326
   * @param south south latitude in EPSG4326
   * @param east east longitude in EPSG4326
   * @param north north latitude in EPSG4326
   * @param zoom zoom level
   */
  private bboxToGeohashList(west: number, south: number, east: number, north: number, zoom: number): Array<string> {
    let geohashList = [];
    if (west < -180 && east > 180) {
      geohashList = bboxes(Math.min(south, north),
        -180,
        Math.max(south, north),
        180, Math.max(this.getGeohashLevelFromZoom(zoom), 1));
    } else if (west < -180 && east < 180) {
      const geohashList_1: Array<string> = bboxes(Math.min(south, north),
        Math.min(-180, west + 360),
        Math.max(south, north),
        Math.max(-180, west + 360), Math.max(this.getGeohashLevelFromZoom(zoom), 1));
      const geohashList_2: Array<string> = bboxes(Math.min(south, north),
        Math.min(east, 180),
        Math.max(south, north),
        Math.max(east, 180), Math.max(this.getGeohashLevelFromZoom(zoom), 1));
      geohashList = geohashList_1.concat(geohashList_2);

    } else if (east > 180 && west > -180) {
      const geohashList_1: Array<string> = bboxes(Math.min(south, north),
        Math.min(180, east - 360),
        Math.max(south, north),
        Math.max(180, east - 360), Math.max(this.getGeohashLevelFromZoom(zoom), 1));

      const geohashList_2: Array<string> = bboxes(Math.min(south, north),
        Math.min(west, -180),
        Math.max(south, north),
        Math.max(west, -180), Math.max(this.getGeohashLevelFromZoom(zoom), 1));
      geohashList = geohashList_1.concat(geohashList_2);
    } else {
      geohashList = bboxes(Math.min(south, north),
        Math.min(east, west),
        Math.max(south, north),
        Math.max(east, west), Math.max(this.getGeohashLevelFromZoom(zoom), 1));
    }
    return geohashList;
  }

  /**
   * @description Add base layers of each style group
   */
  private addBaseLayers() {
    this.mapLayers.styleGroups.forEach(styleGroup => {
      styleGroup.base.forEach(layerId => {
        this.addLayer(layerId);
      });
    });
  }

  /**
   * @description Add layers of the selected style of each style group
   */
  private addStylesLayers() {
    this.mapLayers.styleGroups.forEach(styleGroup => {
      let style;
      const localStorageSelectedStyleId = localStorage.getItem(this.LOCAL_STORAGE_STYLE_GROUP + styleGroup.id);
      if (localStorageSelectedStyleId) {
        styleGroup.selectedStyle = this.getStyle(styleGroup.id, localStorageSelectedStyleId, this.mapLayers.styleGroups);
      }
      if (!styleGroup.selectedStyle) {
        style = getDefaultStyle(styleGroup.styles);
        styleGroup.selectedStyle = style;
        localStorage.setItem(this.LOCAL_STORAGE_STYLE_GROUP + styleGroup.id, style.id);
      } else {
        style = styleGroup.selectedStyle;
      }
      if (style.geomStrategy !== undefined) {
        this.switchLayer.next(style);
      }
      style.layerIds.forEach(layerId => {
        this.addLayer(layerId);
      });
    });
  }

  private getAllBasemapStyles(): Array<BasemapStyle> {
    const allBasemapStyles = new Array<BasemapStyle>();
    if (this.basemapStyles) {
      this.basemapStyles.forEach(b => allBasemapStyles.push(b));
      /** Check whether to add [defaultBasemapStyle] to [allBasemapStyles] list*/
      if (this.basemapStyles.map(b => b.name).filter(n => n === this.defaultBasemapStyle.name).length === 0) {
        allBasemapStyles.push(this.defaultBasemapStyle);
      }
    } else {
      allBasemapStyles.push(this.defaultBasemapStyle);
    }
    return allBasemapStyles;
  }

  /**
   * @description returns the basemap style that is displayed when the map is loaded for the first time
   */
  private getAfterViewInitBasemapStyle(): BasemapStyle {
    if (!this.defaultBasemapStyle) {
      throw new Error('[defaultBasemapStyle] input is null or undefined.');
    }
    const allBasemapStyles = this.getAllBasemapStyles();
    const localStorageBasemapStyle: BasemapStyle = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_BASEMAPS));
    /** check if a basemap style is saved in local storage and that it exists in [allBasemapStyles] list */
    if (localStorageBasemapStyle && allBasemapStyles.filter(b => b.name === localStorageBasemapStyle.name
      && b.styleFile === localStorageBasemapStyle.styleFile).length > 0) {
      return localStorageBasemapStyle;
    } else {
      localStorage.setItem(this.LOCAL_STORAGE_BASEMAPS, JSON.stringify(this.defaultBasemapStyle));
      return this.defaultBasemapStyle;
    }
  }

  /**
   * @param selectedBasemapStyle the selected basemap style
   * @description This method sets the [basemapStylesGroup] object that includes the list of basemapStyles
   * and which basemapStyle is selected.
   */
  private setBasemapStylesGroup(selectedBasemapStyle: BasemapStyle) {
    const allBasemapStyles = this.getAllBasemapStyles();
    /** basemapStylesGroup object includes the list of basemap styles and which one is selected */
    this.basemapStylesGroup = {
      basemapStyles: allBasemapStyles,
      selectedBasemapStyle: selectedBasemapStyle
    };
  }

  private addLayer(layerId: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer !== undefined && layer.id === layerId) {
      /** Add the layer if it is not already added */
      if (this.map.getLayer(layerId) === undefined) {
        if (this.firstDrawLayer.length > 0) {
          /** draw layers must be on the top of the layers */
          this.map.addLayer(layer, this.firstDrawLayer);
        } else {
          this.map.addLayer(layer);
        }
      }
    } else {
      throw new Error('The layer `' + layerId + '` specified in `mapLayers.styleGroups` is not declared in `mapLayers.layers`');
    }
  }

  private removeAllLayers() {
    this.mapLayers.styleGroups.forEach(styleGroup => {
      styleGroup.styles.forEach(style => {
        style.layerIds.forEach(layerId => {
          if (this.map.getLayer(layerId) !== undefined) {
            this.map.removeLayer(layerId);
          }
        });
      });
    });
  }

  private highlightFeature(featureToHightLight: { isleaving: boolean, elementidentifier: ElementIdentifier }) {
    if (featureToHightLight && featureToHightLight.elementidentifier) {
      const visibilityFilter = ['==', featureToHightLight.elementidentifier.idFieldName, featureToHightLight.elementidentifier.idValue];
      this.updateLayersVisibility(!featureToHightLight.isleaving, visibilityFilter, ExternalEvent.hover);
    }
  }

  private selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    if (elementToSelect) {
      const visibilityFilter = elementToSelect.length > 0 ?
        elementToSelect.reduce((memo, element) => { memo.push(element.idValue); return memo; }
          , ['in', elementToSelect[0].idFieldName]) : [];
      this.updateLayersVisibility((elementToSelect.length > 0), visibilityFilter, ExternalEvent.select);
    }
  }

  private updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent): void {
    if (this.mapLayers && this.mapLayers.externalEventLayers) {
      this.mapLayers.externalEventLayers.filter(layer => layer.on === visibilityEvent).forEach(layer => {
        if (this.map.getLayer(layer.id) !== undefined) {
          const layerFilter: Array<any> = ['all'];
          if ((<mapboxgl.Layer>layer).filter) {
            Object.assign(layerFilter, (<mapboxgl.Layer>layer).filter);
          }
          if (visibilityCondition) {
            const condition = visibilityFilter;
            layerFilter.push(condition);
            this.map.setFilter(layer.id, layerFilter);
            this.map.setLayoutProperty(layer.id, 'visibility', 'visible');
          } else {
            this.map.setFilter(layer.id, (<mapboxgl.Layer>layer).filter);
            this.map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        }
      });
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
    if (this.start.x !== f.x && this.start.y !== f.y) {
      this.finish([[this.start, f], [e.lngLat]]);
    } else {
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.map.getCanvas().style.cursor = '';
      this.isDrawingBbox = false;
      this.map.dragPan.enable();
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
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
          source: 'bbox'
        },
        geometry: {
          type: 'Polygon',
          coordinates: coordinates
        }
      };
      const geoboxdata = Object.assign({}, this.emptyData);
      geoboxdata.features = [];
      if (this.drawData && this.drawData.features && this.drawData.features.length > 0) {
        this.drawData.features.forEach(df => geoboxdata.features.push(df));
      }
      geoboxdata.features.push(<any>polygonGeojson);
      /** This allows to keep the drawn box on the map. It will be overriden in ngOnChanges `changes['drawData']` */
      this.draw.deleteAll();
      this.draw.add(geoboxdata);
      this.onAoiChanged.next(geoboxdata);
      this.isDrawingBbox = false;
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
  }

   /**
   * @description Returns the geohash level accordinng to the zoom level and `zoomToPrecisionCluster` and `maxPrecision` Inputs.
   * If one of `zoomToPrecisionCluster` or `maxPrecision` is not defined, then it returns 1.
   * @param zoom zoom level
   */
  private getGeohashLevelFromZoom(zoom: number): number {
    const zoomToPrecisionClusterObject = {};
    if (this.zoomToPrecisionCluster) {
      this.zoomToPrecisionCluster.forEach(triplet => {
        zoomToPrecisionClusterObject[triplet[0]] = [triplet[1], triplet[2]];
      });
      if (zoomToPrecisionClusterObject[Math.ceil(zoom) - 1] !== undefined &&
        zoomToPrecisionClusterObject[Math.ceil(zoom) - 1][1] !== undefined) {
          return zoomToPrecisionClusterObject[Math.ceil(zoom) - 1][1];
      } else {
        return (this.maxPrecision && this.maxPrecision.length === 2) ? this.maxPrecision[1] : 1;
      }
    }
    return 1;
  }

  private getNextFeatureId() {
    return ++this.indexId;
  }

  private addCustomId(featureId: string) {
    const id = this.getNextFeatureId();
    this.draw.setFeatureProperty(featureId, 'arlas_id', id);
    this.customIds.set(id, featureId);
  }

  /**
   * Gets Style by `styleId` and `styleGroupId` from the given `styleGroups` list
   * @param styleGroupId Id of the StyleGroup that contains the Style
   * @param styleId Id of the Style
   * @param styleGroups List of StyleGroups containing the style
   */
  private getStyle(styleGroupId: string, styleId: string, styleGroups: Array<StyleGroup>): Style {
    let style;
    if (styleGroups) {
      const styleGroup: StyleGroup = styleGroups.find(sg => sg.id === styleGroupId);
      if (styleGroup && styleGroup.styles) {
        style = styleGroup.styles.find(s => s.id === styleId);
      }
    }
    return style;
  }

  /**
   * Removes from localStorage the style groups that are not in the given `styleGroups` list anymore
   * @param styleGroups list of style groups
   */
  private cleanLocalStorage(styleGroups: Array<StyleGroup>): void {
    const itemsToRemove = Object.keys(localStorage).filter(key => key.startsWith(this.LOCAL_STORAGE_STYLE_GROUP))
      .map(key => key.substring(this.LOCAL_STORAGE_STYLE_GROUP.length))
      .filter(sgId => !styleGroups.find(sg => sg.id === sgId));
    itemsToRemove.forEach(sgId => {
      localStorage.removeItem(this.LOCAL_STORAGE_STYLE_GROUP + sgId);
    });
  }
}

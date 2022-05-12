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
  AfterContentInit,
  AfterViewInit, Component, EventEmitter,
  HostListener, Input,
  OnChanges, OnInit, Output, SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ElementIdentifier } from '../results/utils/results.utils';
import { ControlButton, PitchToggle, DrawControl } from './mapgl.component.control';
import { paddedBounds, MapExtend, LegendData } from './mapgl.component.util';
import * as mapglJsonSchema from './mapgl.schema.json';
import {
  MapLayers, BasemapStyle, BasemapStylesGroup, ExternalEvent,
  ARLAS_ID, FILLSTROKE_LAYER_PREFIX, SCROLLABLE_ARLAS_ID, ARLAS_VSET
} from './model/mapLayers';
import { MapSource } from './model/mapSource';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Feature as TurfFeature, polygon } from '@turf/helpers';
import centroid from '@turf/centroid';
import limitVertexDirectSelectMode from './model/LimitVertexDirectSelectMode';
import validGeomDrawPolygonMode from './model/ValidGeomDrawPolygonMode';
import * as mapboxgl from 'mapbox-gl';
import { FeatureCollection } from '@turf/helpers';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { TransformRequestFunction, AnyLayer } from 'mapbox-gl';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import * as styles from './model/theme';

export const CROSS_LAYER_PREFIX = 'arlas_cross';

export interface OnMoveResult {
  zoom: number;
  zoomStart: number;
  center: Array<number>;
  centerWithOffset: Array<number>;
  extend: Array<number>;
  extendWithOffset: Array<number>;
  rawExtendWithOffset: Array<number>;
  extendForLoad: Array<number>;
  extendForTest: Array<number>;
  rawExtendForLoad: Array<number>;
  rawExtendForTest: Array<number>;
  xMoveRatio: number;
  yMoveRatio: number;
  visibleLayers: Set<string>;
}

export interface VisualisationSetConfig {
  name: string;
  layers: Array<string>;
  enabled?: boolean;
}

export interface IconConfig {
  path: string;
  recolorable?: boolean;
}

export const ZOOM_IN = 'Zoom in';
export const ZOOM_OUT = 'Zoom out';
export const RESET_BEARING = 'Reset bearing to north';
export const LAYER_SWITCHER_TOOLTIP = 'Manage layers';
export const GEOJSON_SOURCE_TYPE = 'geojson';

/**
 * Mapgl Component allows to display and select geometrical data on a map.
 */

@Component({
  selector: 'arlas-mapgl',
  templateUrl: './mapgl.component.html',
  styleUrls: ['./mapgl.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MapglComponent implements OnInit, AfterViewInit, OnChanges, AfterContentInit {

  public map: any;
  public draw: any;
  public zoom: number;
  public legendOpen = true;
  private emptyData: FeatureCollection = {
    'type': 'FeatureCollection',
    'features': []
  };
  private index: any;
  private north: number;
  private east: number;
  private west: number;
  private south: number;
  private isDrawingBbox = false;
  private start: mapboxgl.Point;
  private canvas: HTMLElement;
  private box: HTMLElement;
  private current: mapboxgl.Point;
  private startlngLat: any;
  private endlngLat: any;
  private savedEditFeature = null;

  public FINISH_DRAWING = 'Double click to finish drawing';
  private POLYGON_LABEL_SOURCE = 'polygon_label';
  private LOCAL_STORAGE_BASEMAPS = 'arlas_last_base_map';
  private ICONS_BASE_PATH = 'assets/icons/';

  /**
   * @Input : Angular
   * @description element identifier given to map container
   */
  @Input() public id='mapgl';

  /**
   * @Input : Angular
   * @description List of mapgl layers
   */
  @Input() public mapLayers: MapLayers;

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
    isleaving: boolean;
    elementidentifier: ElementIdentifier;
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
   * @description Options object for draw tools : https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#options
   */
  @Input() public drawOption: any = {};

  /**
   * @Input : Angular
   * @description Features drawn at component start
   */
  @Input() public drawData: { type: string; features: Array<any>; } = Object.assign({}, this.emptyData);

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
   * @description A callback run before the Map makes a request for an external URL, mapbox map option
   */
  @Input() public transformRequest: TransformRequestFunction;

  /**
   * @Input : Angular
   * @description Whether the drawing buffer is activated
   * If true , the map's canvas can be exported to a PNG using map.getCanvas().toDataURL()
   * default: false
   */
  @Input() public preserveDrawingBuffer = false;

  /**
   * @Input : Angular
   * @description An object with noth,east,south,west properies which represent an offset in pixel
   * Origin is top-left and x axe is west to east and y axe north to south.
   */
  @Input() public offset: { north: number; east: number; south: number; west: number; } =
    { north: 0, east: 0, south: 0, west: 0 };

  /**
   * @Input : Angular
   * @description Subject to which the component subscribes to redraw on the map the `data` of the given `source`.
   */
  @Input() public redrawSource: Subject<{ source: string; data: TurfFeature[]; }> =
    new Subject<{ source: string; data: TurfFeature[]; }>();

  /**
   * @Input : Angular
   * @description Subject of [layerId, legendData] map. The map subscribes to it to keep
   * the legend updated with the data displayed on the map.
   */
  @Input() public legendUpdater: Subject<Map<string, LegendData>> = new Subject<Map<string, LegendData>>();

  /**
   * @Input : Angular
   * @description Subject of [layerId, boolean] map. The map subscribes to it to keep
   * the legend updated with the visibility of the layer.
   */
  @Input() public visibilityUpdater: Subject<Map<string, boolean>> = new Subject();

  /**
   * @Input : Angular
   * @description List of data sources names that should be added to the map. Sources should be of type `geojson`
   */
  @Input() public dataSources: Set<string>;

  /**
   * @Input : Angular
   * @description List of visualisation sets. A Visualisation set is an entity where to group layers together.
   * If a visualisation set is enabled, all the layers in it can be displayed on the map, otherwise the layers are removed from the map.
   */
  @Input() public visualisationSetsConfig: Array<VisualisationSetConfig>;

  public visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  };

  /**
   * @Input : Angular
   * @description List of icons to add to the map and that can be used in layers.
   */
  @Input() public icons: Array<IconConfig>;

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

  @Output() public visualisations: EventEmitter<Set<string>> = new EventEmitter();
  /**
   * @Output : Angular
   * @description Emits the event of clicking on a feature.
   */
  @Output() public onFeatureClic: EventEmitter<any> = new EventEmitter<any>();
  /**
   * @Output : Angular
   * @description Emits the event of hovering feature.
   */
  @Output() public onFeatureOver: EventEmitter<any> = new EventEmitter<any>();
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
  /**
   * @Output :  Angular
   * @description Emits the geojson of an aoi added to the map
   */
  @Output() public onBasemapChanged: Subject<boolean> = new Subject();
  /**
   * @Output :  Angular
   * @description Emits which layers are displayed in the Legend
   */
  @Output() public legendVisibiltyStatus: Subject<Map<string, boolean>> = new Subject();

  public showBasemapsList = false;
  public layersMap: Map<string, mapboxgl.Layer>;
  public basemapStylesGroup: BasemapStylesGroup;

  public currentLat: string;
  public currentLng: string;

  // Polygon
  public nbPolygonVertice = 0;
  public polygonlabeldata: { type: string; features: Array<any>; } = Object.assign({}, this.emptyData);
  private indexId = 0;
  private customIds = new Map<number, string>();
  private isDrawingPolygon = false;
  private isInSimpleDrawMode = false;
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
  public visibilityStatus = new Map();
  public isDrawPolyonSelected = false;
  public drawClickCounter = 0;
  private drawSelectionChanged = false;
  private finishDrawTooltip: HTMLElement;

  constructor(private http: HttpClient, private _snackBar: MatSnackBar, private translate: TranslateService) { }


  /**
   *
   * @param visualisation visualisation set name
   * @param l layer id
   * @param visible whether the layer is enabled and visible in the visualisation set
   */
  public emitLegendVisibility(visualisation: string, l: string, visible: boolean): void {
    this.visibilityStatus.set(visualisation + ARLAS_VSET + l, visible);
    this.legendVisibiltyStatus.next(this.visibilityStatus);
  }
  /** Hides/shows all the layers inside the given visualisation name*/
  public emitVisualisations(visualisationName: string) {
    const visuStatus = !this.visualisationsSets.status.get(visualisationName);
    this.visualisationSetsConfig.find(v => v.name === visualisationName).enabled = visuStatus;
    if (!visuStatus) {
      const layersSet = new Set(this.visualisationsSets.visualisations.get(visualisationName));
      this.visualisationsSets.visualisations.forEach((ls, v) => {
        if (v !== visualisationName) {
          ls.forEach(ll => {
            if (layersSet && layersSet.has(ll)) {
              layersSet.delete(ll);
            }
          });
        }
      });
      layersSet.forEach(ll => {
        (this.map as mapboxgl.Map).setLayoutProperty(ll, 'visibility', 'none');
        this.setStrokeLayoutVisibility(ll, 'none');
        this.setScrollableLayoutVisibility(ll, 'none');
      });
    }
    this.visualisationsSets.status.set(visualisationName, visuStatus);
    const layers = new Set<string>();
    this.visualisationsSets.visualisations.forEach((ls, v) => {
      if (this.visualisationsSets.status.get(v)) {
        ls.forEach(l => {
          layers.add(l);
          (this.map as mapboxgl.Map).setLayoutProperty(l, 'visibility', 'visible');
          this.setStrokeLayoutVisibility(l, 'visible');
          this.setScrollableLayoutVisibility(l, 'visible');
        });
      }
    });
    this.visualisations.emit(layers);
    this.reorderLayers();
  }

  /**
   * @description Add an external visulisation set to the map
   * @param visualisation A visulisation set object to add to the map
   * @param layers List of actual layers that are declared in `visualisation` object
   * @param sources List of sources that these external `layers` use.
   */
  public addVisualisation(visualisation: VisualisationSetConfig, layers: Array<AnyLayer>, sources: Array<MapSource>): void {
    sources.forEach((s) => {
      this.map.addSource(s.id, s.source);
    });
    this.visualisationSetsConfig.unshift(visualisation);
    this.visualisationsSets.visualisations.set(visualisation.name, new Set(visualisation.layers));
    this.visualisationsSets.status.set(visualisation.name, visualisation.enabled);
    layers.forEach(layer => {
      this.map.addLayer(layer);
    });
    const layersMap = new Map();
    this.mapLayers.layers.concat(layers).forEach(layer => layersMap.set(layer.id, layer));
    this.layersMap = layersMap;

    this.reorderLayers();
  }

  /**
   * @description Updates the visibility status of the given layers in Legend component
   * @param visibility Map of layerId, and its visibility status as boolean (true = visible)
   */
  public updateLayerVisibility(visibility: Map<string, boolean>) {

    this.visibilityUpdater.next(visibility);
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

  /** puts the visualisation set list in the new order after dropping */
  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.visualisationSetsConfig, event.previousIndex, event.currentIndex);
    this.reorderLayers();
  }

  /** puts the layers list in the new order after dropping */
  public dropLayer(event: CdkDragDrop<string[]>, visuName: string) {
    const layers = Array.from(this.visualisationSetsConfig.find(v => v.name === visuName).layers);
    moveItemInArray(layers, event.previousIndex, event.currentIndex);
    this.visualisationSetsConfig.find(v => v.name === visuName).layers = layers;
    this.reorderLayers();
  }

  /** Sets the layers order according to the order of `visualisationSetsConfig` list*/
  public reorderLayers() {
    // parses the visulisation list from bottom in order to put the fist ones first
    for (let i = this.visualisationSetsConfig.length - 1; i >= 0; i--) {
      const visualisation: VisualisationSetConfig = this.visualisationSetsConfig[i];
      if (!!visualisation.layers && visualisation.enabled) {
        for (let j = visualisation.layers.length - 1; j >= 0; j--) {
          const l = visualisation.layers[j];
          const layer = this.layersMap.get(l);
          const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
          const scrollableLayer = this.layersMap.get(scrollableId);
          if (!!scrollableLayer && !!this.map.getLayer(scrollableId)) {
            this.map.moveLayer(scrollableId);
          }
          if (!!this.map.getLayer(l)) {
            this.map.moveLayer(l);
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this.layersMap.get(strokeId);
              if (!!strokeLayer && !!this.map.getLayer(strokeId)) {
                this.map.moveLayer(strokeId);
              }
              const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + strokeLayer.id;
              const selectLayer = this.layersMap.get(selectId);
              if (!!selectLayer && !!this.map.getLayer(selectId)) {
                this.map.moveLayer(selectId);
              }
              const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + strokeLayer.id;
              const hoverLayer = this.layersMap.get(hoverId);
              if (!!hoverLayer && !!this.map.getLayer(hoverId)) {
                this.map.moveLayer(hoverId);
              }
            }
          }
          const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + layer.id;
          const selectLayer = this.layersMap.get(selectId);
          if (!!selectLayer && !!this.map.getLayer(selectId)) {
            this.map.moveLayer(selectId);
          }
          const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + layer.id;
          const hoverLayer = this.layersMap.get(hoverId);
          if (!!hoverLayer && !!this.map.getLayer(hoverId)) {
            this.map.moveLayer(hoverId);
          }
        }
      }
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.map !== undefined) {
      if (changes['drawData'] !== undefined) {
        this.drawData = changes['drawData'].currentValue;
        const centroides = new Array();
        this.drawData.features.forEach(feature => {
          const poly = polygon(feature.geometry.coordinates);
          const cent = centroid(poly);
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
    const layers: Array<mapboxgl.Layer> = (<mapboxgl.Map>this.map).getStyle().layers;
    const sources = (<mapboxgl.Map>this.map).getStyle().sources;
    if (s.layers) {
      s.layers.forEach(l => selectedBasemapLayersSet.add(l.id));
    }
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
      this.onBasemapChanged.next(true);
    });
  }

  public ngAfterContentInit(): void {
    /** [basemapStylesGroup] object includes the list of basemap styles and which one is selected */
    this.setBasemapStylesGroup(this.getAfterViewInitBasemapStyle());
  }

  public ngAfterViewInit() {

    const afterViewInitbasemapStyle: BasemapStyle = this.getAfterViewInitBasemapStyle();

    /** init values */
    if (!this.initCenter) {
      this.initCenter = [0, 0];
    }
    if (this.initZoom === undefined || this.initZoom === null) {
      this.initZoom = 3;
    }
    if (this.maxZoom === undefined || this.maxZoom === null) {
      this.maxZoom = 22;
    }
    if (this.minZoom === undefined || this.minZoom === null) {
      this.maxZoom = 0;
    }

    this.map = new mapboxgl.Map({
      container: this.id,
      style: afterViewInitbasemapStyle.styleFile,
      center: this.initCenter,
      zoom: this.initZoom,
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      renderWorldCopies: true,
      preserveDrawingBuffer: this.preserveDrawingBuffer,
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

    const navigationControllButtons = new mapboxgl.NavigationControl();
    const addGeoBoxButton = new ControlButton('addgeobox');
    const removeAoisButton = new ControlButton('removeaois');


    this.map.addControl(navigationControllButtons, 'top-right');
    this.map.addControl(new PitchToggle(-20, 70, 11), 'top-right');
    this.map.addControl(addGeoBoxButton, 'top-right');
    this.map.addControl(removeAoisButton, 'top-right');
    const drawOptions = {
      ...this.drawOption, ...{
        styles: styles.default,
        modes: Object.assign(
          MapboxDraw.modes,
          {
            static: StaticMode,
            limit_vertex: limitVertexDirectSelectMode,
            draw_polygon: validGeomDrawPolygonMode
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
      this.draw.changeMode('static');
      if (this.icons) {
        this.icons.forEach(icon => {
          this.map.loadImage(
            this.ICONS_BASE_PATH + icon.path,
            (error, image) => {
              if (error) {
                console.warn('The icon "' + this.ICONS_BASE_PATH + icon.path + '" is not found');
              } else {
                this.map.addImage(icon.path.split('.')[0], image, { 'sdf': icon.recolorable });
              }
            });
        });
      }
      this.firstDrawLayer = this.map.getStyle().layers
        .map(layer => layer.id)
        .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0)[0];
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();

      // Add Data_source
      if (this.dataSources) {
        this.dataSources.forEach(source => {
          this.map.addSource(source, {
            type: GEOJSON_SOURCE_TYPE,
            data: Object.assign({}, this.emptyData)
          });
        });
      }
      this.map.addSource(this.POLYGON_LABEL_SOURCE, {
        'type': GEOJSON_SOURCE_TYPE,
        'data': this.polygonlabeldata
      });
      this.addSourcesToMap(this.mapSources, this.map);
      if (this.mapLayers !== null) {
        const layersMap = new Map();
        this.mapLayers.layers.forEach(layer => layersMap.set(layer.id, layer));
        this.layersMap = layersMap;
        this.addVisuLayers();
        this.addExternalEventLayers();

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
            const features = (this.map as mapboxgl.Map).queryRenderedFeatures(e.point);
            const hasCrossOrDrawLayer = (!!features && !!features.find(f => f.layer.id.startsWith(CROSS_LAYER_PREFIX)));
            if (!this.isDrawingBbox && !this.isDrawingPolygon && !this.isInSimpleDrawMode && !hasCrossOrDrawLayer) {
              this.onFeatureClic.next({ features: e.features, point: [e.lngLat.lng, e.lngLat.lat] });
            }
          });
        });

        [
          'gl-draw-polygon-stroke-inactive',
          'gl-draw-polygon-stroke-active',
          'gl-draw-polygon-stroke-static'
        ].forEach(layer =>
          ['.cold', '.hot'].forEach(layerId =>
            this.map.on('mousemove', layer.concat(layerId), (e) => {
              this.map.getCanvas().style.cursor = 'pointer';
            })
          )
        );
        [
          'gl-draw-polygon-stroke-inactive',
          'gl-draw-polygon-stroke-active',
          'gl-draw-polygon-stroke-static'
        ].forEach(layer =>
          ['.cold', '.hot'].forEach(layerId =>
            this.map.on('mouseleave', layer.concat(layerId), (e) => {
              this.map.getCanvas().style.cursor = '';
            })));

        this.mapLayers.events.onHover.forEach(layerId => {
          this.map.on('mousemove', layerId, (e) => {
            this.onFeatureOver.next({ features: e.features, point: [e.lngLat.lng, e.lngLat.lat] });
          });

          this.map.on('mouseleave', layerId, (e) => {
            this.onFeatureOver.next([]);
          });
        });

        this.visibilityUpdater.subscribe(visibilityStatus => {
          visibilityStatus.forEach((vs, l) => {
            if (!vs) {
              (this.map as mapboxgl.Map).setLayoutProperty(l, 'visibility', 'none');
              this.setStrokeLayoutVisibility(l, 'none');
              this.setScrollableLayoutVisibility(l, 'none');
            } else {
              let oneVisualisationEnabled = false;
              this.visualisationSetsConfig.forEach(v => {
                const ls = new Set(v.layers);
                if (ls.has(l) && v.enabled) {
                  oneVisualisationEnabled = true;
                  (this.map).setLayoutProperty(l, 'visibility', 'visible');
                  this.setStrokeLayoutVisibility(l, 'visible');
                  this.setScrollableLayoutVisibility(l, 'visible');
                }
              });
              if (!oneVisualisationEnabled) {
                (this.map).setLayoutProperty(l, 'visibility', 'none');
                this.setStrokeLayoutVisibility(l, 'none');
                this.setScrollableLayoutVisibility(l, 'none');
              }
            }
          });
        });
      }
      this.map.showTileBoundaries = false;
      this.map.on('mousemove', (e) => {
        if (this.isDrawingBbox || this.isDrawingPolygon) {
          this.map.getCanvas().style.cursor = 'crosshair';
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

      this.map.on('draw.onClick', (e) => {
        if (this.drawClickCounter === 0) {
          window.addEventListener('mousemove', mouseMoveForDraw);
        }
        this.drawClickCounter++;
      });

      this.map.on('draw.onStop', () => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.map.getCanvas().style.cursor = '';
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
        this.map.getCanvas().style.cursor = '';
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
          this.isDrawingBbox = false;
          this.isDrawingPolygon = false;
          this.isInSimpleDrawMode = false;
          this.draw.changeMode('static');
          this.map.getCanvas().style.cursor = '';
        }
      });
      this.map.on('draw.modechange', (e) => {
        if (e.mode === 'draw_polygon') {
          this.isDrawingPolygon = true;
          this.isInSimpleDrawMode = false;
        }
        if (e.mode === 'simple_select') {
          this.isInSimpleDrawMode = true;
        }
        if (e.mode === 'static') {
          this.isDrawingPolygon = false;
          this.isInSimpleDrawMode = false;
          this.map.getCanvas().style.cursor = '';
        }
        if (e.mode === 'direct_select') {
          const selectedFeatures = this.draw.getSelected().features;
          const selectedIds = this.draw.getSelectedIds();
          if (selectedFeatures && selectedIds && selectedIds.length > 0) {
            if (selectedFeatures[0].properties.source === 'bbox') {
              this.draw.changeMode('simple_select', {
                featureIds: [selectedIds[0]]
              });
              this.isInSimpleDrawMode = true;
            } else if (this.drawPolygonVerticesLimit) {
              this.draw.changeMode('limit_vertex', {
                featureId: selectedIds[0],
                maxVertexByPolygon: this.drawPolygonVerticesLimit,
                selectedCoordPaths: selectedFeatures[0].geometry.coordinates
              });
            }
          } else {
            this.isDrawingPolygon = false;
            this.isInSimpleDrawMode = false;
            this.map.getCanvas().style.cursor = '';
          }
        }
      });

      this.map.on('click', (e) => {
        if (this.isDrawingPolygon) {
          this.nbPolygonVertice++;
          if (this.nbPolygonVertice === this.drawPolygonVerticesLimit) {
            this.draw.changeMode('static');
            this.isDrawingPolygon = false;
            this.nbPolygonVertice = 0;
          }
        } else {
          this.nbPolygonVertice = 0;
          const features = this.map.queryRenderedFeatures(e.point);
          // edit polygon condition : no arlas feature && mapbox-gl-draw source present
          const editCondition = features.filter(f => f.layer.id?.indexOf('arlas') >= 0).length === 0 &&
            features.filter(f => f.source.startsWith('mapbox-gl-draw')).length > 0;
          if (editCondition) {
            const candidates = features.filter(f => f.source.startsWith('mapbox-gl-draw'));
            // edit only on click on the border of the polygon
            const id = candidates.filter(f => f.layer.id?.indexOf('stroke') >= 0)[0]?.properties?.id;
            if (!!id) {
              this.draw.changeMode('simple_select', {
                featureIds: [id]
              });
              this.isInSimpleDrawMode = true;

            }
          }
        }
      });
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

    this.visualisationsSets = {
      visualisations: new Map(),
      status: new Map()
    };
    if (this.visualisationSetsConfig) {
      this.visualisationSetsConfig.forEach(visu => {
        this.visualisationsSets.visualisations.set(visu.name, new Set(visu.layers));
        this.visualisationsSets.status.set(visu.name, visu.enabled);
      });
    }
    const moveend = fromEvent(this.map, 'moveend')
      .pipe(debounceTime(750));
    moveend.subscribe(e => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();
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
      const visibleLayers = new Set<string>();
      this.visualisationsSets.status.forEach((b, vs) => {
        if (b) {
          this.visualisationsSets.visualisations.get(vs).forEach(l => visibleLayers.add(l));
        }
      });
      const onMoveData: OnMoveResult = {
        zoom: this.zoom,
        zoomStart: this.zoomStart,
        center: this.map.getCenter(),
        centerWithOffset: [centerOffSetLatLng.lng, centerOffSetLatLng.lat],
        extendWithOffset: [wrapNorthOffset, wrapWestOffset, wrapSouthOffset, wrapEastOffset],
        rawExtendWithOffset: [rawNorthOffset, rawWestOffset, rawSouthOffset, rawEastOffset],
        extend: [this.north, this.west, this.south, this.east],
        extendForLoad: [],
        extendForTest: [],
        rawExtendForLoad: [],
        rawExtendForTest: [],
        xMoveRatio: this.xMoveRatio,
        yMoveRatio: this.yMoveRatio,
        visibleLayers: visibleLayers
      };

      const panLoad = this.margePanForLoad * Math.max(height, width) / 100;
      const panTest = this.margePanForTest * Math.max(height, width) / 100;
      const extendForLoadLatLng = paddedBounds(panLoad, panLoad, panLoad, panLoad, this.map, southWest, northEast);
      const extendForTestdLatLng = paddedBounds(panTest, panTest, panTest, panTest, this.map, southWest, northEast);
      onMoveData.extendForLoad = [
        extendForLoadLatLng[1].wrap().lat,
        extendForLoadLatLng[0].wrap().lng,
        extendForLoadLatLng[0].wrap().lat,
        extendForLoadLatLng[1].wrap().lng
      ];
      onMoveData.extendForTest = [
        extendForTestdLatLng[1].wrap().lat,
        extendForTestdLatLng[0].wrap().lng,
        extendForTestdLatLng[0].wrap().lat,
        extendForTestdLatLng[1].wrap().lng
      ];
      onMoveData.rawExtendForLoad = [
        extendForLoadLatLng[1].lat,
        extendForLoadLatLng[0].lng,
        extendForLoadLatLng[0].lat,
        extendForLoadLatLng[1].lng,
      ];
      onMoveData.rawExtendForTest = [
        extendForTestdLatLng[1].lat,
        extendForTestdLatLng[0].lng,
        extendForTestdLatLng[0].lat,
        extendForTestdLatLng[1].lng,
      ];
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

    if (!!this.redrawSource) {
      this.redrawSource.subscribe(sd => {
        if (this.map.getSource(sd.source) !== undefined) {
          this.map.getSource(sd.source).setData({
            'type': 'FeatureCollection',
            'features': sd.data
          });
        }
      });
    }

  }

  /**
   * @description Display the basemapswitcher
   */
  public showBasemapSwitcher() {
    this.showBasemapsList = true;
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

  public onChangePolygonDraw() {
    this.onPolygonChange.next(this.draw.getAll().features);

    const centroides = new Array<any>();
    this.draw.getAll().features.forEach(feature => {
      const poly = polygon(feature.geometry.coordinates);
      const cent = centroid(poly);
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
    this.isInSimpleDrawMode = false;
  }

  public switchToEditMode() {
    this.draw.changeMode('simple_select', {
      featureIds: this.draw.getAll().features.map(f => f.id)
    });
    this.isInSimpleDrawMode = true;
    this.isDrawingPolygon = false;
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

  public selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string) {
    const ids = features.map(f => f.idValue);
    const visibilityFilter = ids.length > 0 ? ['in', ['get', features[0].idFieldName], ['literal', ids]] : [];
    this.updateLayersVisibility((features.length > 0), visibilityFilter, ExternalEvent.select, collection);
  }

  public hideBasemapSwitcher() {
    this.showBasemapsList = false;
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

  private addVisuLayers() {
    if (!!this.visualisationSetsConfig) {
      for (let i = this.visualisationSetsConfig.length - 1; i >= 0; i--) {
        const visualisation: VisualisationSetConfig = this.visualisationSetsConfig[i];
        if (!!visualisation.layers) {
          for (let j = visualisation.layers.length - 1; j >= 0; j--) {
            const l = visualisation.layers[j];
            const layer = this.layersMap.get(l);
            const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
            const scrollableLayer = this.layersMap.get(scrollableId);
            if (!!scrollableLayer) {
              this.addLayer(scrollableId);
            }
            this.addLayer(l);
            /** add stroke layer if the layer is a fill */
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this.layersMap.get(strokeId);
              if (!!strokeLayer) {
                this.addLayer(strokeId);
              }
            }
          }
        }
      }
      this.visualisationsSets.status.forEach((b, vs) => {
        if (!b) {
          this.visualisationsSets.visualisations.get(vs).forEach(l => {
            this.map.setLayoutProperty(l, 'visibility', 'none');
            this.setStrokeLayoutVisibility(l, 'none');
            this.setScrollableLayoutVisibility(l, 'none');
          });
        }
      });
      this.visualisationsSets.status.forEach((b, vs) => {
        if (b) {
          this.visualisationsSets.visualisations.get(vs).forEach(l => {
            this.map.setLayoutProperty(l, 'visibility', 'visible');
            this.setStrokeLayoutVisibility(l, 'visible');
            this.setScrollableLayoutVisibility(l, 'visible');
          });

        }
      });
    }
  }

  private addExternalEventLayers() {
    this.mapLayers.layers
      .filter(layer => this.mapLayers.externalEventLayers.map(e => e.id).indexOf(layer.id) >= 0)
      .forEach(l => this.addLayer(l.id));


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
      throw new Error('The layer `' + layerId + '` is not declared in `mapLayers.layers`');
    }
  }

  private highlightFeature(featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; }) {
    if (featureToHightLight && featureToHightLight.elementidentifier) {
      const visibilityFilter = ['==', ['get', featureToHightLight.elementidentifier.idFieldName],
        featureToHightLight.elementidentifier.idValue];
      this.updateLayersVisibility(!featureToHightLight.isleaving, visibilityFilter, ExternalEvent.hover);
    }
  }

  private selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    if (elementToSelect) {
      const visibilityFilter = elementToSelect.length > 0 ?
        elementToSelect.reduce((memo, element) => {
          memo.push(element.idValue); return memo;
        }, ['in', ['get', elementToSelect[0].idFieldName]]) : [];
      this.updateLayersVisibility((elementToSelect.length > 0), visibilityFilter, ExternalEvent.select);
    }
  }

  private updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
    collection?: string): void {
    if (this.mapLayers && this.mapLayers.externalEventLayers) {
      this.mapLayers.externalEventLayers.filter(layer => layer.on === visibilityEvent).forEach(layer => {
        if (this.map.getLayer(layer.id) !== undefined) {
          let originalLayerIsVisible = false;
          const fullLayer = this.layersMap.get(layer.id);
          const isCollectionCompatible = (!collection || (!!collection && (fullLayer.source as string).includes(collection)));
          if (isCollectionCompatible) {
            const originalLayerId = layer.id.replace('arlas-' + visibilityEvent.toString() + '-', '');
            if (this.map.getLayer(originalLayerId) !== undefined) {
              originalLayerIsVisible = this.map.getLayer(originalLayerId).visibility === 'visible';
            }
            const layerFilter: Array<any> = [];
            const externalEventLayer = this.layersMap.get(layer.id);
            if (!!externalEventLayer && !!externalEventLayer.filter) {
              externalEventLayer.filter.forEach(f => {
                layerFilter.push(f);
              });
            }
            if (layerFilter.length === 0) {
              layerFilter.push('all');
            }
            if (visibilityCondition && originalLayerIsVisible) {
              const condition = visibilityFilter;
              layerFilter.push(condition);
              this.map.setFilter(layer.id, layerFilter);
              this.map.setLayoutProperty(layer.id, 'visibility', 'visible');
            } else {
              this.map.setFilter(layer.id, (layer as any).filter);
              this.map.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          }
        }
      });
    }
  }

  private mousedown = (e) => {
    // Continue the rest of the function if we add a geobox.
    if (!this.isDrawingBbox) {
      return;
    }
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
  };

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
  };

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
  };

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


  private getNextFeatureId() {
    return ++this.indexId;
  }

  private addCustomId(featureId: string) {
    const id = this.getNextFeatureId();
    this.draw.setFeatureProperty(featureId, 'arlas_id', id);
    this.customIds.set(id, featureId);
  }

  private setStrokeLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer.type === 'fill') {
      const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
      const strokeLayer = this.layersMap.get(strokeId);
      if (!!strokeLayer) {
        this.map.setLayoutProperty(strokeId, 'visibility', visibility);
      }
    }
  }

  private setScrollableLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollbaleLayer = this.layersMap.get(scrollableId);
    if (!!scrollbaleLayer) {
      this.map.setLayoutProperty(scrollableId, 'visibility', visibility);
    }
  }
}

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
  HostListener, Input, ViewEncapsulation,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';
import { ElementIdentifier } from '../results/utils/results.utils';
import { ControlButton, PitchToggle, DrawControl } from './mapgl.component.control';
import { paddedBounds, MapExtend, LegendData } from './mapgl.component.util';
import * as mapglJsonSchema from './mapgl.schema.json';
import {
  MapLayers, ExternalEvent,
  ARLAS_ID, FILLSTROKE_LAYER_PREFIX, SCROLLABLE_ARLAS_ID, ARLAS_VSET
} from './model/mapLayers';
import { MapSource } from './model/mapSource';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Feature, Polygon, Feature as TurfFeature, polygon } from '@turf/helpers';
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
import { getLayerName } from '../componentsUtils';
import { MapboxAoiDrawService } from './draw/draw.service';
import { AoiDimensions, BboxDrawCommand } from './draw/draw.models';
import { BasemapStyle } from './basemaps/basemap.config';
import { MapboxBasemapService } from './basemaps/basemap.service';
import { ArlasBasemaps } from './basemaps/basemaps';
import circleMode from './draw/modes/circles/circle.mode';
import radiusCircleMode from './draw/modes/circles/radius.circle.mode';
import simpleSelectModeOverride from './draw/modes/simpleSelectOverride';
import directModeOverride from './draw/modes/directSelectOverride';
import stripMode from './draw/modes/strip/strip.mode';
import { stripDirectSelectMode } from './draw/modes/strip/strip.direct.mode';

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
export class MapglComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

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
  private canvas: HTMLElement;
  private box: HTMLElement;
  // points which xy coordinates are in screen referential
  private start: mapboxgl.Point;
  private current: mapboxgl.Point;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  private startlngLat: mapboxgl.LngLat;
  private endlngLat: mapboxgl.LngLat;
  private movelngLat: mapboxgl.LngLat;

  private savedEditFeature = null;

  public FINISH_DRAWING = 'Double click to finish drawing';
  private POLYGON_LABEL_SOURCE = 'polygon_label';
  private ICONS_BASE_PATH = 'assets/icons/';
  private offlineBasemapChangeSubscription!: Subscription;
  /**
   * @Input : Angular
   * @description element identifier given to map container
   */
  @Input() public id = 'mapgl';

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
    styleFile: 'http://demo.arlas.io:82/styles/positron/style.json',
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
  @Input() public drawData: FeatureCollection = Object.assign({}, this.emptyData);

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
   * @description Padding value applied around a fitBounds to fully show the area targeted
   * */
  @Input() public fitBoundsPadding = 10;

  /**
   * @Input : Angular
   * @description Subject to which the component subscribes to redraw on the map the `data` of the given `source`.
   */
  @Input() public redrawSource: Subject<{ source: string; data: TurfFeature[]; }> =
    new Subject<{ source: string; data: TurfFeature[]; }>();

  /**
   * @Input : Angular
   * @description Subject of [collection, [field, legendData]] map. The map subscribes to it to keep
   * the legend updated with the data displayed on the map.
   */
  @Input() public legendUpdater: Subject<Map<string, Map<string, LegendData>>> = new Subject();

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

  /**
   * @Input : Angular
   * @description Position of the map attribution
   */
  @Input() public mapAttributionPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'bottom-right';

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
   * @Output :  Angular
   * @description Emits the map extend on Tab close/refresh
   */
  @Output() public onMapClosed: EventEmitter<MapExtend> = new EventEmitter<MapExtend>();
  /**
   * @Output :  Angular
   * @description Emits the geojson of an aoi added to the map
   */
  @Output() public onAoiChanged: EventEmitter<FeatureCollection> = new EventEmitter();
  @Output() public onAoiEdit: EventEmitter<AoiDimensions> = new EventEmitter();
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
  @Output() public downloadSourceEmitter: Subject<{
    layerId: string;
    layerName: string;
    collection: string;
    sourceName: string;
    downloadType: string;
  }> = new Subject();

  public showBasemapsList = false;
  public layersMap: Map<string, mapboxgl.Layer>;

  public currentLat: string;
  public currentLng: string;

  // Circle
  private isDrawingCircle = false;
  // Strip
  private isDrawingStrip = false;

  // Polygon
  public nbPolygonVertice = 0;
  public polygonlabeldata: { type: string; features: Array<any>; } = Object.assign({}, this.emptyData);
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
  public isDrawSelected = false;
  public drawClickCounter = 0;
  private drawSelectionChanged = false;
  private finishDrawTooltip: HTMLElement;
  private aoiEditSubscription: Subscription;
  private drawBboxSubscription: Subscription;

  public constructor(private http: HttpClient, private drawService: MapboxAoiDrawService,
    private basemapService: MapboxBasemapService,
    private _snackBar: MatSnackBar, private translate: TranslateService) {
    this.aoiEditSubscription = this.drawService.editAoi$.subscribe(ae => this.onAoiEdit.emit(ae));
    this.drawBboxSubscription = this.drawService.drawBbox$.subscribe({
      next: (bboxDC: BboxDrawCommand) => {
        this.drawBbox(bboxDC.east, bboxDC.south, bboxDC.west, bboxDC.north);
      }
    });
  }


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

  public downloadLayerSource(downaload: { layer: mapboxgl.Layer; downloadType: string; }): void {
    const downlodedSource = {
      layerId: downaload.layer.id,
      layerName: getLayerName(downaload.layer.id),
      collection: downaload.layer.metadata.collection,
      sourceName: downaload.layer.source as string,
      downloadType: downaload.downloadType
    };
    this.downloadSourceEmitter.next(downlodedSource);
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

  public ngOnInit() {
    this.offlineBasemapChangeSubscription = this.basemapService.protomapBasemapAdded$.subscribe(() => this.reorderLayers());
  }

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
              if (!!strokeLayer && !!strokeLayer.id) {
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
    this.map.getStyle().layers
      .map(layer => layer.id)
      .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0).forEach(id => this.map.moveLayer(id));

  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.map !== undefined) {
      if (changes['drawData'] !== undefined) {
        this.drawData = changes['drawData'].currentValue;
        const centroides = new Array();
        this.drawData.features.forEach(feature => {
          const poly = polygon((feature.geometry as Polygon).coordinates);
          const cent = centroid(poly);
          cent.properties.arlas_id = feature.properties.arlas_id;
          centroides.push(cent);
        });
        this.polygonlabeldata = {
          type: 'FeatureCollection',
          features: centroides
        };
        if (!this.drawSelectionChanged) {
          this.drawService.addFeatures(this.drawData, /** deleteOld */ true);
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

  public ngAfterViewInit() {
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
    this.basemapService.setBasemaps(new ArlasBasemaps(this.defaultBasemapStyle, this.basemapStyles));
    this.basemapService.fetchSources$()
      .pipe(finalize(() => this.declareMap()))
      .subscribe();
  }

  public declareMap() {
    this.map = new mapboxgl.Map({
      container: this.id,
      style: this.basemapService.getInitStyle(this.basemapService.basemaps.getSelected()),
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
      transformRequest: this.transformRequest,
      attributionControl: false
    });
    (<mapboxgl.Map>this.map).addControl(new mapboxgl.AttributionControl(), this.mapAttributionPosition);
    this.drawService.setMap(this.map);
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

    const navigationControllButtons = new mapboxgl.NavigationControl();
    const addGeoBoxButton = new ControlButton('addgeobox');
    const removeAoisButton = new ControlButton('removeaois');


    this.map.addControl(navigationControllButtons, 'top-right');
    this.map.addControl(new PitchToggle(-20, 70, 11), 'top-right');
    this.map.addControl(addGeoBoxButton, 'top-right');
    this.map.addControl(removeAoisButton, 'top-right');
    this.map.loadImage('assets/rotate/01.png', (error, image) => {
      this.map.addImage('rotate', image);
    });
    this.map.loadImage('assets/resize/01.png', (error, image) => {
      this.map.addImage('resize', image);
    });

    const modes = MapboxDraw.modes;
    const drawStyles = styles.default;
    const drawOptions = {
      ...this.drawOption, ...{
        styles: drawStyles,
        modes: Object.assign(
          modes,
          {
            static: StaticMode,
            limit_vertex: limitVertexDirectSelectMode,
            draw_polygon: validGeomDrawPolygonMode,
            draw_circle: circleMode,
            draw_radius_circle: radiusCircleMode,
            draw_strip: stripMode,
            direct_strip: stripDirectSelectMode,
            direct_select: directModeOverride,
            simple_select: simpleSelectModeOverride
          })
      }
    };

    const drawControl = new DrawControl(drawOptions, this.drawButtonEnabled);
    this.map.addControl(drawControl, 'top-right');
    this.draw = drawControl.mapboxDraw;
    this.draw.modes.DRAW_CIRCLE = 'draw_circle';
    this.draw.modes.DRAW_RADIUS_CIRCLE = 'draw_radius_circle';
    this.draw.modes.DRAW_STRIP = 'draw_strip';
    this.draw.modes.DIRECT_STRIP = 'direct_strip';

    this.drawService.setMapboxDraw(this.draw);
    addGeoBoxButton.btn.onclick = () => {
      this.addGeoBox();
    };
    removeAoisButton.btn.onclick = () => {
      this.removeAois();
    };
    this.map.boxZoom.disable();
    this.map.on('load', () => {
      this.basemapService.declareProtomapProtocol(this.map);
      this.basemapService.addProtomapBasemap(this.map);
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
            if (!this.isDrawingBbox && !this.isDrawingPolygon && !this.isDrawingCircle && !this.isInSimpleDrawMode && !hasCrossOrDrawLayer) {
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
          visibilityStatus.forEach((visibilityStatus, l) => {
            let layerInVisualisations = false;
            if (!visibilityStatus) {
              this.visualisationSetsConfig.forEach(v => {
                const ls = new Set(v.layers);
                if (!layerInVisualisations) {
                  layerInVisualisations = ls.has(l);
                }
              });
              if (layerInVisualisations) {
                (this.map as mapboxgl.Map).setLayoutProperty(l, 'visibility', 'none');
                this.setStrokeLayoutVisibility(l, 'none');
                this.setScrollableLayoutVisibility(l, 'none');
              }
            } else {
              let oneVisualisationEnabled = false;
              this.visualisationSetsConfig.forEach(v => {
                const ls = new Set(v.layers);
                if (!layerInVisualisations) {
                  layerInVisualisations = ls.has(l);
                }
                if (ls.has(l) && v.enabled) {
                  oneVisualisationEnabled = true;
                  (this.map).setLayoutProperty(l, 'visibility', 'visible');
                  this.setStrokeLayoutVisibility(l, 'visible');
                  this.setScrollableLayoutVisibility(l, 'visible');
                }
              });
              if (!oneVisualisationEnabled && layerInVisualisations) {
                (this.map).setLayoutProperty(l, 'visibility', 'none');
                this.setStrokeLayoutVisibility(l, 'none');
                this.setScrollableLayoutVisibility(l, 'none');
              }
            }
          });
        });
      }
      this.map.showTileBoundaries = false;
      this.canvas = this.map.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);
      this.map.on('draw.create', (e) => {
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAll().features.filter(fc =>
              this.drawService.isValidPolygon(fc) ||
              this.drawService.isValidCircle(fc)
            )
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
      });
      this.map.on('draw.delete', (e) => {
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAll().features.filter(fc =>
              this.drawService.isPolygon(fc) ||
              this.drawService.isCircle(fc)
            )
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
      this.map.on('draw.onStart', (e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.map.getCanvas().style.cursor = '';
      });
      this.map.on('draw.onStop', (e) => {
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
          this.isDrawSelected = true;
        } else {
          this.savedEditFeature = null;
          this.isDrawSelected = false;
          this.onAoiChanged.next(
            {
              'type': 'FeatureCollection',
              'features': this.draw.getAll().features.filter(fc =>
                this.drawService.isValidPolygon(fc) ||
                this.drawService.isValidCircle(fc)
              )
            });
          this.isDrawingBbox = false;
          this.isDrawingPolygon = false;
          this.isDrawingCircle = false;
          this.isDrawingStrip = false;
          this.isInSimpleDrawMode = false;
          this.draw.changeMode('static');
          this.map.getCanvas().style.cursor = '';
        }
      });
      this.map.on('draw.modechange', (e) => {
        this.isDrawingPolygon = e.mode === this.draw.modes.DRAW_POLYGON;
        this.isDrawingStrip = e.mode === this.draw.modes.DIRECT_STRIP;
        this.isDrawingCircle = e.mode === this.draw.modes.DRAW_CIRCLE || e.mode === this.draw.modes.DRAW_RADIUS_CIRCLE;
        if (this.isDrawingPolygon || this.isDrawingCircle || this.isDrawingStrip ||e.mode === 'static') {
          this.isInSimpleDrawMode = false;
        }
        if (e.mode === 'simple_select') {
          this.isInSimpleDrawMode = true;
        } else if (e.mode === 'static') {
          this.map.getCanvas().style.cursor = '';
        } else if (e.mode === 'direct_select') {
          const selectedFeatures = this.draw.getSelected().features;
          const selectedIds = this.draw.getSelectedIds();
          if (selectedFeatures && selectedIds && selectedIds.length > 0) {
            if (selectedFeatures[0].properties.source === 'bbox') {
              this.draw.changeMode('simple_select', {
                featureIds: [selectedIds[0]]
              });
              this.isInSimpleDrawMode = true;
            } else if (this.drawPolygonVerticesLimit && selectedFeatures[0].properties.meta !== 'strip') {
              this.draw.changeMode('limit_vertex', {
                featureId: selectedIds[0],
                maxVertexByPolygon: this.drawPolygonVerticesLimit,
                selectedCoordPaths: selectedFeatures[0].geometry.coordinates
              });
              this.isInSimpleDrawMode = false;
            }else if (this.drawPolygonVerticesLimit && selectedFeatures[0].properties.meta === 'strip') {
              this.draw.changeMode('direct_strip', {
                featureId: selectedIds[0],
                maxLenght: selectedFeatures[0].properties.maxLenght,
                halfSwath: selectedFeatures[0].properties.halfSwath,
              });
              this.isInSimpleDrawMode = false;
            }
          } else {
            this.isInSimpleDrawMode = false;
            this.map.getCanvas().style.cursor = '';
          }
        }
      });

      this.map.on('click', (e) => {
        if (this.isDrawingCircle) {
          return;
        }

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
            const candidatesProperties = candidates.filter(f => f.layer.id?.indexOf('stroke') >= 0)[0]?.properties;
            if (candidatesProperties && !!candidatesProperties.id) {
              if (candidatesProperties.user_meta === 'strip') {
                this.draw.changeMode('direct_strip', {
                  featureId: candidatesProperties.id,
                  maxLenght: candidatesProperties.user_maxLenght,
                  halfSwath: candidatesProperties.user_halfSwath
                });
                this.isInSimpleDrawMode = false;
              } else {
                this.draw.changeMode('simple_select', {
                  featureIds: [candidatesProperties.id]
                });
                this.isInSimpleDrawMode = true;
              }

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

    // Mouse events
    this.map.on('mousedown', (e: mapboxgl.MapMouseEvent) => {
      this.startlngLat = e.lngLat;
      this.drawService.startBboxDrawing();
    });
    this.map.on('mouseup', (e: mapboxgl.MapMouseEvent) => {
      this.endlngLat = e.lngLat;
      this.drawService.stopBboxDrawing();
    });
    this.map.on('mousemove', (e: mapboxgl.MapMouseEvent) => {
      const lngLat = e.lngLat;
      if (this.displayCurrentCoordinates) {
        const displayedLngLat = this.wrapLatLng ? lngLat.wrap() : lngLat;
        this.currentLng = String(Math.round(displayedLngLat.lng * 100000) / 100000);
        this.currentLat = String(Math.round(displayedLngLat.lat * 100000) / 100000);
      }
      if (this.isDrawingBbox || this.isDrawingPolygon) {
        this.map.getCanvas().style.cursor = 'crosshair';
        this.movelngLat = lngLat;
      }
      if (this.drawService.bboxEditionState.isDrawing) {
        const startlng: number = this.startlngLat.lng;
        const endlng: number = this.movelngLat.lng;
        const startlat: number = this.startlngLat.lat;
        const endlat: number = this.movelngLat.lat;
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
        this.drawService.emitDimensions(polygonGeojson as Feature);
      }
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
    this.drawService.enableBboxEdition();
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

  public onChangeBasemapStyle() {
    this.onBasemapChanged.next(true);
  }

  /**
   * Return the polygons geometry in WKT or GeoJson given the mode
   * @param mode : string
   */
  public getAllPolygon(mode: 'wkt' | 'geojson') {
    let polygon;
    if (mode === 'wkt') {
      polygon = this.latLngToWKT(this.draw.getAll().features.filter(this.drawService.isPolygon));
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getAll().features.filter(this.drawService.isPolygon)
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
      polygon = this.latLngToWKT(this.draw.getSelected().features.filter(this.drawService.isPolygon));
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getSelected().features.filter(this.drawService.isPolygon)
      };
    }
    return polygon;
  }

  public switchToDrawMode(mode?: string, option?: any) {
    const selectedMode = mode ?? this.draw.modes.DRAW_POLYGON;
    this.isDrawingCircle = selectedMode === this.draw.modes.DRAW_CIRCLE || selectedMode === this.draw.modes.DRAW_RADIUS_CIRCLE;
    this.isDrawingPolygon = selectedMode === this.draw.modes.DRAW_POLYGON;
    this.isInSimpleDrawMode = false;
    this.draw.changeMode(selectedMode, option ?? {});
  }

  public switchToDirectSelectMode(option?: { featureIds: Array<string>; allowCircleResize: boolean; }
    | { featureId: string; allowCircleResize: boolean; }) {
    this.draw.changeMode('direct_select', option);
    this.isInSimpleDrawMode = false;
    this.isDrawingCircle = false;
    this.isDrawingStrip = false;
    this.isDrawingPolygon = false;
  }

  public switchToEditMode() {
    this.draw.changeMode('simple_select', {
      featureIds: this.draw.getAll().features.map(f => f.id)
    });
    this.isInSimpleDrawMode = true;
    this.isDrawingCircle = false;
    this.isDrawingStrip = false;
    this.isDrawingPolygon = false;
  }

  public deleteSelectedItem() {
    if (this.isDrawSelected) {
      this.draw.trash();
    } else {
      this.drawService.deleteAll();
    }
    this.isDrawSelected = false;
    this.onAoiChanged.next(this.draw.getAll());
  }

  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isDrawingBbox) {
      this.map.getCanvas().style.cursor = '';
      this.isDrawingBbox = false;
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.map.getCanvas().style.cursor = '';
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
      this.map.dragPan.enable();
      this.drawService.endDimensionsEmission();
    }
  }

  public ngOnDestroy(): void {
    if (!!this.aoiEditSubscription) {
      this.aoiEditSubscription.unsubscribe();
    }
    if (!!this.offlineBasemapChangeSubscription) {
      this.offlineBasemapChangeSubscription.unsubscribe();
    }
    if (!!this.drawBboxSubscription) {
      this.drawBboxSubscription.unsubscribe();
    }
  }

  public selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string) {
    const ids: Array<number | string> = features.map(f => f.idValue);
    const numericalIds = ids.filter(id => !isNaN(+id)).map(id => +id);
    const visibilityFilter = ids.length > 0 ? ['in', ['get', features[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
    this.updateLayersVisibility((features.length > 0), visibilityFilter, ExternalEvent.select, collection);
  }

  public hideBasemapSwitcher() {
    this.showBasemapsList = false;
  }

  /**
   * Wrapper method to fit the map to the given bounds with enough padding to properly visualize the area
   */
  public paddedFitBounds(bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) {
    const paddedOptions = Object.assign({}, options);
    paddedOptions.padding = {
      top: this.offset.north + this.fitBoundsPadding,
      bottom: this.offset.south + this.fitBoundsPadding,
      left: this.offset.west + this.fitBoundsPadding,
      right: this.offset.east + this.fitBoundsPadding
    };
    (<mapboxgl.Map>this.map).fitBounds(bounds, paddedOptions);
  }

  public moveToCoordinates(lngLat: [number, number]) {
    (this.map as mapboxgl.Map).setCenter(lngLat);
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
      this.reorderLayers();
    }
  }

  private addExternalEventLayers() {
    this.mapLayers.layers
      .filter(layer => this.mapLayers.externalEventLayers.map(e => e.id).indexOf(layer.id) >= 0)
      .forEach(l => this.addLayer(l.id));
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
      const ids: Array<number | string> = [featureToHightLight.elementidentifier.idValue];
      if (!isNaN(+featureToHightLight.elementidentifier.idValue)) {
        ids.push(+featureToHightLight.elementidentifier.idValue);
      }
      const visibilityFilter = ['in', ['get', featureToHightLight.elementidentifier.idFieldName],
        ['literal', ids]];
      this.updateLayersVisibility(!featureToHightLight.isleaving, visibilityFilter, ExternalEvent.hover);
    }
  }

  private selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    if (elementToSelect) {
      const ids = elementToSelect.length > 0 ?
        elementToSelect.reduce((memo, element) => {
          memo.push(element.idValue); return memo;
        }, []) : [];
      const numericalIds = ids.filter(id => !isNaN(+id)).map(id => +id);
      const visibilityFilter = ids.length > 0 ? ['in', ['get', elementToSelect[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
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
    document.removeEventListener('mousemove', this.mousemove);
    document.removeEventListener('mouseup', this.mouseup);
    this.map.getCanvas().style.cursor = '';
    this.map.dragPan.enable();
    // Capture xy coordinates
    if (this.start.x !== f.x && this.start.y !== f.y) {
      this.finish([[this.start, f], [e.lngLat]]);
    } else {
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
    this.drawService.endDimensionsEmission();
  };

  private finish(bbox?) {
    if (bbox) {
      const startlng: number = this.startlngLat.lng;
      const endlng: number = this.endlngLat.lng;
      const startlat: number = this.startlngLat.lat;
      const endlat: number = this.endlngLat.lat;
      const west = Math.min(startlng, endlng);
      const north = Math.max(startlat, endlat);
      const east = Math.max(startlng, endlng);
      const south = Math.min(startlat, endlat);
      this.drawBbox(east, south, west, north);
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
  }


  private drawBbox(east, south, west, north) {
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
    this.drawService.addFeatures(geoboxdata, /** deleteOld */ true);
    this.onAoiChanged.next(geoboxdata);
    this.isDrawingBbox = false;
    this.drawService.disableBboxEdition();
    this.drawService.endDimensionsEmission();
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

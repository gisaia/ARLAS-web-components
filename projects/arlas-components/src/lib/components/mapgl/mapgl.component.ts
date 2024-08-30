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
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ElementIdentifier } from '../results/utils/results.utils';
import { LegendData, MapExtend } from './mapgl.component.util';
import * as mapglJsonSchema from './mapgl.schema.json';
import { ARLAS_VSET, MapLayers } from './model/mapLayers';
import { MapSource } from './model/mapSource';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Feature, FeatureCollection, polygon, Polygon } from '@turf/helpers';
import centroid from '@turf/centroid';
import limitVertexDirectSelectMode from './model/LimitVertexDirectSelectMode';
import validGeomDrawPolygonMode from './model/ValidGeomDrawPolygonMode';
import * as mapboxgl from 'mapbox-gl';
import { AnyLayer, TransformRequestFunction } from 'mapbox-gl';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import * as styles from './model/theme';
import { getLayerName } from '../componentsUtils';
import { MapboxAoiDrawService } from './draw/draw.service';
import { AoiDimensions, BboxDrawCommand } from './draw/draw.models';
import { BasemapStyle } from './basemaps/basemap.config';
import { MapboxBasemapService } from './basemaps/basemap.service';
import { ArlasBasemaps } from './basemaps/basemaps';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import circleMode from './draw/modes/circles/circle.mode';
import radiusCircleMode from './draw/modes/circles/radius.circle.mode';
import simpleSelectModeOverride from './draw/modes/simpleSelectOverride';
import directModeOverride from './draw/modes/directSelectOverride';
import stripMode from './draw/modes/strip/strip.mode';
import { stripDirectSelectMode } from './draw/modes/strip/strip.direct.mode';
import cleanCoords from '@turf/clean-coords';
import { ArlasMapOffset, ControlPosition, DrawControlsOption } from './model/AbstractArlasMapGL';
import { ArlasMapGL, ArlasMapGlConfig } from './model/ArlasMapGL';
import { ArlasDraw } from "./model/ArlasDraw";
import { Geometry } from "@turf/helpers/dist/js/lib/geojson";

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

export const ZOOM_IN = marker('Zoom in');
export const ZOOM_OUT = marker('Zoom out');
export const RESET_BEARING = marker('Reset bearing to north');
export const LAYER_SWITCHER_TOOLTIP = marker('Manage layers');
export const GEOJSON_SOURCE_TYPE = 'geojson';

/**
 * Mapgl Component allows to display and select geometrical data on a map.
 */

@Component({
  selector: 'arlas-mapgl',
  templateUrl: './mapgl.component.html',
  styleUrls: ['./mapgl.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapglComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  public map: mapboxgl.Map;
  public arlasMap: ArlasMapGL;
  public draw: ArlasDraw;
  public zoom: number;
  public legendOpen = true;
  // GeometryCollection ?
  private emptyData: FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  };
  private index: any;
  private isDrawingBbox = false;
  private canvas: HTMLElement;
  private box: HTMLElement;
  // points which xy coordinates are in screen referential
  private start: mapboxgl.Point;
  private current: mapboxgl.Point;


  private savedEditFeature = null;

  /**
   * @constant
   */
  public FINISH_DRAWING = marker('Double click to finish drawing');
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
  @Input() public mapLayers: MapLayers<AnyLayer>;

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
  @Input() public fitBoundsOffSet: [number, number] = [0, 0];
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
  @Input() public drawData: FeatureCollection<GeoJSON.Geometry> = Object.assign({}, this.emptyData);

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
  @Input() public offset: ArlasMapOffset =
    {north: 0, east: 0, south: 0, west: 0};

  /**
   * @Input : Angular
   * @description Padding value applied around a fitBounds to fully show the area targeted
   * */
  @Input() public fitBoundsPadding = 10;

  /**
   * @Input : Angular
   * @description Subject to which the component subscribes to redraw on the map the `data` of the given `source`.
   */
  @Input() public redrawSource = new Subject<{ source: string; data: Feature<GeoJSON.Geometry>[]; }>();

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
  @Input() public mapAttributionPosition: ControlPosition = 'bottom-right';

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
  @Output() public onFeatureClic = new EventEmitter<{
    features: Array<GeoJSON.Feature<GeoJSON.Geometry>>;
    point: [number, number];
  }>();
  /**
   * @Output : Angular
   * @description Emits the event of hovering feature.
   */
  @Output() public onFeatureOver = new EventEmitter<{
    features: Array<GeoJSON.Feature<GeoJSON.Geometry>>;
    point: [number, number];
  } | {}>();

  /**
   * @Output :  Angular
   * @description Emits the map extend on Tab close/refresh
   */
  @Output() public onMapClosed: EventEmitter<MapExtend> = new EventEmitter<MapExtend>();
  /**
   * @Output :  Angular
   * @description Emits the geojson of an aoi added to the map
   */
  @Output() public onAoiChanged: EventEmitter<FeatureCollection<GeoJSON.Geometry>> = new EventEmitter();
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

  // Circle
  private isDrawingCircle = false;
  // Strip
  private isDrawingStrip = false;

  // Polygon
  public nbPolygonVertice = 0;
  public polygonlabeldata: FeatureCollection<GeoJSON.Geometry> = Object.assign({}, this.emptyData);
  private isDrawingPolygon = false;
  private isInSimpleDrawMode = false;

  public visibilityStatus = new Map<string, boolean>();
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
   * Update the visibility status of the layer and emit that update
   * @param visualisation visualisation set name
   * @param l layer id
   * @param visible whether the layer is enabled and visible in the visualisation set
   */
  public emitLegendVisibility(visualisation: string, l: string, visible: boolean): void {
    // Copy the map so the pipe updates the values
    this.visibilityStatus = new Map(this.visibilityStatus);
    this.visibilityStatus.set(visualisation + ARLAS_VSET + l, visible);
    this.legendVisibiltyStatus.next(this.visibilityStatus);
  }

  /** Hides/shows all the layers inside the given visualisation name*/
  public emitVisualisations(visualisationName: string) {
    const layers = this.arlasMap.updateLayoutVisibility(visualisationName);
    this.visualisations.emit(layers);
    this.arlasMap.reorderLayers();
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
    this.arlasMap.addVisualisation(visualisation, layers, sources);
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
    this.arlasMap.drop(event);
  }

  /** puts the layers list in the new order after dropping */
  public dropLayer(event: CdkDragDrop<string[]>, visuName: string) {
    this.arlasMap.dropLayer(event, visuName);
  }

  /** Sets the layers order according to the order of `visualisationSetsConfig` list*/
  public reorderLayers() {
    // parses the visulisation list from bottom in order to put the fist ones first
    this.arlasMap.reorderLayers();
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
        if (this.arlasMap.getSource(this.POLYGON_LABEL_SOURCE) !== undefined) {
          (this.arlasMap.getSource(this.POLYGON_LABEL_SOURCE) as mapboxgl.GeoJSONSource).setData(this.polygonlabeldata);
        }
      }
      if (changes['boundsToFit'] !== undefined) {
        const newBoundsToFit = changes['boundsToFit'].currentValue;
        const canvas = this.arlasMap.getCanvasContainer();
        const positionInfo = canvas.getBoundingClientRect();
        const width = positionInfo.width;
        this.arlasMap.fitBounds(newBoundsToFit, {
          maxZoom: this.fitBoundsMaxZoom,
          offset: this.fitBoundsOffSet
        });
      }
      if (changes['featureToHightLight'] !== undefined
        && changes['featureToHightLight'].currentValue !== changes['featureToHightLight'].previousValue) {
        const featureToHightLight = changes['featureToHightLight'].currentValue;
        this.arlasMap.highlightFeature(featureToHightLight);
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
    if (typeof this.defaultBasemapStyle.styleFile === 'string') {
      this.defaultBasemapStyle.url = this.defaultBasemapStyle.styleFile;
    }
    this.basemapStyles.forEach(bm => {
      if (typeof bm.styleFile === 'string') {
        bm.url = (bm.styleFile as string);
      }
    });
    this.basemapService.setBasemaps(new ArlasBasemaps(this.defaultBasemapStyle, this.basemapStyles));
    this.basemapService.fetchSources$()
      .pipe(finalize(() => this.declareMap()))
      .subscribe();
  }

  /** If transformRequest' @Input was not set, set a default value : a function that maintains the same url */
  public initTransformRequest() {
    if (!this.transformRequest) {
      this.transformRequest = (url: string, resourceType: mapboxgl.ResourceType) => ({
        url,
      });
    }
  }

  public defaultOnZoom(e) {
    if (e.features[0].properties.cluster_id !== undefined) {
      // TODO: should check the this.index is set with good value
      const expansionZoom = this.index.getClusterExpansionZoom(e.features[0].properties.cluster_id);
      this.arlasMap.flyTo([e.lngLat.lng, e.lngLat.lat], expansionZoom);
    } else {
      const zoom = this.arlasMap.getZoom();
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
      this.arlasMap.flyTo([e.lngLat.lng, e.lngLat.lat], newZoom);
    }
  }

  private queryRender(e) {
    const features = this.arlasMap.queryRenderedFeatures(e.point);
    const hasCrossOrDrawLayer = (!!features && !!features.find(f => f.layer.id.startsWith(CROSS_LAYER_PREFIX)));
    if (!this.isDrawingBbox && !this.isDrawingPolygon && !this.isDrawingCircle && !this.isInSimpleDrawMode && !hasCrossOrDrawLayer) {
      this.onFeatureClic.next({features: e.features, point: [e.lngLat.lng, e.lngLat.lat]});
    }
  }

  public declareMap() {
    this.initTransformRequest();

    const drawPolygonLayers = [
      'gl-draw-polygon-stroke-inactive',
      'gl-draw-polygon-stroke-active',
      'gl-draw-polygon-stroke-static'
    ].map(layer => ['.cold', '.hot']
      .map(id => layer.concat(id)))
      .reduce((p, ac) => ac.concat(p), []);

    const config: ArlasMapGlConfig = {
      displayCurrentCoordinates: this.displayCurrentCoordinates,
      fitBoundsPadding:  this.fitBoundsPadding,
      margePanForLoad:  this.margePanForLoad,
      margePanForTest: this.margePanForTest,
      offset: this.offset,
      wrapLatLng: this.wrapLatLng,
      mapLayers: this.mapLayers,
      dataSources: this.dataSources,
      icons: this.icons,
      maxWidthScale: this.maxWidthScale,
      mapSources: this.mapSources,
      unitScale: this.unitScale,
      mapLayersEventBind: {
        zoomOnClick: [{event: 'click', fn: this.defaultOnZoom}],
        onHover: [
          {
            event: 'mousemove',
            fn: (e) => {
              this.onFeatureOver.next({features: e.features, point: [e.lngLat.lng, e.lngLat.lat]});
            }
          },
          {
            event: 'mouseleave',
            fn: (e) => {
              this.onFeatureOver.next({});
            }
          }
        ],
        emitOnClick: [
          {
            event: 'click',
            fn: this.queryRender
          }],
      },
      customEventBind: [
        {
          layers: drawPolygonLayers,
          mapEventBinds:
            [{
              event: 'mousemove',
              fn: (e) => {
                this.arlasMap.setCursorStyle('pointer');
              }
            }
            ],
        },
        {
          layers: drawPolygonLayers,
          mapEventBinds: [
            {
              event: 'mouseleave',
              fn: (e) => {
                this.arlasMap.setCursorStyle('');
              }
            }
          ]
        },
      ],
      mapProviderOptions: {
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
        pitchWithRotate: false,
        transformRequest: this.transformRequest,
        attributionControl: false,
      },
      controls: {
        mapAttribution: {
          enable: true,
          position: this.mapAttributionPosition
        },
        scale: {
          enable: this.displayScale
        },
        navigationControl: {
          enable: true
        },
        pitchToggle: {
          enable: true,
          config: {bearing: -20, pitch: 70, minpitchzoom: 11}
        }
      }
    };
    console.log('declare');
    this.arlasMap = new ArlasMapGL(config);
    console.log(this.arlasMap);
    this.map = this.arlasMap.getMap();

    fromEvent(window, 'beforeunload').subscribe(() => {
      this.onMapClosed.next(this.arlasMap.getMapExtend());
    });

    this.finishDrawTooltip = document.getElementById('polygon-finish-draw-tooltip');

    const drawStyles = styles.default;
    const drawOptions = {
      ...this.drawOption,
      ...{
        styles: drawStyles,
        modes: {
          static: StaticMode,
          limit_vertex: limitVertexDirectSelectMode,
          draw_polygon: validGeomDrawPolygonMode,
          draw_circle: circleMode,
          draw_radius_circle: radiusCircleMode,
          draw_strip: stripMode,
          direct_strip: stripDirectSelectMode,
          direct_select: directModeOverride,
          simple_select: simpleSelectModeOverride
        }
      }
    };
    this.draw  = new ArlasDraw(drawOptions, this.drawButtonEnabled, this.arlasMap.getMap());
    this.draw.setMode('DRAW_CIRCLE', 'draw_circle');
    this.draw.setMode('DRAW_RADIUS_CIRCLE', 'draw_radius_circle');
    this.draw.setMode('DRAW_STRIP', 'draw_strip');
    this.draw.setMode('DIRECT_STRIP', 'direct_strip');

    // TODO : to have to add event override
    const drawControlConfig: DrawControlsOption = {
      draw: {control: this.draw.drawProvider},
      addGeoBox: {
        enable: true,
        overrideEvent:
          {
            event: 'click',
            fn: this.addGeoBox
          }
      },
      removeAois: {
        enable: true,
        overrideEvent: {event: 'click', fn: this.removeAois}
      }
    };
    this.arlasMap.initDrawControls(drawControlConfig);
    this.drawService.setMapboxDraw(this.draw);
    /**
     *  The other on load initialisation releated with the map are in
     *  Arlasapgl in initOnLoad method
     *  the code below can be executed in as the method executed in
     *  this part do not need to be executed in specific order
     *
     *  !! If you see a better approche let me know.
     */
    this.arlasMap.onLoad(() => {
      // TODO: should change the
      this.basemapService.declareProtomapProtocol(this.arlasMap.getMap());
      this.basemapService.addProtomapBasemap(this.arlasMap.getMap());
      this.draw.changeMode('static');

      if (this.mapLayers !== null) {
        this.visibilityUpdater.subscribe(visibilityStatus => {
          this.arlasMap.updateVisibility(visibilityStatus);
        });
      }

      this.canvas = this.arlasMap.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);
      this.draw.on('draw.create', (e) => {
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAllFeatures().filter(fc =>
              this.drawService.isValidPolygon(fc) ||
              this.drawService.isValidCircle(fc)
            ).map(f => cleanCoords(f))
          });
      });

      this.draw.on('draw.update', (e) => {
        if (e) {
          const features = e.features;
          if (features && features.length > 0) {
            this.savedEditFeature = Object.assign({}, features[0]);
            this.savedEditFeature.coordinates = [[]];
            features[0].geometry.coordinates[0].forEach(f => this.savedEditFeature.coordinates[0].push(f));
          }
        }
      });
      this.draw.on('draw.delete', (e) => {
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAllFeatures().filter(fc =>
              this.drawService.isPolygon(fc) ||
              this.drawService.isCircle(fc)
            ).map(f => cleanCoords(f))
          });
      });

      const mouseMoveForDraw = (e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        this.finishDrawTooltip.style.top = (y + 20) + 'px';
        this.finishDrawTooltip.style.left = (x + 20) + 'px';
      };

      this.draw.onDrawOnClick( (e) => {
        if (this.drawClickCounter === 0) {
          window.addEventListener('mousemove', mouseMoveForDraw);
        }
        this.drawClickCounter++;
      });
      this.draw.onDrawOnStart( (e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.arlasMap.setCursorStyle('');
      });
      this.draw.onDrawOnStop((e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.arlasMap.setCursorStyle('');
      });

      this.draw.onDrawInvalidGeometry( (e) => {
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
        this.arlasMap.setCursorStyle('');
      });

      this.draw.onDrawEditSaveInitialFeature( (edition) => {
        this.savedEditFeature = Object.assign({}, edition.feature);
        this.savedEditFeature.coordinates = [[]];
        edition.feature.coordinates[0].forEach(c => this.savedEditFeature.coordinates[0].push(c));
      });

      this.draw.onDrawSelectionchange( (e) => {
        this.drawSelectionChanged = true;
        if (e.features.length > 0) {
          this.isDrawSelected = true;
        } else {
          this.savedEditFeature = null;
          this.isDrawSelected = false;
          this.onAoiChanged.next(
            {
              'type': 'FeatureCollection',
              'features': this.draw.getAllFeatures().filter(fc =>
                this.drawService.isValidPolygon(fc) ||
                this.drawService.isValidCircle(fc)
              ).map(f => cleanCoords(f))
            });
          this.isDrawingBbox = false;
          this.isDrawingPolygon = false;
          this.isDrawingCircle = false;
          this.isDrawingStrip = false;
          this.isInSimpleDrawMode = false;
          this.draw.changeMode('static');
          this.arlasMap.setCursorStyle('');
        }
      });
      this.draw.onDrawModeChange( (e) => {
        this.isDrawingPolygon = e.mode === this.draw.getMode('DRAW_POLYGON');
        this.isDrawingStrip = e.mode === this.draw.getMode('DIRECT_STRIP');
        this.isDrawingCircle = e.mode === this.draw.getMode('DRAW_CIRCLE') || e.mode === this.draw.getMode('DRAW_RADIUS_CIRCLE');
        if (this.isDrawingPolygon || this.isDrawingCircle || this.isDrawingStrip || e.mode === 'static') {
          this.isInSimpleDrawMode = false;
        }
        if (e.mode === 'simple_select') {
          this.isInSimpleDrawMode = true;
        } else if (e.mode === 'static') {
          this.arlasMap.setCursorStyle('');
        } else if (e.mode === 'direct_select') {
          const selectedFeatures = this.draw.getSelectedFeatures();
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
                selectedCoordPaths: (selectedFeatures[0] as Feature<Geometry>).geometry.coordinates
              });
              this.isInSimpleDrawMode = false;
            } else if (this.drawPolygonVerticesLimit && selectedFeatures[0].properties.meta === 'strip') {
              this.draw.changeMode('direct_strip', {
                featureId: selectedIds[0],
                maxLength: selectedFeatures[0].properties.maxLength,
                halfSwath: selectedFeatures[0].properties.halfSwath,
              });
              this.isInSimpleDrawMode = false;
            }
          } else {
            this.isInSimpleDrawMode = false;
            this.arlasMap.setCursorStyle('');
          }
        }
      });

      this.arlasMap.on('click', (e) => {
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
          const features = this.arlasMap.queryRenderedFeatures(e.point);
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
                  maxLength: candidatesProperties.user_maxLength,
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

    this.arlasMap.onMoveEnd().subscribe((moveResult => {
      this.onMove.next(moveResult);
    }));

    // Mouse events
    this.arlasMap.on('mousedown', (e: mapboxgl.MapMouseEvent) => {
      this.drawService.startBboxDrawing();
    });
    this.arlasMap.on('mouseup', (e: mapboxgl.MapMouseEvent) => {
      this.drawService.stopBboxDrawing();
    });

    this.arlasMap.on('mousemove', (e: mapboxgl.MapMouseEvent) => {
      const lngLat = e.lngLat;
      if (this.isDrawingBbox || this.isDrawingPolygon) {
        this.arlasMap.setCursorStyle('crosshair');
        this.arlasMap.movelngLat = lngLat;
      }
      if (this.drawService.bboxEditionState.isDrawing) {
        const startlng: number = this.arlasMap.startlngLat.lng;
        const endlng: number = this.arlasMap.movelngLat.lng;
        const startlat: number = this.arlasMap.startlngLat.lat;
        const endlat: number = this.arlasMap.movelngLat.lat;
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
        this.arlasMap.redrawSource(sd.source, sd.data);
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
    this.arlasMap.setCursorStyle('crosshair');
    this.drawService.enableBboxEdition();
    this.isDrawingBbox = true;
  }

  /**
   * @description Removes all the aois if none of them is selected. Otherwise it removes the selected one only
   */
  public removeAois() {
    this.arlasMap.setCursorStyle('');
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
      polygon = this.latLngToWKT(this.draw.getAll().features.filter(f => this.drawService.isPolygon(f) ||
        this.drawService.isCircle(f)).map(f => cleanCoords(f)));
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getAll().features.filter(f => this.drawService.isPolygon(f) ||
          this.drawService.isCircle(f)).map(f => cleanCoords(f))
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
      polygon = this.latLngToWKT(this.draw.getSelected().features.filter(f => this.drawService.isPolygon(f) ||
        this.drawService.isCircle(f)));
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getSelected().features.filter(f => this.drawService.isPolygon(f) ||
          this.drawService.isCircle(f))
      };
    }
    return polygon;
  }

  public switchToDrawMode(mode?: string, option?: any) {
    const selectedMode = mode ?? this.draw.getMode('DRAW_POLYGON');
    this.isDrawingCircle = selectedMode === this.draw.getMode('DRAW_CIRCLE') || selectedMode === this.draw.getMode('DRAW_RADIUS_CIRCLE');
    this.isDrawingPolygon = selectedMode === this.draw.getMode('DRAW_POLYGON');
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
    this.onAoiChanged.next(this.draw.getAll() as FeatureCollection<GeoJSON.Geometry>);
  }

  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isDrawingBbox) {
      this.arlasMap.setCursorStyle('');
      this.isDrawingBbox = false;
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.arlasMap.setCursorStyle('');
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
      this.arlasMap.enableDragPan();
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

    if(!!this.arlasMap){
      this.arlasMap.unsubscribeEvents();
    }
  }

  public selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string) {
    this.arlasMap.selectFeaturesByCollection(features, collection);
  }

  public hideBasemapSwitcher() {
    this.showBasemapsList = false;
  }

  /**
   * Wrapper method to fit the map to the given bounds with enough padding to properly visualize the area
   */
  public paddedFitBounds(bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) {
    this.arlasMap.paddedFitBounds(bounds, options);
  }

  public moveToCoordinates(lngLat: [number, number]) {
    this.arlasMap.setCenter(lngLat);
  }

  // TODO: put into utils class.
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

  private highlightFeature(featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; }) {
    this.arlasMap.highlightFeature(featureToHightLight);
  }

  private selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    this.arlasMap.selectFeatures(elementToSelect);
  }

  private mousedown = (e) => {
    // Continue the rest of the function if we add a geobox.
    if (!this.isDrawingBbox) {
      return;
    }
    // Disable default drag zooming when we add a geobox.
    this.arlasMap.disableDragPan();
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
    this.arlasMap.setCursorStyle('');
    this.arlasMap.enableDragPan();
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
      const startlng: number = this.arlasMap.startlngLat.lng;
      const endlng: number = this.arlasMap.endlngLat.lng;
      const startlat: number = this.arlasMap.startlngLat.lat;
      const endlat: number = this.arlasMap.endlngLat.lat;
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
    const polygonGeojson: Feature<GeoJSON.Geometry> = {
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
    geoboxdata.features.push(polygonGeojson);
    /** This allows to keep the drawn box on the map. It will be overriden in ngOnChanges `changes['drawData']` */
    this.drawService.addFeatures(geoboxdata, /** deleteOld */ true);
    this.onAoiChanged.next(geoboxdata);
    this.isDrawingBbox = false;
    this.drawService.disableBboxEdition();
    this.drawService.endDimensionsEmission();
  }
}

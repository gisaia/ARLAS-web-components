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

import { FeatureCollection } from '@turf/helpers';
import { ARLAS_ID, ExternalEvent, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from './model/layers';
import { fromEvent, map, Observable, Subject, Subscription } from 'rxjs';

import { debounceTime } from 'rxjs/operators';
import { ArlasMapSource } from './model/sources';
import { ControlPosition, ControlsOption, DrawControlsOption, IconConfig } from './model/controls';
import { VisualisationSetConfig } from './model/visualisationsets';
import { MapInterface } from './interface/map.interface';
import { MapExtent } from './model/extent';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { LngLat, OnMoveResult } from './model/map';
import { MapLayerMouseEvent } from './model/events';



export interface ElementIdentifier {
  idFieldName: string;
  idValue: string;
}

export interface MapEventBinds<T> {
  event: T;
  fn: (e?, map?: AbstractArlasMapGL) => void;
}

export interface BindLayerToEvent<T> {
  layers: string[];
  mapEventBinds: MapEventBinds<T>[];
}


/** Conf */
export interface MapConfig<T> {
  displayCurrentCoordinates: boolean;
  fitBoundsPadding: number;
  margePanForLoad: number;
  margePanForTest: number;
  wrapLatLng: boolean;
  offset: ArlasMapOffset;
  mapLayers: MapLayers<any>;
  mapLayersEventBind: {
    onHover: MapEventBinds<any>[];
    emitOnClick: MapEventBinds<any>[];
    zoomOnClick: MapEventBinds<any>[];
  };
  customEventBind: (map: AbstractArlasMapGL) => BindLayerToEvent<any>[];
  mapProviderOptions?: T;
  maxWidthScale?: number;
  unitScale?: string;
  controls?: ControlsOption;
}

export interface ArlasMapOffset {
  north: number;
  east: number;
  south: number;
  west: number;
}

export const GEOJSON_SOURCE_TYPE = 'geojson';

export const CROSS_LAYER_PREFIX = 'arlas_cross';
export const ZOOM_IN = marker('Zoom in');
export const ZOOM_OUT = marker('Zoom out');
export const RESET_BEARING = marker('Reset bearing to north');
export const LAYER_SWITCHER_TOOLTIP = marker('Manage layers');

/**
 *  The aim of this class is to handle all core interaction we have
 *  with a map provider. And also to handle all new behaviour
 *  we create from this provider.
 *
 * The aim is also to separate the alras map from the angular framework.
 * The advantage is that in arlas-wui we can use an instance of this class (or not) without worrying about the library used
 *
 * it will be instantiated in mapgl and will be responsible for initializing the map and all map behavior.
 *
 * Drawing behavior may be handled by another class.
 *
 * improvement (open to discussion) :
 *  - wrap of provider methode could be implemented in another class in middle of
 *  abstract class.
 */
export abstract class AbstractArlasMapGL implements MapInterface {
  /**
   *  props and methods with unknown type will be specific to the map provider
   *  we used.
   *  ex: endlnglat will have a type Maplibre.Pointlike/ Mapbox.Point
   */

  private eventEmitter: Subject<MapLayerMouseEvent> = new Subject();
  public eventEmitter$ = this.eventEmitter.asObservable();
  public abstract startlngLat: LngLat;
  public abstract endlngLat: LngLat;
  public abstract movelngLat: LngLat;
  protected _offset: ArlasMapOffset;
  protected _margePanForLoad: number;
  protected _margePanForTest: number;
  protected _fitBoundsPadding: number;
  protected _displayCurrentCoordinates: boolean;
  protected _wrapLatLng: boolean;
  // @Override
  protected _mapLayers: MapLayers<any>; // todo: find common type
  protected _controls: ControlsOption;
  public visualisationSetsConfig: Array<VisualisationSetConfig>;
  protected _icons: Array<IconConfig>;
  public mapSources: Array<ArlasMapSource<any>>; // todo: find common type
  protected _maxWidthScale?: number;
  protected _unitScale?: string;
  public abstract layersMap: Map<string, any>; // todo: find common type
  public firstDrawLayer: string;
  protected _emptyData: FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  };
  public polygonlabeldata = Object.assign({}, this._emptyData);
  public visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  } = {
      visualisations: new Map(),
      status: new Map()
    };
  public currentLat: string;
  public currentLng: string;
  public readonly POLYGON_LABEL_SOURCE = 'polygon_label';
  protected ICONS_BASE_PATH = 'assets/icons/';

  protected _north: number;
  protected _east: number;
  protected _west: number;
  protected _south: number;
  public zoom: number;
  protected _zoomStart: number;

  protected _dragStartX: number;
  protected _dragStartY: number;

  protected _dragEndX: number;
  protected _dragEndY: number;

  protected _xMoveRatio: number;
  protected _yMoveRatio: number;

  protected _moveEnd$: Observable<any>;
  protected _zoomStart$: Observable<any>;
  protected _dragStart$: Observable<any>;
  protected _dragEnd$: Observable<any>;

  protected _eventSubscription: Subscription[] = [];

  protected evented = new EventTarget();

  protected constructor(protected config: MapConfig<any>) {
    this.config = config;
    this._offset = config.offset;
    this._margePanForLoad = config.margePanForLoad;
    this._margePanForTest = config.margePanForTest;
    this._displayCurrentCoordinates = config.displayCurrentCoordinates ?? false;
    this._wrapLatLng = config.wrapLatLng ?? true;
    this._mapLayers = config.mapLayers;
    this._controls = config.controls;
    this._fitBoundsPadding = config.fitBoundsPadding ?? 10;
    this._maxWidthScale = config.maxWidthScale;
    this._unitScale = config.unitScale;

    this.init(config);
  }

  public setMinZoom(minZoom?: number): this {
    throw new Error('Method not implemented.');
  }

  public setMaxZoom(maxZoom?: number): this {
    throw new Error('Method not implemented.');
  }
  public project(lnglat: unknown): unknown {
    throw new Error('Method not implemented.');
  }
  public unproject(point: unknown): unknown {
    throw new Error('Method not implemented.');
  }
  public queryRenderedFeatures(pointOrBox?: unknown, options?: { layers?: string[]; filter?: any[]; }): any[] {
    throw new Error('Method not implemented.');
  }
  public setFilter(layer: string, filter?: boolean | any[], options?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public getLight(): unknown {
    throw new Error('Method not implemented.');
  }
  public setFeatureState(feature: unknown, state: { [key: string]: any; }): void {
    throw new Error('Method not implemented.');
  }
  public getFeatureState(feature: unknown): { [key: string]: any; } {
    throw new Error('Method not implemented.');
  }
  public removeFeatureState(target: unknown, key?: string): void {
    throw new Error('Method not implemented.');
  }
  public getContainer(): HTMLElement {
    throw new Error('Method not implemented.');
  }
  public getCanvasContainer(): HTMLElement {
    throw new Error('Method not implemented.');
  }
  public getCanvas(): HTMLCanvasElement {
    throw new Error('Method not implemented.');
  }
  public getCenter(): unknown {
    throw new Error('Method not implemented.');
  }
  public setCenter(center: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public panTo(lnglat: unknown, options?: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public getZoom(): number {
    throw new Error('Method not implemented.');
  }
  public setZoom(zoom: number, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public getBearing(): number {
    throw new Error('Method not implemented.');
  }
  public setBearing(bearing: number, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public rotateTo(bearing: number, options?: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public setPitch(pitch: number, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public cameraForBounds(bounds: unknown, options?: unknown): unknown {
    throw new Error('Method not implemented.');
  }
  public fitBounds(bounds: unknown, options?: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public hasImage(id: string): boolean {
    throw new Error('Method not implemented.');
  }

  public on<T extends never>(type: T, layer: string, listener: (ev: unknown) => void): this;
  public on<T extends never>(type: T, listener: (ev: unknown) => void): this;
  public on(type: string, listener: (ev: any) => void): this;
  public on(type: unknown, layer: unknown, listener?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public once<T extends never>(type: T, layer: string, listener: (ev: unknown) => void): this;
  public once<T extends never>(type: T, listener: (ev: unknown) => void): this;
  public once(type: string, listener: (ev: any) => void): this;
  public once(type: unknown, layer: unknown, listener?: unknown): this {
    throw new Error('Method not implemented.');
  }

  protected init(config: MapConfig<any>): void {
    try {
      this._initMapProvider(config);
      this._initControls();
      this._initOnLoad();
      this._initMapMoveEvents();
    } catch (e) {
      console.log(e);
    }
  }

  protected _initOnLoad() {
    this.onLoad(() => {
      this.evented.dispatchEvent(new Event('beforeOnLoadInit'));
      console.log('on load call');
      this._updateBounds();
      this._updateZoom();
      this.firstDrawLayer = this.getColdOrHotLayers()[0];
      this._initMapLayers(this);
      this._bindCustomEvent(this);
      // Fit bounds on current bounds to emit init position in moveend bus
      this.getMapProvider().fitBounds(this.getBounds());
      this._initVisualisationSet();
    });
  }

  onEvent(e) {
    this.eventEmitter.next(e);
  }

  onCustomEvent(event: string, loadFn: () => void) {
    this.evented.addEventListener(event, loadFn);
  }

  protected _initMapMoveEvents() {
    this._zoomStart$ = fromEvent(this.getMapProvider(), 'zoomstart')
      .pipe(debounceTime(750));

    this._dragStart$ = fromEvent(this.getMapProvider(), 'dragstart')
      .pipe(debounceTime(750));

    this._dragEnd$ = fromEvent(this.getMapProvider(), 'dragend')
      .pipe(debounceTime(750));

    this._moveEnd$ = fromEvent(this.getMapProvider(), 'moveend')
      .pipe(debounceTime(750));

    this._updateOnZoomStart();
    this._updateOnDragStart();
    this._updateOnDragEnd();
    this._updateOnMoveEnd();
  }

  protected _initMapLayers(map: AbstractArlasMapGL) {
    if (this._mapLayers) {
      console.log('init maplayers');
      this.setLayersMap(this._mapLayers as MapLayers<any>);
      this._addExternalEventLayers();

      this.bindLayersToMapEvent(
        map,
        this._mapLayers.events.zoomOnClick,
        this.config.mapLayersEventBind.zoomOnClick
      );

      this.bindLayersToMapEvent(
        map,
        this.config.mapLayers.events.emitOnClick,
        this.config.mapLayersEventBind.emitOnClick
      );

      this.bindLayersToMapEvent(
        map,
        this.config.mapLayers.events.onHover,
        this.config.mapLayersEventBind.onHover
      );
    }
  }

  protected _updateBounds(): void {
    console.log('_updateBounds call');

    this._west = this.getWestBounds();
    this._south = this.getSouthBounds();
    this._east = this.getEastBounds();
    this._north = this.getNorthBounds();
  }

  protected _updateZoom(e?: any): void {
    this.zoom = this.getZoom();
  }

  protected _updateCurrentLngLat(e: any): void {
    const lngLat = e.lngLat;
    if (this._displayCurrentCoordinates) {
      const displayedLngLat = this._wrapLatLng ? lngLat.wrap() : lngLat;
      this.currentLng = String(Math.round(displayedLngLat.lng * 100000) / 100000);
      this.currentLat = String(Math.round(displayedLngLat.lat * 100000) / 100000);
    }
  }

  protected _updateDragEnd(e: any): void {
    if (e.originalEvent) {
      this._dragEndX = e.originalEvent.clientX;
      this._dragEndY = e.originalEvent.clientY;
    }
  }

  protected _updateDragStart(e: any): void {
    this._dragStartX = e.originalEvent.clientX;
    this._dragStartY = e.originalEvent.clientY;
  }

  protected _updateEndLngLat(e: any): void {
    this.endlngLat = e.lngLat;
  }

  protected _updateMoveRatio(e: any): void {
    this._xMoveRatio = Math.abs(this._dragEndX - this._dragStartX) / e.target._canvas.clientWidth;
    this._yMoveRatio = Math.abs(this._dragEndY - this._dragStartY) / e.target._canvas.clientHeight;
  }

  protected _updateStartLngLat(e: any): void {
    this.startlngLat = e.lngLat;
  }


  protected _updateZoomStart(): void {
    this._zoomStart = this.getZoom();
  }

  protected _updateOnZoomStart() {
    const sub = this._zoomStart$.subscribe(_ => this._updateZoomStart());
    this._eventSubscription.push(sub);
  }

  protected _updateOnDragStart() {
    const sub = this._dragStart$.subscribe(e => this._updateDragStart(e));
    this._eventSubscription.push(sub);
  }

  protected _updateOnDragEnd() {
    const sub = this._dragEnd$
      .subscribe(e => {
        this._updateDragEnd(e);
        this._updateMoveRatio(e);
      });
    this._eventSubscription.push(sub);
  }

  protected _updateOnMoveEnd() {
    const sub = this._moveEnd$
      .subscribe(_ => {
        this._updateBounds();
        this._updateZoom();
      });
    this._eventSubscription.push(sub);
  }

  protected _bindCustomEvent(map: AbstractArlasMapGL) {
    if (this.config.customEventBind) {
      console.log('bind custom event');
      this.config.customEventBind(map).forEach(element =>
        this.bindLayersToMapEvent(map, element.layers, element.mapEventBinds)
      );
    }
  }

  protected _initVisualisationSet() {
    if (this.visualisationSetsConfig) {
      console.log('_initVisualisationSet');
      this.visualisationSetsConfig.forEach(visu => {
        this.visualisationsSets.visualisations.set(visu.name, new Set(visu.layers));
        this.visualisationsSets.status.set(visu.name, visu.enabled);
      });
    }
  }

  public onMoveEnd(cb?: () => void) {
    return this._moveEnd$
      .pipe(map(_ => {
        this._updateBounds();
        this._updateZoom();
        if (cb) {
          cb();
        }
        return this._getMoveEnd();
      }));
  }

  protected abstract _initMapProvider(BaseMapGlConfig): void;
  protected abstract _initControls(): void;
  protected abstract _getMoveEnd(): OnMoveResult;

  public abstract initDrawControls(config: DrawControlsOption): void;

  public abstract bindLayersToMapEvent(map: AbstractArlasMapGL, layers: string[] | Set<string>, binds: MapEventBinds<keyof any>[]): void;
  public abstract calcOffsetPoint(): any;
  public abstract redrawSource(id: string, data): void;
  public abstract getColdOrHotLayers();
  public abstract addVisualisation(visualisation: VisualisationSetConfig, layers: Array<any>, sources: Array<ArlasMapSource<any>>): void;
  public abstract paddedFitBounds(bounds: any, options?: any);
  public abstract geometryToBound(geom: any, paddingPercentage?: number): unknown;
  public abstract enableDragPan(): void;
  public abstract disableDragPan(): void;
  public abstract getWestBounds(): any;
  public abstract getNorthBounds(): any;
  public abstract getNorthEastBounds(): any;
  public abstract getSouthBounds(): any;
  public abstract getSouthWestBounds(): any;
  public abstract getEastBounds(): any;
  public abstract setCursorStyle(cursor: string): void;
  public abstract getMapProvider(): any;
  public abstract getMapExtend(): MapExtent;
  public abstract onLoad(fn: () => void): void;

  public abstract getBounds(): unknown;
  public abstract resize(eventData?: unknown): this;
  public abstract getMaxBounds(): unknown;
  public abstract setMaxBounds(unknown?: unknown): this;
  public abstract paddedBounds(npad: number, spad: number, epad: number,
    wpad: number, map: any, SW, NE): LngLat[];

  public abstract getLayers(): any;
  public abstract addControl(control: any, position?: ControlPosition, eventOverride?: {
    event: string; fn: (e?) => void;
  });

  public abstract setLayersMap(mapLayers: MapLayers<any>, layers?: Array<any>);

  
  protected setStrokeLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer.type === 'fill') {
      const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
      const strokeLayer = this.layersMap.get(strokeId);
      if (!!strokeLayer) {
        this.getMapProvider().setLayoutProperty(strokeId, 'visibility', visibility);
      }
    }
  }

  protected setScrollableLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollbaleLayer = this.layersMap.get(scrollableId);
    if (!!scrollbaleLayer) {
      this.getMapProvider().setLayoutProperty(scrollableId, 'visibility', visibility);
    }
  }

  public addLayerInWritePlaceIfNotExist(layerId: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer !== undefined && layer.id === layerId) {
      /** Add the layer if it is not already added */
      if (this.getMapProvider().getLayer(layerId) === undefined) {
        if (this.firstDrawLayer && this.firstDrawLayer.length > 0) {
          /** draw layers must be on the top of the layers */
          this.getMapProvider().addLayer(layer, this.firstDrawLayer);
        } else {
          this.getMapProvider().addLayer(layer);
        }
      }
    } else {
      throw new Error('The layer `' + layerId + '` is not declared in `mapLayers.layers`');
    }
  }


  public updateLayoutVisibility(visualisationName: string) {
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
        this.disableLayoutVisibility(ll);
      });
    }
    this.visualisationsSets.status.set(visualisationName, visuStatus);
    const layers = new Set<string>();
    this.visualisationsSets.visualisations.forEach((ls, v) => {
      if (this.visualisationsSets.status.get(v)) {
        ls.forEach(l => {
          layers.add(l);
          this.enableLayoutVisibility(l);
        });
      }
    });
    return layers;
  }

  public updateVisibility(visibilityStatus: Map<string, boolean>) {
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
          this.disableLayoutVisibility(l);
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
            this.enableLayoutVisibility(l);
          }
        });
        if (!oneVisualisationEnabled && layerInVisualisations) {
          this.disableLayoutVisibility(l);
        }
      }
    });
  }

  

  public hasCrossOrDrawLayer(e: any): boolean {
    const features = this.queryRenderedFeatures(e.point);
    return (!!features && !!features.find(f => f && f.layer && f.layer.id && f.layer.id.startsWith(CROSS_LAYER_PREFIX)));
  }

  

  public disableLayoutVisibility(layer: string) {
    this.getMapProvider().setLayoutProperty(layer, 'visibility', 'none');
    this.setStrokeLayoutVisibility(layer, 'none');
    this.setScrollableLayoutVisibility(layer, 'none');
  }

  public enableLayoutVisibility(layer: string) {
    this.setLayoutProperty(layer, 'visibility', 'visible');
    this.setStrokeLayoutVisibility(layer, 'visible');
    this.setScrollableLayoutVisibility(layer, 'visible');
  }

  public setLayoutProperty(layer: string, name: string, value: any, options?: any) {
    this.getMapProvider().setLayoutProperty(layer, name, value, options);
    return this;
  }

  public findVisualisationSetLayer(visuName: string) {
    return this.visualisationSetsConfig.find(v => v.name === visuName).layers;
  }
  public setVisualisationSetLayers(visuName: string, layers: string[]) {
    const f = this.visualisationSetsConfig.find(v => v.name === visuName);
    if (f) {
      f.layers = layers;
    }
  }

  public unsubscribeEvents() {
    this._eventSubscription.forEach(s => s.unsubscribe());
  }

  public getMaxZoom(): number {
    return this.getMapProvider().getMaxZoom();
  }

  public getMinZoom(): number {
    return this.getMapProvider().getMinZoom();
  }

  public getPitch(): number {
    return this.getMapProvider().getPitch();
  }




}


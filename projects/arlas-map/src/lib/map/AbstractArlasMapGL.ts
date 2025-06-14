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

import { fromEvent, map, Observable, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ControlPosition, ControlsOption, DrawControlsOption } from './model/controls';
import { MapExtent } from './model/extent';
import { ArlasLngLat, ArlasLngLatBounds, OnMoveResult } from './model/map';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import bbox from '@turf/bbox';


/** Conf */
export interface MapConfig<T> {
  displayCurrentCoordinates: boolean;
  fitBoundsPadding: number;
  margePanForLoad: number;
  margePanForTest: number;
  wrapLatLng: boolean;
  offset: ArlasMapOffset;
  mapProviderOptions?: T;
  maxWidthScale?: number;
  unitScale?: string;
  controls?: ControlsOption;
}

export interface ArlasMapOption {
  container: string;
  style: any;
  center: [number, number];
  zoom: number;
  maxZoom: number;
  minZoom: number;
  renderWorldCopies: boolean;
  preserveDrawingBuffer: boolean;
  locale: {
    'NavigationControl.ZoomIn'?: string;
    'NavigationControl.ZoomOut'?: string;
    'NavigationControl.ResetBearing'?: string;
    'GlobeControl.Enable'?: string;
    'GlobeControl.Disable'?: string;
  };
  pitchWithRotate: boolean;
  transformRequest: unknown;
  attributionControl: boolean;
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
export const OPACITY_SUFFIX = '-opacity';
export const ENABLE_GLOBE = marker('Enable globe');
export const DISABLE_GLOBE = marker('Disable globe');
/**
 * The aim of this class is to handle all core interaction we have
 * with a map provider.
 * The aim is also to separate the Arlas map from the Angular framework.
 * It will be instantiated in the map.component and will be responsible for initializing the map and all map behavior.
 */
export abstract class AbstractArlasMapGL {
  /**
   *  props and methods with unknown type will be specific to the map provider
   *  we use.
   *  ex: endLngLat will have a type Maplibre.Pointlike/ Mapbox.Point
   */

  public abstract startLngLat: ArlasLngLat;
  public abstract endLngLat: ArlasLngLat;
  public abstract moveLngLat: ArlasLngLat;
  protected _offset: ArlasMapOffset;
  protected _margePanForLoad: number;
  protected _margePanForTest: number;
  protected _fitBoundsPadding: number;
  protected _displayCurrentCoordinates: boolean;
  protected _wrapLatLng: boolean;
  protected _controls: ControlsOption;
  protected _maxWidthScale?: number;
  protected _unitScale?: string;
  public currentLat: string;
  public currentLng: string;
  public readonly POLYGON_LABEL_SOURCE = 'polygon_label';

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
    this._controls = config.controls;
    this._fitBoundsPadding = config.fitBoundsPadding ?? 10;
    this._maxWidthScale = config.maxWidthScale;
    this._unitScale = config.unitScale;
    this.init(config);
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
      this._updateBounds();
      this._updateZoom();
      this.getMapProvider().fitBounds(this.getBounds());
    });
  }

  public onCustomEvent(event: string, loadFn: () => void) {
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

  protected _updateBounds(): void {
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
    this.endLngLat = e.lngLat;
  }

  protected _updateMoveRatio(e: any): void {
    this._xMoveRatio = Math.abs(this._dragEndX - this._dragStartX) / e.target._canvas.clientWidth;
    this._yMoveRatio = Math.abs(this._dragEndY - this._dragStartY) / e.target._canvas.clientHeight;
  }

  protected _updateStartLngLat(e: any): void {
    this.startLngLat = e.lngLat;
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

  public onMoveEnd(visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  }, cb?: () => void) {
    return this._moveEnd$
      .pipe(map(_ => {
        this._updateBounds();
        this._updateZoom();
        if (cb) {
          cb();
        }
        return this._getMoveEnd(visualisationsSets);
      }));
  }

  public setLayoutProperty(layer: string, name: string, value: any, options?: any) {
    this.getMapProvider().setLayoutProperty(layer, name, value, options);
    return this;
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

  protected abstract _initMapProvider(BaseMapGlConfig): void;
  protected abstract _initControls(): void;
  protected abstract _getMoveEnd(visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  }): OnMoveResult;

  public abstract addControl(control: any, position?: ControlPosition, eventOverride?: {
    event: string; fn: (e?) => void;
  });
  public abstract calcOffsetPoint(): any;
  public abstract disableDragPan(): void;
  public abstract enableDragPan(): void;
  public abstract fitBounds(bounds: ArlasLngLatBounds | number[], options?: unknown, unknown?: unknown): this;
  public abstract fitToPaddedBounds(bounds: ArlasLngLatBounds | number[]);
  public abstract getBounds(): unknown;
  public abstract getCanvasContainer(): HTMLElement;
  public abstract getEastBounds(): number;
  public abstract getMapExtend(): MapExtent;
  public abstract getMapProvider(): any;
  public abstract getMaxBounds(): unknown;
  public abstract getNorthBounds(): number;
  public abstract getNorthEastBounds(): ArlasLngLat;
  public abstract getSouthBounds(): number;
  public abstract getSouthWestBounds(): ArlasLngLat;
  public abstract getWestBounds(): number;
  public abstract getZoom(): number;
  public abstract initDrawControls(config: DrawControlsOption): void;
  public abstract on(type: string, listener: (ev: any) => void): this;
  public abstract onLoad(fn: () => void): void;
  public abstract onIdle(fn: () => void): void;
  public abstract queryRenderedFeatures(pointOrBox?: unknown, options?: { layers?: string[]; filter?: any[]; }): any[];
  public abstract resize(eventData?: unknown): this;
  public abstract setCenter(center: unknown, unknown?: unknown): this;
  public abstract setMaxBounds(unknown?: unknown): this;
  public abstract setFilter(layer: string, filter?: boolean | any[], options?: unknown): this;
  public abstract paddedBounds(npad: number, spad: number, epad: number,
    wpad: number, map: any, SW: ArlasLngLat, NE: ArlasLngLat): ArlasLngLat[];
  public abstract setLayerOpacity(layerId: string, layerType: string, opacityValue: any): this;
  /**
   * Returns the corresponding keyword for paint style based on the layer type
   * @param layerType Type of the layer
   */
  public abstract layerTypeToPaintKeyword(layerType: string): string;

  /** Gets bounds of the given geometry */
  public geometryToBounds(geometry: any, paddingPercentage?: number): ArlasLngLatBounds {
    const boundingBox: any = bbox(geometry);
    let west = boundingBox[0];
    let south = boundingBox[1];
    let east = boundingBox[2];
    let north = boundingBox[3];
    if (paddingPercentage !== undefined) {
      let width = east - west;
      let height = north - south;
      /** if there is one hit, then west=east ===> we consider a width of 0.05°*/
      if (width === 0) {
        width = 0.05;
      }
      /** if there is one hit, then north=south ===> we consider a height of 0.05°*/
      if (height === 0) {
        height = 0.05;
      }
      west = west - paddingPercentage * width;
      south = Math.max(-90, south - paddingPercentage * height);
      east = east + paddingPercentage * width;
      north = Math.min(90, north + paddingPercentage * height);
    }
    const bounds = new ArlasLngLatBounds(
      new ArlasLngLat(west, south),
      new ArlasLngLat(east, north)
    );
    return bounds;
  }

}


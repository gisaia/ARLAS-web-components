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

import { ArlasMapSource } from './mapSource';
import { FeatureCollection } from '@turf/helpers';
import { MapExtend } from '../mapgl.component.util';
import { ARLAS_ID, ExternalEvent, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from './mapLayers';
import { fromEvent, map, Observable, Subscription } from 'rxjs';
import { ElementIdentifier } from '../../results/utils/results.utils';

import { MapOverride } from './map.type';
import { debounceTime } from 'rxjs/operators';

export type ControlPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface IconConfig {
  path: string;
  recolorable?: boolean;
}

export interface ConfigControls {
  enable: boolean;
  position?: ControlPosition;
  config?: any;
  overrideEvent?: { event: any; fn: (e) => void; };
}
export interface PitchToggleConfigControls extends ConfigControls {
  enable: boolean;
  position?: ControlPosition;
  config: { bearing: number; pitch: number; minpitchzoom: number; };
  overrideEvent?: { event: any; fn: (e?) => void; };
}
export interface ControlsOption {
  mapAttribution?: ConfigControls;
  scale?: ConfigControls;
  pitchToggle?: PitchToggleConfigControls;
  navigationControl?: ConfigControls;
}

export interface DrawConfigControl extends ConfigControls {
  name?: string;
}

export interface DrawControlsOption {
  draw: { control: any; position?: ControlPosition; };
  addGeoBox: DrawConfigControl;
  removeAois: DrawConfigControl;
}

export interface MapEventBinds<T> {
  event: T;
  fn: (e?) => void;
}
export interface BindLayerToEvent<T> {
  layers: string[];
  mapEventBinds: MapEventBinds<T>[];
}

export interface BaseMapGlConfig<T> {
  displayCurrentCoordinates: boolean;
  fitBoundsPadding: number;
  margePanForLoad: number;
  margePanForTest: number;
  wrapLatLng: boolean;
  offset: ArlasMapOffset;
  icons: Array<IconConfig>;
  mapSources: Array<ArlasMapSource<any>>;
  mapLayers: MapLayers<any>;
  mapLayersEventBind: {
    onHover: MapEventBinds<any>[];
    emitOnClick: MapEventBinds<any>[];
    zoomOnClick: MapEventBinds<any>[];
  };
  customEventBind: BindLayerToEvent<any>[];
  mapProviderOptions?: T;
  maxWidthScale?: number;
  unitScale?: string;
  dataSources?: Set<string>;
  visualisationSetsConfig?: Array<VisualisationSetConfig>;
  controls?: ControlsOption;
}

export interface ArlasMapOffset {
  north: number;
  east: number;
  south: number;
  west: number;
}

export const GEOJSON_SOURCE_TYPE = 'geojson';

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

export abstract class AbstractArlasMapGL implements MapOverride {
  /**
   *  props and method with unknow type will be specific to the map provider
   *  we used.
   *  ex: endlnglat will have a type Maplibre.Pointlike/ Mapbox.Point
   */

  public abstract startlngLat: any; // todo: find common type
  public abstract endlngLat: any; // todo: find common type
  public abstract movelngLat: any; // todo: find common type
  protected _offset: ArlasMapOffset;
  protected _margePanForLoad: number;
  protected _margePanForTest: number;
  protected _fitBoundsPadding: number;
  protected _displayCurrentCoordinates: boolean;
  protected _wrapLatLng: boolean;
  // @Override
  protected _mapLayers: MapLayers<any>; // todo: find common type
  protected _controls: ControlsOption;
  protected _dataSource: Set<string>;
  public visualisationSetsConfig: Array<VisualisationSetConfig>;
  protected _icons: Array<IconConfig>;
  public mapSources: Array<ArlasMapSource<any>>; // todo: find common type
  protected _maxWidthScale?: number;
  protected _unitScale?: string;
  protected _dataSources?: Set<string>;
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
  protected readonly POLYGON_LABEL_SOURCE = 'polygon_label';
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

  protected constructor(protected config: BaseMapGlConfig<any>) {
    this.config = config;
    this._offset = config.offset;
    this._margePanForLoad = config.margePanForLoad;
    this._margePanForTest = config.margePanForTest;
    this._displayCurrentCoordinates = config.displayCurrentCoordinates ?? false;
    this._wrapLatLng = config.wrapLatLng ?? true;
    this._mapLayers = config.mapLayers;
    this._controls = config.controls;
    this._fitBoundsPadding = config.fitBoundsPadding ?? 10;
    this._dataSource = config.dataSources;
    this.visualisationSetsConfig = config.visualisationSetsConfig;
    this._icons = config.icons;
    this.mapSources = config.mapSources;
    this._maxWidthScale = config.maxWidthScale;
    this._unitScale = config.unitScale;
    this._dataSources = config.dataSources;

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
  public queryRenderedFeatures(pointOrBox?: unknown, options?: { layers?: string[]; filter?: any[]; }): unknown[] {
    throw new Error('Method not implemented.');
  }
  public setStyle(style: unknown, options?: { diff?: boolean; localIdeographFontFamily?: string; }): this {
    throw new Error('Method not implemented.');
  }
  public getStyle(): unknown {
    throw new Error('Method not implemented.');
  }
  public addSource(id: string, source: unknown): this {
    throw new Error('Method not implemented.');
  }
  public removeSource(id: string): this {
    throw new Error('Method not implemented.');
  }
  public getSource(id: string): unknown {
    throw new Error('Method not implemented.');
  }
  public addImage(name: string, image: HTMLImageElement
    | ArrayBufferView | ImageData | ImageBitmap | {
      width: number; height: number; data: Uint8Array
        | Uint8ClampedArray;
    }, options?: { pixelRatio?: number; sdf?: boolean; }): this {
    throw new Error('Method not implemented.');
  }
  public loadImage(url: string, callback: (error: any, image: any) => void): this {
    throw new Error('Method not implemented.');
  }
  public addLayer(layer: unknown, before?: string): this {
    throw new Error('Method not implemented.');
  }
  public moveLayer(id: string, beforeId?: string): this {
    throw new Error('Method not implemented.');
  }
  public removeLayer(id: string): this {
    throw new Error('Method not implemented.');
  }
  public getLayer(id: string): unknown {
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

  public removeImage(id: string): void {
    throw new Error('Method not implemented.');
  }

  public easeTo(options: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  public flyTo(options: unknown, unknown?: unknown): this {
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

  protected init(config: BaseMapGlConfig<any>): void {
    try {
      this._initMapProvider(config);
      this._initControls();
      this._initImages();
      this._initOnLoad();
      this._initMapMoveEvents();
    } catch (e) {
      console.log(e);
    }
  }

  protected _initOnLoad(options?: {
    beforeOnLoadOption?: () => void;
    afterOnLoadOptions?: () => void;
  }){
    this.onLoad(() => {
      options?.beforeOnLoadOption();
      this._updateBounds();
      this._updateZoom();
      this.firstDrawLayer = this.getColdOrHotLayers()[0];
      this._initLoadIcons();
      this._initSources();
      this._initMapLayers();
      this._bindCustomEvent();
      // Fit bounds on current bounds to emit init position in moveend bus
      this.getMapProvider().fitBounds(this.getBounds());
      this._initVisualisationSet();
      options?.afterOnLoadOptions();
    });
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

  protected _initMapLayers(){
    if(this._mapLayers){
      this.setLayersMap(this._mapLayers as MapLayers<any>);
      this.addVisualLayers();
      this._addExternalEventLayers();

      this.bindLayersToMapEvent(
        this._mapLayers.events.zoomOnClick,
        this.config.mapLayersEventBind.zoomOnClick
      );

      this.bindLayersToMapEvent(
        this.config.mapLayers.events.emitOnClick,
        this.config.mapLayersEventBind.emitOnClick
      );

      this.bindLayersToMapEvent(
        this.config.mapLayers.events.onHover,
        this.config.mapLayersEventBind.onHover
      );
    }
  }

  protected _initImages(){
    this._loadInternalImage('assets/rotate/01.png', 'rotate');
    this._loadInternalImage('assets/resize/01.png', 'resize');
  }

  protected _initLoadIcons(){
    if (this._icons) {
      this._icons.forEach(icon => {
        this._loadInternalImage(
          this.ICONS_BASE_PATH + icon.path,
          icon.path.split('.')[0],
          'The icon "' + this.ICONS_BASE_PATH + icon.path + '" is not found',
          { 'sdf': icon.recolorable }
        );
      });
    }
  }

  protected _initSources(): void {
    if(this._dataSources){
      this._dataSources.forEach(id => {
        this.addSource(id, {type: GEOJSON_SOURCE_TYPE, data:  Object.assign({}, this._emptyData) });
      });
    }

    this.addSource(this.POLYGON_LABEL_SOURCE, {
      'type': GEOJSON_SOURCE_TYPE,
      'data': this.polygonlabeldata
    });

    if(this.mapSources){
      this.addSourcesToMap(this.mapSources);
    }
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
    if(e.originalEvent){
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


  protected  _updateZoomStart(): void {
    this._zoomStart = this.getZoom();
  }

  protected _updateOnZoomStart(){
    const sub = this._zoomStart$.subscribe(_ => this._updateZoomStart());
    this._eventSubscription.push(sub);
  }

  protected _updateOnDragStart(){
    const sub = this._dragStart$.subscribe(e => this._updateDragStart(e));
    this._eventSubscription.push(sub);
  }

  protected _updateOnDragEnd(){
    const sub = this._dragEnd$
      .subscribe(e => {
        this._updateDragEnd(e);
        this._updateMoveRatio(e);
      });
    this._eventSubscription.push(sub);
  }

  protected _updateOnMoveEnd(){
    const sub = this._moveEnd$
      .subscribe(_ => {
        this._updateBounds();
        this._updateZoom();
      });
    this._eventSubscription.push(sub);
  }

  protected _bindCustomEvent(){
    if(this.config.customEventBind){
      this.config.customEventBind.forEach(element =>
        this.bindLayersToMapEvent(element.layers, element.mapEventBinds)
      );
    }
  }

  protected _initVisualisationSet(){
    if (this.visualisationSetsConfig) {
      this.visualisationSetsConfig.forEach(visu => {
        this.visualisationsSets.visualisations.set(visu.name, new Set(visu.layers));
        this.visualisationsSets.status.set(visu.name, visu.enabled);
      });
    }
  }

  protected _loadInternalImage(filePath: string, name: string, errorMessage?: string, opt?: any){
    this.loadImage(filePath, (error, image) => {
      if (error) {
        console.warn(errorMessage);
      } else {
        if(opt){
          this.addImage(name, image, opt);
        } else {
          this.addImage(name, image);
        }
      }
    });
  }

  protected addVisualLayers(): void {
    for (let i = this.visualisationSetsConfig.length - 1; i >= 0; i--) {
      const visualisation: VisualisationSetConfig = this.visualisationSetsConfig[i];
      if (!!visualisation.layers) {
        for (let j = visualisation.layers.length - 1; j >= 0; j--) {
          const l = visualisation.layers[j];
          const layer = this.layersMap.get(l);
          const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
          const scrollableLayer = this.layersMap.get(scrollableId);
          if (!!scrollableLayer) {
            this.addLayerInWritePlaceIfNotExist(scrollableId);
          }
          this.addLayerInWritePlaceIfNotExist(l);
          /** add stroke layer if the layer is a fill */
          if (layer.type === 'fill') {
            const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
            const strokeLayer = this.layersMap.get(strokeId);
            if (!!strokeLayer) {
              this.addLayerInWritePlaceIfNotExist(strokeId);
            }
          }
        }
      }
    }
    this.visualisationsSets.status.forEach((b, vs) => {
      if (!b) {
        this.visualisationsSets.visualisations.get(vs).forEach(l => {
          this.setLayoutProperty(l, 'visibility', 'none');
          this.setStrokeLayoutVisibility(l, 'none');
          this.setScrollableLayoutVisibility(l, 'none');
        });
      }
    });
    this.visualisationsSets.status.forEach((b, vs) => {
      if (b) {
        this.visualisationsSets.visualisations.get(vs).forEach(l => {
          this.setLayoutProperty(l, 'visibility', 'visible');
          this.setStrokeLayoutVisibility(l, 'visible');
          this.setScrollableLayoutVisibility(l, 'visible');
        });

      }
    });
    this.reorderLayers();
  }

  public onMoveEnd(cb?: () => void) {
    return this._moveEnd$
      .pipe(map(_ => {
        this._updateBounds();
        this._updateZoom();
        if(cb){
          cb();
        }
        return this._getMoveEnd();
      }));
  }

  public abstract bindLayersToMapEvent(layers: string[] | Set<string>, binds: MapEventBinds<keyof  any>[]):void;
  public abstract calcOffsetPoint(): any;
  protected abstract _initMapProvider(BaseMapGlConfig): void;
  protected abstract _initControls(): void;
  public abstract initDrawControls(config: DrawControlsOption): void;
  public abstract redrawSource(id: string, data): void;
  public abstract getColdOrHotLayers();
  public abstract addVisualisation(visualisation: VisualisationSetConfig, layers: Array<any>, sources: Array<ArlasMapSource<any>>): void;
  protected abstract _getMoveEnd():  OnMoveResult;
  public abstract paddedFitBounds(bounds: any, options?: any);
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
  public abstract getMapExtend(): MapExtend;
  public abstract onLoad(fn: () => void): void;

  public abstract getLayers(): any;
  public abstract addControl(control: any, position?: ControlPosition, eventOverride?: {
    event: string; fn: (e?) => void;
  });

  public abstract setLayersMap(mapLayers: MapLayers<any>, layers?: Array<any>);

  protected _addExternalEventLayers() {
    if (!!this._mapLayers.externalEventLayers) {
      this._mapLayers.layers
        .filter(layer => this._mapLayers.externalEventLayers.map(e => e.id).indexOf(layer.id) >= 0)
        .forEach(l => this.addLayerInWritePlaceIfNotExist(l.id));
    }
  }

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

  public addSourcesToMap(sources: Array<any>): void {
    // Add sources defined as input in mapSources;
    const mapSourcesMap = new Map<string, ArlasMapSource<any>>();
    if (sources) {
      sources.forEach(mapSource => {
        mapSourcesMap.set(mapSource.id, mapSource);
      });
      mapSourcesMap.forEach((mapSource, id) => {
        if (this.getMapProvider().getSource(id) === undefined && typeof (mapSource.source) !== 'string') {
          this.getMapProvider().addSource(id, mapSource.source);
        }
      });
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

  public highlightFeature(featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; }) {
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

  public selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string) {
    const ids: Array<number | string> = features.map(f => f.idValue);
    const numericalIds = ids.filter(id => !isNaN(+id)).map(id => +id);
    const visibilityFilter = ids.length > 0 ? ['in', ['get', features[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
    this.updateLayersVisibility((features.length > 0), visibilityFilter, ExternalEvent.select, collection);
  }

  public selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    if (elementToSelect) {
      const ids = elementToSelect.length > 0 ?
        elementToSelect.reduce((memo, element) => {
          memo.push(element.idValue);
          return memo;
        }, []) : [];
      const numericalIds = ids.filter(id => !isNaN(+id)).map(id => +id);
      const visibilityFilter = ids.length > 0 ? ['in', ['get', elementToSelect[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
      this.updateLayersVisibility((elementToSelect.length > 0), visibilityFilter, ExternalEvent.select);
    }
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


  public abstract getBounds(): unknown;
  public abstract resize(eventData?: unknown): this;
  public abstract getMaxBounds(): unknown;
  public abstract setMaxBounds(unknown?: unknown): this;
  public getMaxZoom(): number {
    return this.getMapProvider().getMaxZoom();
  }

  public getMinZoom(): number {
    return this.getMapProvider().getMinZoom();
  }

  public getPitch(): number {
    return this.getMapProvider().getPitch();
  }

  public abstract isLayerVisible(layer: any): boolean;


  public updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
    collection?: string): void {
    if (this._mapLayers && this._mapLayers.externalEventLayers) {
      this._mapLayers.externalEventLayers.filter(layer => layer.on === visibilityEvent).forEach(layer => {
        if (this.getLayer(layer.id) !== undefined) {
          let originalLayerIsVisible = false;
          const fullLayer = this.layersMap.get(layer.id);
          const isCollectionCompatible = (!collection || (!!collection && (fullLayer.source as string).includes(collection)));
          if (isCollectionCompatible) {
            const originalLayerId = layer.id.replace('arlas-' + visibilityEvent.toString() + '-', '');
            const originalLayer = this.getMapProvider().getStyle().layers.find(l => l.id === originalLayerId);
            if (!!originalLayer) {
              originalLayerIsVisible = this.isLayerVisible(originalLayer);
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
              layerFilter.push(visibilityFilter);
              this.setFilter(layer.id, layerFilter);
              this.setLayoutProperty(layer.id, 'visibility', 'visible');
            } else {
              this.setFilter(layer.id, (layer as any).filter);
              this.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          }
        }
      });
    }
  }

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
          if (!!scrollableLayer && !!this.getLayer(scrollableId)) {
            this.moveLayer(scrollableId);
          }
          if (!!this.getLayer(l)) {
            this.moveLayer(l);
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this.layersMap.get(strokeId);
              if (!!strokeLayer && !!this.getLayer(strokeId)) {
                this.moveLayer(strokeId);
              }
              if (!!strokeLayer && !!strokeLayer.id) {
                const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + strokeLayer.id;
                const selectLayer = this.layersMap.get(selectId);
                if (!!selectLayer && !!this.getLayer(selectId)) {
                  this.moveLayer(selectId);
                }
                const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + strokeLayer.id;
                const hoverLayer = this.layersMap.get(hoverId);
                if (!!hoverLayer && !!this.getLayer(hoverId)) {
                  this.moveLayer(hoverId);
                }
              }
            }
          }
          const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + layer.id;
          const selectLayer = this.layersMap.get(selectId);
          if (!!selectLayer && !!this.getLayer(selectId)) {
            this.moveLayer(selectId);
          }
          const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + layer.id;
          const hoverLayer = this.layersMap.get(hoverId);
          if (!!hoverLayer && !!this.getLayer(hoverId)) {
            this.moveLayer(hoverId);
          }
        }
      }
    }

    this.getColdOrHotLayers().forEach(id => this.moveLayer(id));
  }



}


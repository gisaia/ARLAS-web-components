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

import { MapSource } from './mapSource';
import { FeatureCollection } from '@turf/helpers';
import { MapExtend } from '../mapgl.component.util';
import { ControlButton } from '../mapgl.component.control';
import { ARLAS_ID, ExternalEvent, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from './mapLayers';
import { Observable, Subscription } from 'rxjs';
import { ElementIdentifier } from '../../results/utils/results.utils';

import { MapOverride } from './map.type';

export type ControlPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface IconConfig {
  path: string;
  recolorable?: boolean;
}

export interface ConfigControls {
  enable: boolean;
  position?: ControlPosition ;
  config?: any;
  overrideEvent?: {event: any; fn: (e) => void;};
}
export interface PitchToggleConfigControls extends ConfigControls {
  enable: boolean;
  position?: ControlPosition;
  config: {bearing: number; pitch: number; minpitchzoom: number;};
  overrideEvent?: {event: any; fn: (e?) => void;};
}
export interface ControlsOption {
  mapAttribution?:  ConfigControls;
  scale?: ConfigControls;
  pitchToggle?: PitchToggleConfigControls;
  navigationControl?:  ConfigControls;
}

export interface DrawConfigControl extends ConfigControls {
  name?: string;
}

export interface DrawControlsOption {
  draw: {control: any; position?: ControlPosition;};
  addGeoBox: DrawConfigControl;
  removeAois: DrawConfigControl;
}

export interface MapEventBinds<T>  {
   event: T;
   fn: (e?) => void;
}
export interface BindLayerToEvent<T>  {
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
  mapSources: Array<MapSource>;
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

  public abstract startlngLat: any;
  public abstract endlngLat: any;
  public abstract movelngLat: any;
  protected _offset: ArlasMapOffset;
  protected _margePanForLoad: number;
  protected _margePanForTest: number;
  protected _fitBoundsPadding: number;
  protected _displayCurrentCoordinates: boolean;
  protected _wrapLatLng: boolean;
  // @Override
  protected _mapLayers: MapLayers<any>;
  protected _controls: ControlsOption;
  protected _dataSource: Set<string>;
  public visualisationSetsConfig: Array<VisualisationSetConfig>;
  protected _icons: Array<IconConfig>;
  public mapSources: Array<MapSource>;
  protected _maxWidthScale?: number;
  protected _unitScale?: string;
  protected _dataSources?: Set<string>;
  public abstract layersMap: Map<string, any>;
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
    this._icons= config.icons;
    this.mapSources= config.mapSources;
    this._maxWidthScale = config.maxWidthScale;
    this._unitScale= config.unitScale;
    this._dataSources=  config.dataSources;

    this.init(config);
  }
  setMinZoom(minZoom?: number): this {
    throw new Error('Method not implemented.');
  }
  setMaxZoom(maxZoom?: number): this {
    throw new Error('Method not implemented.');
  }
  project(lnglat: unknown): unknown {
    throw new Error('Method not implemented.');
  }
  unproject(point: unknown): unknown {
    throw new Error('Method not implemented.');
  }
  queryRenderedFeatures(pointOrBox?: unknown, options?: { layers?: string[]; filter?: any[]; }): unknown[] {
    throw new Error('Method not implemented.');
  }
  setStyle(style: unknown, options?: { diff?: boolean; localIdeographFontFamily?: string; }): this {
    throw new Error('Method not implemented.');
  }
  getStyle(): unknown {
    throw new Error('Method not implemented.');
  }
  addSource(id: string, source: unknown): this {
    throw new Error('Method not implemented.');
  }
  removeSource(id: string): this {
    throw new Error('Method not implemented.');
  }
  getSource(id: string): unknown {
    throw new Error('Method not implemented.');
  }
  addImage(name: string, image: HTMLImageElement | ArrayBufferView | ImageData | ImageBitmap | { width: number; height: number; data: Uint8Array | Uint8ClampedArray; }, options?: { pixelRatio?: number; sdf?: boolean; }): this {
    throw new Error('Method not implemented.');
  }
  loadImage(url: string, callback: Function): this {
    throw new Error('Method not implemented.');
  }
  addLayer(layer: unknown, before?: string): this {
    throw new Error('Method not implemented.');
  }
  moveLayer(id: string, beforeId?: string): this {
    throw new Error('Method not implemented.');
  }
  removeLayer(id: string): this {
    throw new Error('Method not implemented.');
  }
  getLayer(id: string): unknown {
    throw new Error('Method not implemented.');
  }
  setFilter(layer: string, filter?: boolean | any[], options?: unknown): this {
    throw new Error('Method not implemented.');
  }
  getLight(): unknown {
    throw new Error('Method not implemented.');
  }
  setFeatureState(feature: unknown, state: { [key: string]: any; }): void {
    throw new Error('Method not implemented.');
  }
  getFeatureState(feature: unknown): { [key: string]: any; } {
    throw new Error('Method not implemented.');
  }
  removeFeatureState(target: unknown, key?: string): void {
    throw new Error('Method not implemented.');
  }
  getContainer(): HTMLElement {
    throw new Error('Method not implemented.');
  }
  getCanvasContainer(): HTMLElement {
    throw new Error('Method not implemented.');
  }
  getCanvas(): HTMLCanvasElement {
    throw new Error('Method not implemented.');
  }
  getCenter(): unknown {
    throw new Error('Method not implemented.');
  }
  setCenter(center: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  panTo(lnglat: unknown, options?: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  getZoom(): number {
    throw new Error('Method not implemented.');
  }
  setZoom(zoom: number, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  getBearing(): number {
    throw new Error('Method not implemented.');
  }
  setBearing(bearing: number, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  rotateTo(bearing: number, options?: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  setPitch(pitch: number, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  cameraForBounds(bounds: unknown, options?: unknown): unknown {
    throw new Error('Method not implemented.');
  }
  fitBounds(bounds: unknown, options?: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }

  easeTo(options: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  flyTo(options: unknown, unknown?: unknown): this {
    throw new Error('Method not implemented.');
  }
  on<T extends never>(type: T, layer: string, listener: (ev: unknown) => void): this;
  on<T extends never>(type: T, listener: (ev: unknown) => void): this;
  on(type: string, listener: (ev: any) => void): this;
  on(type: unknown, layer: unknown, listener?: unknown): this {
    throw new Error('Method not implemented.');
  }
  once<T extends never>(type: T, layer: string, listener: (ev: unknown) => void): this;
  once<T extends never>(type: T, listener: (ev: unknown) => void): this;
  once(type: string, listener: (ev: any) => void): this;
  once(type: unknown, layer: unknown, listener?: unknown): this {
    throw new Error('Method not implemented.');
  }

  protected init(config: BaseMapGlConfig<any>): void {
    try {
      this._initMapProvider(config);
      this._initControls();
      this._initImages();
      this._initOnLoad();
      this._initMapMoveEvents();
    } catch (e){
      console.log(e);
    }
  }

  protected abstract _initMapProvider(BaseMapGlConfig): void;
  protected abstract _initImages(): void;
  protected abstract _initOnLoad(): void;
  protected abstract _initControls(): void;
  protected abstract _initMapMoveEvents(): void;
  protected abstract _initSources(): void;
  protected abstract _initVisualisationSet(): void;
  public abstract initDrawControls(config: DrawControlsOption): void;
  protected abstract _loadInternalImage(filePath: string, name: string, errorMessage?: string, opt?: any): void;
  protected abstract _initLoadIcons(): void;

  public abstract bindLayersToMapEvent(layers: string[] | Set<string>, binds: any[]): void;
  protected abstract _bindCustomEvent(): void;
  protected abstract addVisualLayers(): void;
  public abstract reorderLayers(): void;
  public abstract redrawSource(id: string, data): void;
  public abstract updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
                                collection?: string): void;
  public abstract getColdOrHotLayers();
  public abstract addVisualisation(visualisation: VisualisationSetConfig, layers: Array<any>, sources: Array<MapSource>): void;
  protected abstract _getMoveEnd(): void;
  public abstract paddedFitBounds(bounds: any, options?: any);
  public abstract enableDragPan(): void;
  public abstract disableDragPan(): void;
  public abstract getWestBounds(): any;
  public abstract getNorthBounds(): any;
  public abstract getNorthEastBounds(): any;
  public abstract getSouthBounds(): any;
  public abstract getSouthWestBounds(): any;
  public abstract getEstBounds(): any;
  public abstract setCursorStyle(cursor: string): void;
  public abstract getMapProvider(): any;
  public abstract getMapExtend(): MapExtend;
  public abstract onLoad(fn: () => void): void;
  public abstract onMoveEnd(fn: () => void): void;
  protected abstract _updateOnZoomStart(): void;
  protected abstract _updateOnDragStart(): void;
  protected abstract _updateOnDragEnd(): void;
  protected abstract _updateOnMoveEnd(): void;
  protected abstract _updateZoomStart(e?: any): void;
  protected abstract _updateDragEnd(e: any): void;
  protected abstract _updateDragStart(e: any): void;
  protected abstract _updateMoveRatio(e: any): void;
  protected abstract _updateBounds(e?: any): void;
  protected abstract _updateZoom(e?: any): void;
  protected abstract _updateStartLngLat(e?: any): void;
  protected abstract _updateEndLngLat(e?: any): void;
  protected abstract _updateCurrentLngLat(e?: any): void;
  public abstract getLayers(): any;
  public abstract addControl(control: ControlButton, position?: ControlPosition,  eventOverride?: {
    event: string; fn: (e?) => void;});
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

  public addSourcesToMap(sources: Array<MapSource>): void {
    // Add sources defined as input in mapSources;
    const mapSourcesMap = new Map<string, MapSource>();
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

  public updateVisibility(visibilityStatus: Map<string, boolean>){
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

  public disableLayoutVisibility(layer: string){
    this.getMapProvider().setLayoutProperty(layer, 'visibility', 'none');
    this.setStrokeLayoutVisibility(layer, 'none');
    this.setScrollableLayoutVisibility(layer, 'none');
  }

  public enableLayoutVisibility(layer: string){
    this.setLayoutProperty(layer, 'visibility', 'visible');
    this.setStrokeLayoutVisibility(layer, 'visible');
    this.setScrollableLayoutVisibility(layer, 'visible');
  }

  public setLayoutProperty(layer: string, name: string, value: any, options?: any){
    this.getMapProvider().setLayoutProperty(layer, name, value, options);
    return this;
  }

  public findVisualisationSetLayer(visuName: string){
    return this.visualisationSetsConfig.find(v => v.name === visuName).layers;
  }
  public setVisualisationSetLayers(visuName: string, layers: string[]){
    const f = this.visualisationSetsConfig.find(v => v.name === visuName);
    if(f){
      f.layers = layers;
    }
  }

  public unsubscribeEvents(){
    this._eventSubscription.forEach(s => s.unsubscribe());
  }

  public getBounds(){
    return this.getMapProvider().getBounds();
  }

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
    return  this.getMapProvider().getPitch() ;
  }
  
}


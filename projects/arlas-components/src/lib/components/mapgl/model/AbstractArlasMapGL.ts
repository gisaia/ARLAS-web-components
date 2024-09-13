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
import { ExternalEvent, MapLayers } from './mapLayers';
import { Observable, Subscription } from 'rxjs';
import { ElementIdentifier } from '../../results/utils/results.utils';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
  mapLayers: MapLayers<unknown>;
  mapLayersEventBind: {
    onHover: MapEventBinds<unknown>[];
    emitOnClick: MapEventBinds<unknown>[];
    zoomOnClick: MapEventBinds<unknown>[];
  };
  customEventBind: BindLayerToEvent<unknown>[];
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

export abstract class AbstractArlasMapGL {
  /**
   *  props and method with unknow type will be specific to the map provider
   *  we used.
   *  ex: endlnglat will have a type Maplibre.Pointlike/ Mapbox.Point
   */

  public abstract startlngLat: unknown;
  public abstract endlngLat: unknown;
  public abstract movelngLat: unknown;
  protected _offset: ArlasMapOffset;
  protected _margePanForLoad: number;
  protected _margePanForTest: number;
  protected _fitBoundsPadding: number;
  protected _displayCurrentCoordinates: boolean;
  protected _wrapLatLng: boolean;
  protected _mapLayers: MapLayers<unknown>;
  protected _controls: ControlsOption;
  protected _dataSource: Set<string>;
  protected _visualisationSetsConfig: Array<VisualisationSetConfig>;
  protected _icons: Array<IconConfig>;
  public mapSources: Array<MapSource>;
  protected _maxWidthScale?: number;
  protected _unitScale?: string;
  protected _dataSources?: Set<string>;
  public abstract layersMap: Map<string, unknown>;
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
    this._visualisationSetsConfig = config.visualisationSetsConfig;
    this._icons= config.icons;
    this.mapSources= config.mapSources;
    this._maxWidthScale = config.maxWidthScale;
    this._unitScale= config.unitScale;
    this._dataSources=  config.dataSources;

    this.init(config);
  }

  protected init(config: BaseMapGlConfig<unknown>): void {
    try {
      this.initMapProvider(config);
      this.initControls();
      this.initImages();
      this.initOnLoad();
      this.initMapMoveEvents();
    } catch (e){
      console.log(e);
    }
  }

  protected abstract initMapProvider(BaseMapGlConfig): void;
  protected abstract initImages(): void;
  protected abstract initOnLoad(): void;
  public abstract initControls(): void;
  protected abstract initMapMoveEvents(): void;
  protected abstract initSources(): void;
  protected abstract initVisualisationSet(): void;
  public abstract initDrawControls(config: DrawControlsOption): void;
  protected abstract loadInternalImage(filePath: string, name: string, errorMessage?: string, opt?: any): void;
  protected abstract initLoadIcons(): void;

  protected abstract addSourcesToMap(sources: Array<MapSource>): void;
  public abstract bindLayersToMapEvent(layers: string[] | Set<string>, binds: unknown[]): void;
  protected abstract bindCustomEvent(): void;
  protected abstract addVisuLayers(): void;
  public abstract reorderLayers(): void;
  protected abstract setStrokeLayoutVisibility(layerId: string, visibility: string): void;
  protected abstract setScrollableLayoutVisibility(layerId: string, visibility: string): void;
  public abstract addLayerInWritePlaceIfNotExist(layerId: string): void;
  public abstract redrawSource(id: string, data): void;
  public abstract updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
                                collection?: string): void;
  public abstract disableLayoutVisibility(layer: string): void;
  public abstract enableLayoutVisibility(layer: string): void;
  public abstract getColdOrHotLayers();
  public abstract addVisualisation(visualisation: VisualisationSetConfig, layers: Array<unknown>, sources: Array<MapSource>): void;
  protected abstract addExternalEventLayers();
  protected abstract getMoveEnd(): void;
  public abstract paddedFitBounds(bounds: unknown, options?: unknown);
  public abstract enableDragPan(): void;
  public abstract disableDragPan(): void;
  public abstract getWestBounds(): unknown;
  public abstract getNorthBounds(): unknown;
  public abstract getNorthEastBounds(): unknown;
  public abstract getSouthBounds(): unknown;
  public abstract getSouthWestBounds(): unknown;
  public abstract getEstBounds(): unknown;
  public abstract setCursorStyle(cursor: string): void;
  public abstract getMapProvider(): unknown;
  public abstract getMapExtend(): MapExtend;
  public abstract onLoad(fn: () => void): void;
  public abstract onMoveEnd(fn: () => void): void;
  protected abstract updateOnZoomStart(): void;
  protected abstract updateOnDragStart(): void;
  protected abstract updateOnDragEnd(): void;
  protected abstract updateOnMoveEnd(): void;
  protected abstract _updateZoomStart(e?: unknown): void;
  protected abstract _updateDragEnd(e: unknown): void;
  protected abstract _updateDragStart(e: unknown): void;
  protected abstract _updateMoveRatio(e: unknown): void;
  protected abstract _updateBounds(e?: unknown): void;
  protected abstract _updateZoom(e?: unknown): void;
  protected abstract _updateStartLngLat(e?: unknown): void;
  protected abstract _updateEndLngLat(e?: unknown): void;
  protected abstract _updateCurrentLngLat(e?: unknown): void;
  public abstract getLayers(): unknown;
  public abstract addControl(control: ControlButton, position?: ControlPosition,  eventOverride?: {
    event: string; fn: (e?) => void;});
  public abstract addControl(control: unknown, position?: ControlPosition, eventOverride?: {
    event: string; fn: (e?) => void;
  });
  public abstract setLayersMap(mapLayers: MapLayers<unknown>, layers?: Array<unknown>);
  public abstract highlightFeature(featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; });
  public abstract selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string);
  public abstract  selectFeatures(elementToSelect: Array<ElementIdentifier>);
  public abstract updateLayoutVisibility(visualisationName: string);
  public abstract updateVisibility(visibilityStatus: Map<string, boolean>);

  public findVisualisationSetLayer(visuName: string){
    return this._visualisationSetsConfig.find(v => v.name === visuName).layers;
  }
  public setVisualisationSetLayers(visuName: string, layers: string[]){
    const f = this._visualisationSetsConfig.find(v => v.name === visuName);
    if(f){
      f.layers = layers;
    }
  }

  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this._visualisationSetsConfig, event.previousIndex, event.currentIndex);
    this.reorderLayers();
  }

  public dropLayer(event: CdkDragDrop<string[]>, visuName: string) {
    const layers = Array.from(this.findVisualisationSetLayer(visuName));
    moveItemInArray(layers, event.previousIndex, event.currentIndex);
    this.setVisualisationSetLayers(visuName, layers);
    this.reorderLayers();
  }
  public unsubscribeEvents(){
    this._eventSubscription.forEach(s => s.unsubscribe());
  }
}

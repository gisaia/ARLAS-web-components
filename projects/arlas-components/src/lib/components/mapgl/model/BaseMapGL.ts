import { MapSource } from "./mapSource";
import { IconConfig, VisualisationSetConfig } from "../mapgl.component";
import { FeatureCollection } from "@turf/helpers";
import { ArlasAnyLayer, MapExtend } from "../mapgl.component.util";
import { ControlButton, DrawControl } from "../mapgl.component.control";
import { MapLayers } from "./mapLayers";
import { Observable, Subscription } from "rxjs";

export type ControlPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ConfigControls {
  enable: boolean,
  position?:ControlPosition ,
  config?: any,
  overrideEvent?: {event: any, fn:(e) => void}
}
export interface PitchToggleConfigControls extends ConfigControls {
  enable: boolean;
  position?:ControlPosition;
  config: {bearing: number, pitch: number, minpitchzoom: number};
  overrideEvent?: {event: any, fn:(e?) => void};
}
export interface ControlsOption {
  mapAttribution?:  ConfigControls;
  scale?: ConfigControls;
  pitchToggle?: PitchToggleConfigControls;
  navigationControl?:  ConfigControls;
}

export interface DrawConfigControl extends ConfigControls {
  name?:string;
}

export interface DrawControlsOption {
  draw: {control: DrawControl, position?: ControlPosition};
  addGeoBox: DrawConfigControl;
  removeAois: DrawConfigControl;
}



export interface MapEventBinds<T>  {
  mapEventBinds: [{event: T, fn:(e) => void}]
}
export interface BindLayerToEvent<T>  {
  layers:string[];
  mapEventBinds: MapEventBinds<T>
}



export interface BaseMapGlConfig<T> {
  displayCurrentCoordinates: boolean;
  fitBoundsPadding: number;
  margePanForLoad: number;
  margePanForTest: number;
  wrapLatLng: boolean;
  offset: ArlasMapOffset;
  icons: Array<IconConfig>,
  mapSources: Array<MapSource>,
  mapLayers: MapLayers<unknown>,
  mapLayersEventBind: {
    onHover: MapEventBinds<unknown>;
    emitOnClick: MapEventBinds<unknown>;
    zoomOnClick: MapEventBinds<unknown>;
  },
  customEventBind:BindLayerToEvent<unknown>[],
  mapProviderOptions?: T,
  maxWidthScale?: number;
  unitScale?: string;
  dataSources?: Set<string>;
  visualisationSetsConfig?: Array<VisualisationSetConfig>;
  controls? : ControlsOption,
}

export type ArlasMapOffset =  {
  north: number;
  east: number;
  south: number;
  west: number;
}

const defaultFitBoundPadding = 10;

export abstract class BaseMapGL {
  protected _offset: ArlasMapOffset;
  protected _margePanForLoad: number;
  protected _margePanForTest: number;
  protected _fitBoundsPadding: number;
  protected _displayCurrentCoordinates: boolean;
  protected _wrapLatLng: boolean;
  abstract _mapLayers: MapLayers<unknown>;

  public currentLat: string;
  public currentLng: string;


  protected readonly POLYGON_LABEL_SOURCE = 'polygon_label';
  protected ICONS_BASE_PATH = 'assets/icons/';
  protected emptyData : FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  }
  public firstDrawLayer: string;
  public polygonlabeldata = Object.assign({}, this.emptyData)
  public visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  } = {
    visualisations: new Map(),
    status: new Map()
  };
  protected layersMap: Map<string, ArlasAnyLayer>;
  abstract mapProvider: unknown;
  abstract drawProvider: unknown;
  protected config: BaseMapGlConfig<unknown>;
  protected index: any;
  protected north: number;
  protected east: number;
  protected west: number;
  protected south: number;
  protected zoom: number;
  protected zoomStart: number;

  protected dragStartX: number;
  protected dragStartY: number;

  protected dragEndX: number;
  protected dragEndY: number;

  protected xMoveRatio: number;
  protected yMoveRatio: number;

  // points which xy coordinates are in screen referential
  abstract start: any;
  abstract current: any;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  abstract startlngLat: any;
  abstract endlngLat: any;
  abstract movelngLat: any;

  protected _moveEnd$: Observable<any>;
  protected _zoomStart$: Observable<any>;
  protected _dragStart$: Observable<any>;
  protected _dragEnd$: Observable<any>;

  protected eventSubscription: Subscription[];

  constructor(BaseMapGlConfig) {
    this._offset = this.config.offset;
    this._margePanForLoad = this.config.margePanForLoad;
    this._displayCurrentCoordinates = this.config.displayCurrentCoordinates ?? false;
    this._wrapLatLng = this.config.wrapLatLng ?? true;
    this._mapLayers = this.config.mapLayers;
    this._fitBoundsPadding = this.config.fitBoundsPadding ?? defaultFitBoundPadding;

    this.init(BaseMapGlConfig);
  }

  protected init(config: BaseMapGlConfig<unknown>):void {
    this.initMapProvider(config);
    this.initControls();
    this.initImages();
    this.initOnLoad();
    this.initMapMoveEvents();
  }
  abstract initMapProvider(BaseMapGlConfig):void
  abstract initImages():void;
  abstract initOnLoad():void;
  abstract initControls():void
  abstract initMapMoveEvents():void
  abstract addSourcesToMap(sources: Array<MapSource>):void;

  abstract getMap(): any;
  abstract getMapExtend(): MapExtend;
  abstract addControl(control: unknown, position?: unknown,  eventOverrid?: unknown): MapExtend;

  abstract _updateZoomStart(e?: unknown):void
  abstract _updateDragEnd(e?: unknown):void
  abstract _updateDragStart(e?: unknown):void
  abstract _updateMoveRatio(e?: unknown):void
  abstract _updateBounds(e?: unknown):void
  abstract _updateZoom(e?: unknown):void
  abstract _updateStartLngLat(e?: unknown):void
  abstract _updateEndLngLat(e?: unknown):void
  abstract _updateCurrentLngLat(e?: unknown):void
}

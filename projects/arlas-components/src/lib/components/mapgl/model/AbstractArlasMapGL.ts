import { MapSource } from "./mapSource";
import { IconConfig, VisualisationSetConfig } from "../mapgl.component";
import { FeatureCollection } from "@turf/helpers";
import { ArlasAnyLayer, MapExtend } from "../mapgl.component.util";
import { ControlButton, DrawControl } from "../mapgl.component.control";
import { ExternalEvent, MapLayers } from "./mapLayers";
import { Observable, Subscription } from "rxjs";
import mapboxgl, {
  AnyLayer,
  AnySourceData,
  Control,
  FilterOptions,
  IControl,
  LngLatBoundsLike,
  MapLayerEventType
} from "mapbox-gl";

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
   event: T;
   fn:(e?) => void;
}
export interface BindLayerToEvent<T>  {
  layers:string[];
  mapEventBinds: MapEventBinds<T>[]
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
    onHover: MapEventBinds<unknown>[];
    emitOnClick: MapEventBinds<unknown>[];
    zoomOnClick: MapEventBinds<unknown>[];
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

export abstract class AbstractArlasMapGL {
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
  protected _mapSources: Array<MapSource>
  protected _maxWidthScale?: number;
  protected _unitScale?: string;
  protected _dataSources?: Set<string>;
  protected _layersMap: Map<string, ArlasAnyLayer>;

  get mapSources(){
    return this._mapSources
  }

  get zoom(){
    return this._zoom;
  }

  get layersMap(){
    return this._layersMap;
  }


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

  abstract mapProvider: unknown;
  protected index: any;
  protected north: number;
  protected east: number;
  protected west: number;
  protected south: number;
  protected _zoom: number;
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

  protected eventSubscription: Subscription[] = [];

  constructor(protected config:BaseMapGlConfig<any>) {
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
    this._mapSources= config.mapSources;
    this._maxWidthScale = config.maxWidthScale;
    this._unitScale= config.unitScale;
    this._dataSources=  config.dataSources;

    this.init(config)
  }

  protected init(config: BaseMapGlConfig<unknown>):void {
    try {
      this.initMapProvider(config);
      console.log('1')
      this.initControls();
      console.log('1')
      this.initImages();
      console.log('1')
      this.initOnLoad();
      this.initMapMoveEvents();
    } catch (e){
      console.log(e)
    }
  }

  protected abstract initMapProvider(BaseMapGlConfig):void
  protected abstract initImages():void;
  protected abstract initOnLoad():void;
  public abstract initControls():void
  protected abstract initMapMoveEvents():void
  protected abstract initSources():void
  protected abstract initVisualisationSet():void
  public abstract initDrawControls(config: DrawControlsOption) :void
  protected abstract loadImage(filePath: string, name: string, errorMessage?:string,  opt?: any) :void
  protected abstract loadIcons(): void;

  protected abstract addSourcesToMap(sources: Array<MapSource>):void;
  public abstract bindLayersToMapEvent(layers: string[] | Set<string>, binds: MapEventBinds<keyof  MapLayerEventType>[]): void;
  protected abstract bindCustomEvent():void;
  protected abstract addVisuLayers():void;
  public abstract reorderLayers():void;
  protected abstract setStrokeLayoutVisibility(layerId: string, visibility: string): void;
  protected abstract setScrollableLayoutVisibility(layerId: string, visibility: string): void;
  public abstract addLayerInWritePlaceIfNotExist(layerId: string): void;
  public abstract redrawSource(id:string, data):void;
  public abstract updateLayoutVisibility(visualisationName: string):void;
  public abstract updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
                                collection?: string): void;
  public abstract  updateVisibility(visibilityStatus: Map<string, boolean>): void;
  public abstract disableLayoutVisibility(layer: string): void;
  public abstract enableLayoutVisibility(layer: string): void;
  public abstract getColdOrHotLayers();
  public abstract findVisualisationSetLayer(visuName:string);
  public abstract setVisualisationSetLayers(visuName:string, layers: string[]);
  public abstract addVisualisation(visualisation: VisualisationSetConfig, layers: Array<AnyLayer>, sources: Array<MapSource>): void
  protected abstract addExternalEventLayers();

  public abstract setLayersMap(mapLayers: MapLayers<AnyLayer>, layers?: Array<AnyLayer>):void;
  public abstract setCursorStyle(cursor: string): void;
  public abstract addSource(sourceId: string, source: AnySourceData): void;
  public abstract getMap(): any;
  public abstract getMapExtend(): MapExtend;
  public abstract addLayer(layerId: AnyLayer, before?:string);
  public abstract getLayerFromMapProvider(layerId: string);
  public abstract moveLayer(id: string, before?:string);
  public abstract getSource(id: string);
  public abstract setLayoutProperty(layer: string, name: string, value: any, options?: FilterOptions)
  public abstract addControl(control: ControlButton, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left",  eventOverrid?: {
    event: string, fn: (e?) => void});
  public abstract addControl(control: Control | IControl, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left");
  public abstract addControl(control: Control | IControl | ControlButton, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left", eventOverrid?: {
    event: string, fn: (e?) => void
  });
  public abstract getBounds():void;
  public abstract fitBounds(bounds: LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions, eventData?: mapboxgl.EventData):void;
  public abstract setCenter(lngLat: [number, number]):void;
  public abstract getWestBounds():void;
  public abstract getNorthBounds():void;
  public abstract getNorthEastBounds():void;
  public abstract getSouthBounds():void;
  public abstract getSouthWestBounds():void;
  public abstract getEstBounds():void;
  public abstract getZoom():void;
  public abstract getCanvasContainer():void;
  public abstract getLayers():void;
  public abstract enableDragPan():void;
  public abstract flyTo(center, zoom: number):void;
  public abstract queryRenderedFeatures(point: [number, number]):void;


  abstract _updateZoomStart(e?: unknown):void
  abstract _updateDragEnd(e: unknown):void
  abstract _updateDragStart(e: unknown):void
  abstract _updateMoveRatio(e: unknown):void
  abstract _updateBounds(e?: unknown):void
  abstract _updateZoom(e?: unknown):void
  abstract _updateStartLngLat(e?: unknown):void
  abstract _updateEndLngLat(e?: unknown):void
  abstract _updateCurrentLngLat(e?: unknown):void
}

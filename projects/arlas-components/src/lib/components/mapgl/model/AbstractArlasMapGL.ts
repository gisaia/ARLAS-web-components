import { MapSource } from './mapSource';
import { IconConfig, VisualisationSetConfig } from '../mapgl.component';
import { FeatureCollection } from '@turf/helpers';
import { MapExtend } from '../mapgl.component.util';
import { ControlButton } from '../mapgl.component.control';
import { ExternalEvent, MapLayers } from './mapLayers';
import { Observable, Subscription } from 'rxjs';
import { ElementIdentifier } from '../../results/utils/results.utils';
import { ArlasDraw } from "./ArlasDraw";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

export type ControlPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

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
  draw: {control: MapboxDraw; position?: ControlPosition;};
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
  protected abstract loadImage(filePath: string, name: string, errorMessage?: string,  opt?: any): void;
  protected abstract loadIcons(): void;

  protected abstract addSourcesToMap(sources: Array<MapSource>): void;
  public abstract bindLayersToMapEvent(layers: string[] | Set<string>, binds: unknown[]): void;
  protected abstract bindCustomEvent(): void;
  protected abstract addVisuLayers(): void;
  public abstract reorderLayers(): void;
  protected abstract setStrokeLayoutVisibility(layerId: string, visibility: string): void;
  protected abstract setScrollableLayoutVisibility(layerId: string, visibility: string): void;
  public abstract addLayerInWritePlaceIfNotExist(layerId: string): void;
  public abstract redrawSource(id: string, data): void;
  public abstract updateLayoutVisibility(visualisationName: string): void;
  public abstract updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
                                collection?: string): void;
  public abstract  updateVisibility(visibilityStatus: Map<string, boolean>): void;
  public abstract disableLayoutVisibility(layer: string): void;
  public abstract enableLayoutVisibility(layer: string): void;
  public abstract getColdOrHotLayers();
  public abstract findVisualisationSetLayer(visuName: string);
  public abstract setVisualisationSetLayers(visuName: string, layers: string[]);
  public abstract addVisualisation(visualisation: VisualisationSetConfig, layers: Array<unknown>, sources: Array<MapSource>): void;
  protected abstract addExternalEventLayers();
  protected abstract getMoveEnd(): void;
  public abstract paddedFitBounds(bounds:unknown, options?: mapboxgl.FitBoundsOptions);
  public abstract drop(event:unknown): void;
  public abstract dropLayer(event: unknown, visuName: string): void;
  public abstract  highlightFeature(featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; });
  public abstract  selectFeatures(elementToSelect: Array<ElementIdentifier>): void;
  public abstract selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string): void;

  /**
   * we wrap maprovider function to hide
   * maprovider implementation from our other interface.
   * to prevent changes from impacting other parts of the application.
   * ex:
   * addLayer(){
   * provider1.addLayerToMap()
   * }
   *
   * addLayer(){
   * provider2.addLayer()
   * }
   *
   * if we change the implementation, as we used addLayer in all our app,
   * the change is transparent.
   */
  public abstract on(event: string, func: (e) => void)
  public abstract setLayersMap(mapLayers: MapLayers<unknown>, layers?: Array<unknown>): void;
  public abstract setCursorStyle(cursor: string): void;
  public abstract addSource(sourceId: string, source: unknown): void;
  public abstract getMap(): any;
  public abstract getMapExtend(): MapExtend;
  public abstract addLayer(layerId: any, before?: string);
  public abstract getLayerFromMapProvider(layerId: string);
  public abstract moveLayer(id: string, before?: string);
  public abstract getSource(id: string);
  public abstract setLayoutProperty(layer: string, name: string, value: any, options?: unknown);
  public abstract addControl(control: ControlButton, position?: ControlPosition,  eventOverrid?: {
    event: string; fn: (e?) => void;});
  public abstract addControl(control: unknown, position?: ControlPosition);
  public abstract addControl(control: unknown,
                             position?: ControlPosition,
                             eventOverrid?: {
    event: string; fn: (e?) => void;
  });
  public abstract getBounds(): void;
  public abstract fitBounds(bounds: unknown, options?: mapboxgl.FitBoundsOptions, eventData?: mapboxgl.EventData): void;
  public abstract setCenter(lngLat: [number, number]): void;
  public abstract getWestBounds(): void;
  public abstract getNorthBounds(): void;
  public abstract getNorthEastBounds(): void;
  public abstract getSouthBounds(): void;
  public abstract getSouthWestBounds(): void;
  public abstract getEstBounds(): void;
  public abstract getZoom(): void;
  public abstract getCanvasContainer(): void;
  public abstract getLayers(): void;
  public abstract enableDragPan(): void;
  public abstract getCenter(): void;
  public abstract flyTo(center, zoom: number): void;
  public abstract project(latlng: unknown): void;
  public abstract unproject(latlng: unknown): void;
  public abstract queryRenderedFeatures(point: [number, number]): void;
  public abstract onLoad(fn: () => void): void;
  public abstract onMoveEnd(fn: () => void): void;
  protected abstract updateOnZoomStart(): void;
  protected abstract updateOnDragStart(): void;
  protected abstract updateOnDragEnd(): void;
  protected abstract updateOnMoveEnd(): void;
  public abstract unsubscribeEvents(): void;

  protected abstract _updateZoomStart(e?: unknown): void;
  protected abstract _updateDragEnd(e: unknown): void;
  protected abstract _updateDragStart(e: unknown): void;
  protected abstract _updateMoveRatio(e: unknown): void;
  protected abstract _updateBounds(e?: unknown): void;
  protected abstract _updateZoom(e?: unknown): void;
  protected abstract _updateStartLngLat(e?: unknown): void;
  protected abstract _updateEndLngLat(e?: unknown): void;
  protected abstract _updateCurrentLngLat(e?: unknown): void;
}

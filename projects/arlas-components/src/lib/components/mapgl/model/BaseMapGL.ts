import { MapSource } from "./mapSource";
import { IconConfig, VisualisationSetConfig } from "../mapgl.component";
import { FeatureCollection } from "@turf/helpers";
import { ArlasAnyLayer, MapExtend } from "../mapgl.component.util";
import { ControlButton } from "../mapgl.component.control";
import { MapLayers } from "./mapLayers";

export type ControlPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ConfigControls {
  enable: boolean,
  position?:ControlPosition ,
  config?: any,
  overrideEvent?: any
}
export interface PitchToggleConfigControls extends ConfigControls {
  enable: boolean,
  position?:ControlPosition ,
  config: {bearing: number, pitch: number, minpitchzoom: number},
  overrideEvent?: any
};
export interface ControlsOption {
  mapAttribution?:  ConfigControls;
  scale?: ConfigControls;
  pitchToggle?: PitchToggleConfigControls;
  navigationControl?:  ConfigControls;
}

export interface DrawControlsOption {
  draw: {control, position: ControlPosition};
  addGeoBox?: DrawConfigControl;
  removeAois: DrawConfigControl;
}

export interface DrawConfigControl extends ConfigControls {
 name?:string;
}


export interface BaseMapGlConfig<T> {
  icons: Array<IconConfig>,
  mapSources: Array<MapSource>,
  mapLayers: MapLayers<unknown>,
  mapLayersEventBind: {
    onHover: (e: any) => void;
    emitOnClick: (e: any) => void;
    zoomOnClick: (e: any) => void;
  }
  mapProviderOptions?: T,
  maxWidthScale?: number;
  unitScale?: string;
  dataSources?: Set<string>;
  visualisationSetsConfig?: Array<VisualisationSetConfig>;
  controls? : ControlsOption,
}

export abstract class BaseMapGL {
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
  config: BaseMapGlConfig<unknown>;
  protected index: any;
  protected north: number;
  protected east: number;
  protected west: number;
  protected south: number;
  protected isDrawingBbox = false;
  protected canvas: HTMLElement;
  protected box: HTMLElement;
  // points which xy coordinates are in screen referential
  abstract start: any;
  abstract current: any;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  abstract startlngLat: any;
  abstract endlngLat: any;
  abstract movelngLat: any;

  abstract init(config: BaseMapGlConfig<any>):void
  abstract initControls():void
  abstract addSourcesToMap(sources: Array<MapSource>):void;

  abstract getMap(): any;
  abstract getMapExtend(): MapExtend;
  abstract addControl(control: unknown, position?: unknown,  eventOverrid?: unknown): MapExtend;

}

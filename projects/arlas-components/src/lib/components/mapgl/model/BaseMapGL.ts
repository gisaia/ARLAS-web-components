import { MapSource } from "./mapSource";
import { VisualisationSetConfig } from "../mapgl.component";
import { FeatureCollection } from "@turf/helpers";
import { MapExtend } from "../mapgl.component.util";

export type AttributionPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface BaseMapGlConfig<T> {
  mapProviderOptions?: T,
  mapAttributionPosition:AttributionPosition;
  maxWidthScale: number;
  unitScale: string;
  displayScale?:boolean;
  dataSources?: Set<string>;
  visualisationSetsConfig?: Array<VisualisationSetConfig>;
}

export abstract class BaseMapGL {
  abstract mapProvider: unknown;
  config: BaseMapGlConfig<unknown>;
  protected emptyData: FeatureCollection<GeoJSON.Geometry>;
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
}

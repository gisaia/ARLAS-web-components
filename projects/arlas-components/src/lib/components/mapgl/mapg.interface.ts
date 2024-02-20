import * as maplibregl from "maplibre-gl";

export const CROSS_LAYER_PREFIX = 'arlas_cross';

export interface OnMoveResult {
  zoom: number;
  zoomStart: number;
  center: Array<number> | maplibregl.LngLat;
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

export interface IconConfig {
  path: string;
  recolorable?: boolean;
}

export const ZOOM_IN = 'Zoom in';
export const ZOOM_OUT = 'Zoom out';
export const RESET_BEARING = 'Reset bearing to north';
export const LAYER_SWITCHER_TOOLTIP = 'Manage layers';
export const GEOJSON_SOURCE_TYPE = 'geojson';

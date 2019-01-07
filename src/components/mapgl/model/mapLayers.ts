export interface BasemapStyle {
  name: string;
  styleFile: string;
}

export interface BasemapStylesGroup {
  basemapStyles: Array<BasemapStyle>;
  selectedBasemapStyle: BasemapStyle;
}

export interface MapLayers {
  layers: Array<mapboxgl.Layer>;
  styleGroups: Array<StyleGroup>;
  events: LayerEvents;
}

export interface StyleGroup {
  id: string;
  name: string;
  base: Set<string>;
  isDefault?: boolean;
  styles: Array<Style>;
  selectedStyle?: Style;
}

export interface Style {
  id: string;
  name: string;
  layerIds: Set<string>;
  geomStrategy?: geomStrategyEnum;
  isDefault?: boolean;
}

export interface LayerEvents {
  onHover: Set<string>;
  emitOnClick: Set<string>;
  zoomOnClick: Set<string>;
}

export enum geomStrategyEnum {
  bbox,
  centroid,
  first,
  last,
  byDefault,
  geohash
}


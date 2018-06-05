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
}

export interface Style {
  id: string;
  name: string;
  layerIds: Set<string>;
  drawType: drawType;
  isDefault?: boolean;
}

export interface LayerEvents {
  onHover: Set<string>;
  emitOnClick: Set<string>;
  zoomOnClick: Set<string>;
}

export enum drawType {
  RECTANGLE,
  CIRCLE
}


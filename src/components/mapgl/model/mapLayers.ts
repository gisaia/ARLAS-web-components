import { Layer } from 'mapbox-gl/dist/mapbox-gl';

export interface MapLayers {
  layers: Array<Layer>;
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
  isDefault?: boolean;
}

export interface LayerEvents {
  onHover: Set<string>;
  emitOnClick: Set<string>;
  zoomOnClick: Set<string>;
}


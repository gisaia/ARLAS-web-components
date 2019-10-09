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

export interface BasemapStyle {
  name: string;
  styleFile: string | mapboxgl.Style;
}

export interface BasemapStylesGroup {
  basemapStyles: Array<BasemapStyle>;
  selectedBasemapStyle: BasemapStyle;
}

export interface MapLayers {
  layers: Array<mapboxgl.Layer>;
  externalEventLayers?: Array<ExternalEventLayer>;
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

export interface ExternalEventLayer {
  id: string;
  on: ExternalEvent;
}

export enum ExternalEvent {
  select = 'select',
  hover = 'hover'
}


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

import { AnyLayer } from 'mapbox-gl';

export interface MapLayers {
  layers: Array<AnyLayer>;
  externalEventLayers?: Array<ExternalEventLayer>;
  events: LayerEvents;
}

export interface LayerEvents {
  onHover: Set<string>;
  emitOnClick: Set<string>;
  zoomOnClick: Set<string>;
}

export interface ExternalEventLayer {
  id: string;
  on: ExternalEvent;
}

export enum ExternalEvent {
  select = 'select',
  hover = 'hover'
}

export interface FillStroke {
  width?: PaintValue;
  opacity?: number;
  color?: PaintValue;
}
export interface LayerMetadata {
  collection?: string;
  collectionDisplayName?: string;
  stroke?: FillStroke;
  isScrollableLayer?: boolean;

}
export type PaintValue = Array<string | Array<string> | number> | PaintColor | string | number;

export interface PaintColor {
  property: string;
  type: string;
  stops: Array<Array<string>>;
}


export const HOVER_LAYER_PREFIX = 'arlas-hover-';
export const SELECT_LAYER_PREFIX = 'arlas-select-';
export const FILLSTROKE_LAYER_PREFIX = 'arlas-fill_stroke-';
export const SCROLLABLE_ARLAS_ID = 'scrollable_arlas_id:';
export const ARLAS_ID = 'arlas_id:';
export const ARLAS_VSET = ':arlas_vset:';



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

export interface ArlasDataLayer {
  id: string;
  type: string;
  minzoom?: number;
  maxzoom?: number;
  source?: string;
  metadata?: LayerMetadata;
  paint: ArlasPaint;
  layout?: any;
  filter?: any;
}

export interface MapLayers<T> {
  layers: Array<T>;
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

/** Metadata of a layer containing info about
 * - the collection
 * - whether it has an interaction with the resultlist (scrollable)
 * - geomType for circle heatmap.
 */
export interface LayerMetadata {
  collection?: string;
  collectionDisplayName?: string;
  stroke?: FillStroke;
  isScrollableLayer?: boolean;
  hiddenProps?: MetadataHiddenProps;
  showLegend?: boolean;
}
export interface MetadataHiddenProps {
  geomType?: string;
}

export type PaintValue = Array<string | Array<string> | number> | PaintColor | string | number;
export interface ArlasPaint { [key: string]: PaintValue; }
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

/** FROM V15.0.0 layer ids look like 'arlas_id:NAME:timestamp
   * This pipe extracts the 'NAME' in that id
   */
export function getLayerName(id: string): string {
  if (!!id && id.startsWith(ARLAS_ID)) {
    const datedName = id.split(ARLAS_ID)[1];
    const undatedName = datedName.split(':')[0];
    return undatedName;
  }
  return id;
}

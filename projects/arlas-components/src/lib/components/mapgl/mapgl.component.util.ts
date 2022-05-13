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

import { Pipe, PipeTransform } from '@angular/core';
import { Point } from 'mapbox-gl';

export function paddedBounds(npad: number, spad: number, epad: number,
  wpad: number, map: any, SW, NE) {
  const topRight = map.project(NE);
  const bottomLeft = map.project(SW);
  const scale = 1;
  const southWestToPoint = map.project(SW);
  const southWestPoint = new Point(((southWestToPoint.x - bottomLeft.x) * scale) - wpad, ((southWestToPoint.y - topRight.y) * scale) + spad);
  const southWestWorld = new Point(southWestPoint.x / scale + bottomLeft.x, southWestPoint.y / scale + topRight.y);
  const swWorld = map.unproject(southWestWorld);
  const northEastToPoint = map.project(NE);
  const northEastPoint = new Point(((northEastToPoint.x - bottomLeft.x) * scale) + epad, ((northEastToPoint.y - topRight.y) * scale) - npad);
  const northEastWorld = new Point(northEastPoint.x / scale + bottomLeft.x, northEastPoint.y / scale + topRight.y);
  const neWorld = map.unproject(northEastWorld);
  return [swWorld, neWorld];
}

export function project(lat: number, lng: number, zoom: number): { x: number; y: number; } {

  const R = 6378137;
  const sphericalScale = 0.5 / (Math.PI * R);
  const d = Math.PI / 180;
  const max = 1 - 1E-15;
  const sin = Math.max(Math.min(Math.sin(lat * d), max), -max);
  const scale = 256 * Math.pow(2, zoom);

  const point = {
    x: R * lng * d,
    y: R * Math.log((1 + sin) / (1 - sin)) / 2
  };

  point.x = tiled(scale * (sphericalScale * point.x + 0.5));
  point.y = tiled(scale * (-sphericalScale * point.y + 0.5));

  return point;
}

function tiled(num: number): number {
  return Math.floor(num / 256);
}

export interface MapExtend {
  bounds: number[][];
  center: number[];
  zoom: number;
}

@Pipe({ name: 'getLayer' })
export class GetLayerPipe implements PipeTransform {
  public transform(value: string, layersMap?: Map<string, mapboxgl.Layer>): mapboxgl.Layer {
    return !!layersMap ? layersMap.get(value) : undefined;
  }
}

@Pipe({ name: 'getCollection' })
export class GetCollectionPipe implements PipeTransform {
  public transform(value: string, layersMap?: Map<string, mapboxgl.Layer>): string {
    let collection: string;
    if (!!layersMap && !!layersMap.get(value).metadata) {
      if (!!layersMap.get(value).metadata.collectionDisplayName) {
        collection = layersMap.get(value).metadata.collectionDisplayName;
      } else if (!!layersMap.get(value).metadata.collection) {
        collection = layersMap.get(value).metadata.collection;
      }
    }
    return collection;
  }
}

export interface LegendData {
  minValue?: string;
  maxValue?: string;
  keysColorsMap?: Map<string, string>;
}

export interface Legend {
  type?: PROPERTY_SELECTOR_SOURCE;
  title?: string;
  minValue?: string;
  maxValue?: string;
  fixValue?: string | number;
  interpolatedValues?: Array<string | number>;
  manualValues?: Map<string, string | number>;
  visible?: boolean;
}


export enum PROPERTY_SELECTOR_SOURCE {
  fix = 'Fix',
  provided = 'Provided',
  generated = 'Generated',
  manual = 'Manual',
  interpolated = 'Interpolated',
  metric_on_field = 'Metric on field',
  heatmap_density = 'Density'
}

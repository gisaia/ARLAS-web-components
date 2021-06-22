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
    const SWtopoint = map.project(SW);
    const SWpoint = new Point(((SWtopoint.x - bottomLeft.x) * scale) - wpad, ((SWtopoint.y - topRight.y) * scale) + spad);
    const SWworld = new Point(SWpoint.x / scale + bottomLeft.x, SWpoint.y / scale + topRight.y);
    const swWorld = map.unproject(SWworld);
    const NEtopoint = map.project(NE);
    const NEpoint = new Point(((NEtopoint.x - bottomLeft.x) * scale) + epad, ((NEtopoint.y - topRight.y) * scale) - npad);
    const NEworld = new Point(NEpoint.x / scale + bottomLeft.x, NEpoint.y / scale + topRight.y);
    const neWorld = map.unproject(NEworld);
    return [swWorld, neWorld];
}

export function project(lat: number, lng: number, zoom: number): { x: number, y: number } {

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
        return !!layersMap ? !!layersMap.get(value).metadata ? layersMap.get(value).metadata.collection : undefined : undefined;
    }
}

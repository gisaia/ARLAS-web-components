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

import { StyleGroup, Style } from './model/mapLayers';
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

export function xyz(bounds, minZoom, maxZoom?): Array<{ x: number, y: number, z: number }> {
    let min;
    let max;
    let tiles = [];

    if (!maxZoom) {
        max = min = minZoom;
    } else if (maxZoom < minZoom) {
        min = maxZoom;
        max = minZoom;
    } else {
        min = minZoom;
        max = maxZoom;
    }
    for (let z = min; z <= max; z++) {
        tiles = tiles.concat(getTiles(bounds, z));
    }
    return tiles;
}


export function getTiles(bounds: Array<Array<number>>, zoom: number): Array<{ x: number, y: number, z: number }> {
    // north,west
    const min = project(bounds[1][1], bounds[0][0], zoom);
    // south,east
    const max = project(bounds[0][1], bounds[1][0], zoom);
    const tiles = [];
    for (let x = min.x; x <= max.x; x++) {
        for (let y = min.y; y <= max.y; y++) {

            tiles.push({
                x: x % (2 ** (zoom)),
                y: y % (2 ** (zoom)),
                z: zoom
            });
        }
    }
    return tiles;
}

export function getDefaultStyleGroup(styleGroups: Array<StyleGroup>): StyleGroup {
    let defaultStyleGroup: StyleGroup;
    if (styleGroups !== undefined) {
        for (let i = 0; i < styleGroups.length; i++) {
            if (styleGroups[i].isDefault) {
                defaultStyleGroup = styleGroups[i];
                break;
            }
        }
        // if there is no default style group
        if (styleGroups.length > 0 && defaultStyleGroup === undefined) {
            defaultStyleGroup = styleGroups[0];
        }
    }
    return defaultStyleGroup;
}

export function getDefaultStyle(styles: Array<Style>) {
    let defaultStyle: Style;
    if (styles !== undefined) {
        for (let i = 0; i < styles.length; i++) {
            if (styles[i].isDefault) {
                defaultStyle = styles[i];
                break;
            }
        }
        // if there is no default style
        if (styles.length > 0 && defaultStyle === undefined) {
            defaultStyle = styles[0];
        }
    }
    return defaultStyle;
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

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


/** This file describes how to style a vector layer */

export enum VectorStyleEnum {
    circle = 'circle',
    fill = 'fill',
    line = 'line'
}

export interface ArlasCircle {
    'circle-color': any;
    'circle-radius': any;
    'circle-blur': any;
    'circle-opacity': any;
    'circle-stroke-width': any;
    'circle-stroke-color': any;
    'circle-stroke-opacity': any;
}

export interface ArlasFill {
    'fill-color': any;
    'fill-opacity': any;
    'fill-outline-color': any;
}

export abstract class VectorStyle {
    public type: VectorStyleEnum;
    public style: ArlasCircle | ArlasFill;
    public constructor(type: VectorStyleEnum, style: ArlasCircle | ArlasFill ) {
        this.type = type;
        this.style = style;
    }

    public applyStyle(layer: any) {
        switch (this.type) {
            case VectorStyleEnum.circle:
                this.circle(layer);
                break;
            case VectorStyleEnum.fill:
                this.fill(layer);
                break;
        }
    }

    public abstract circle(layer: any);
    public abstract fill(layer: any);
}

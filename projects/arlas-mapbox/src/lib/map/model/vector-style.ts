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

import { VectorStyleEnum } from 'arlas-map';
import { ArlasFill } from 'arlas-map';
import { ArlasCircle } from 'arlas-map';
import { VectorStyle } from 'arlas-map';
import { CircleLayer, FillLayer } from 'mapbox-gl';


/** This file describes how to style a vector layer */

export class MapboxVectorStyle extends VectorStyle {
    public constructor(type: VectorStyleEnum, style: ArlasCircle | ArlasFill) {
        super(type, style);
    }

    /** Any adjustment from ArlasCircle to the layer circle style should be implemented here. */
    public circle(layer: CircleLayer) {
        layer.paint = this.style as any;
    };

    /** Any adjustment from ArlasFill to the layer fill style should be implemented here. */
    public fill(layer: FillLayer) {
        layer.paint = this.style as any;
    };
}

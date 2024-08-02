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

import MapboxDraw from '@mapbox/mapbox-gl-draw';

export function createSupplementaryPointsForCircle(geojson) {
    const { properties, geometry } = geojson;

    if (!properties.user_isCircle) {
        return null;
    }

    const supplementaryPoints = [];
    const vertices = geometry.coordinates[0].slice(0, -1);
    for (let index = 0; index < vertices.length; index += Math.round((vertices.length / 4))) {
        supplementaryPoints.push(MapboxDraw.lib.createVertex(properties.id, vertices[index], `0.${index}`, false));
    }
    return supplementaryPoints;
}

export const dragPan = {
    enable(ctx) {
        setTimeout(() => {
            // First check we've got a map and some context.
            if (!ctx.map || !ctx.map.dragPan || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) {
                return;
            }
            // Now check initial state wasn't false (we leave it disabled if so)
            if (!ctx._ctx.store.getInitialConfigValue('dragPan')) {
                return;
            }
            ctx.map.dragPan.enable();
        }, 0);
    },

    disable(ctx) {
        setTimeout(() => {
            if (!ctx.map || !ctx.map.doubleClickZoom) {
                return;
            }
            // Always disable here, as it's necessary in some cases.
            ctx.map.dragPan.disable();
        }, 0);
    }
};


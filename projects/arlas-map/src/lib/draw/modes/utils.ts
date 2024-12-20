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

export function createDrawVertex(parentId, coordinates, path, selected) {
    return {
        type: 'Feature',
        properties: {
            meta: 'vertex',
            parent: parentId,
            coord_path: path,
            active: selected ? 'true' : 'false',
        },
        geometry: {
            type: 'Point',
            coordinates,
        },
    };
}
export function displayFeatures(state, geojson, display) {
    const isActiveLine = geojson.properties.id === state.line.id;
    geojson.properties.active = isActiveLine ? 'true' : 'false';
    if (!isActiveLine) {
        if (!geojson.geometry.coordinates[0][0]) {
            return null;
        }
        return display(geojson);
    }

    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) {
        return null;
    }
    geojson.properties.meta = 'feature';

    // displays center vertex as a point feature
    display(
        createDrawVertex(
            state.line.id,
            geojson.geometry.coordinates[
            state.direction === 'forward'
                ? geojson.geometry.coordinates.length - 2
                : 1
            ],
            `${state.direction === 'forward'
                ? geojson.geometry.coordinates.length - 2
                : 1
            }`,
            false
        )
    );

    // displays the line as it is drawn
    display(geojson);

}


export function updateCoordinates(state, e) {
    if (state.direction === 'forward') {
        state.currentVertexPosition += 1; // eslint-disable-line
        state.line.updateCoordinate(
            state.currentVertexPosition,
            e.lngLat.lng,
            e.lngLat.lat
        );
    } else {
        state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    }
}
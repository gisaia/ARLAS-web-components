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
import circle from '@turf/circle';
import { point } from '@turf/helpers';
import distance from '@turf/distance';
import { createSupplementaryPointsForCircle } from './circles/utils';


const directModeOverride = MapboxDraw.modes.direct_select;

directModeOverride.dragFeature = function (state, e, delta) {
    MapboxDraw.lib.moveFeatures(this.getSelected(), delta);
    this.getSelected()
        .filter(feature => feature.properties.isCircle)
        .map(circle => circle.properties.center)
        .forEach(center => {
            center[0] += delta.lng;
            center[1] += delta.lat;
        });
    state.dragMoveLocation = e.lngLat;
};

directModeOverride.dragVertex = function (state, e, delta) {
    if (state.feature.properties.isCircle && state.feature.properties.isFixedRadius) {
        MapboxDraw.lib.moveFeatures(this.getSelected(), delta);
        this.getSelected()
            .filter(feature => feature.properties.isCircle)
            .map(circle => circle.properties.center)
            .forEach(center => {
                center[0] += delta.lng;
                center[1] += delta.lat;
            });
        state.dragMoveLocation = e.lngLat;
    } else {
        if (state.feature.properties.isCircle) {
            const center = state.feature.properties.center;
            const movedVertex = [e.lngLat.lng, e.lngLat.lat];
            const radius = distance(point(center), point(movedVertex), { units: 'kilometers' });
            const circleFeature = circle(center, radius);
            state.feature.incomingCoords(circleFeature.geometry.coordinates);
            state.feature.properties.radiusInKm = radius;
        } else {
            const selectedCoords = state.selectedCoordPaths.map(coord_path => state.feature.getCoordinate(coord_path));
            const selectedCoordPoints = selectedCoords.map(coords => ({
                type: MapboxDraw.constants.geojsonTypes.FEATURE,
                properties: {},
                geometry: {
                    type: MapboxDraw.constants.geojsonTypes.POINT,
                    coordinates: coords
                }
            }));

            const constrainedDelta = MapboxDraw.lib.constrainFeatureMovement(selectedCoordPoints, delta);
            for (let i = 0; i < selectedCoords.length; i++) {
                const coord = selectedCoords[i];
                state.feature.updateCoordinate(state.selectedCoordPaths[i], coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat);
            }
        }
    }

};

directModeOverride.toDisplayFeatures = function (state, geojson, push) {
    if (state.featureId === geojson.properties.id) {
        geojson.properties.active = MapboxDraw.constants.activeStates.ACTIVE;
        push(geojson);
        const supplementaryPoints = geojson.properties.user_isCircle ? createSupplementaryPointsForCircle(geojson)
            : MapboxDraw.lib.createSupplementaryPoints(geojson, {
                map: this.map,
                midpoints: true,
                selectedPaths: state.selectedCoordPaths
            });
        supplementaryPoints.forEach(push);
    } else {
        geojson.properties.active = MapboxDraw.constants.activeStates.INACTIVE;
        push(geojson);
    }
    this.fireActionable(state);

};

export default directModeOverride;

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
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import { createSupplementaryPointsForCircle, moveCircleFeatureCenter } from './circles/utils';


export const directModeOverride = MapboxDraw.modes.direct_select;

directModeOverride.dragFeature = function (state, e, delta) {
    MapboxDraw.lib.moveFeatures(this.getSelected(), delta);
    moveCircleFeatureCenter(this.getSelected(), delta);
    state.dragMoveLocation = e.lngLat;
};

directModeOverride.dragVertex = function (state, e, delta) {
    if (state.feature.properties.isCircle && state.feature.properties.isFixedRadius) {
        MapboxDraw.lib.moveFeatures(this.getSelected(), delta);
        moveCircleFeatureCenter(this.getSelected(), delta);
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
            const selectedCoords = state.selectedCoordPaths.map((coord_path: string) => state.feature.getCoordinate(coord_path));
            const selectedCoordPoints = selectedCoords.map((coords: GeoJSON.Position) => ({
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

directModeOverride.toDisplayFeatures = function (state, geojson: GeoJSON.Feature<GeoJSON.Polygon>, push) {
    geojson.properties ??= {};
    if (state.featureId === geojson.properties.id) {
        geojson.properties.active = MapboxDraw.constants.activeStates.ACTIVE;
        push(geojson);

        let supplementaryPoints;
        if (geojson.properties.user_isCircle) {
            supplementaryPoints = createSupplementaryPointsForCircle(geojson);
        } else {
            supplementaryPoints = MapboxDraw.lib.createSupplementaryPoints(geojson, {
                map: this.map,
                midpoints: true,
                selectedPaths: state.selectedCoordPaths
            });
        }
        supplementaryPoints.forEach(push);
    } else {
        geojson.properties.active = MapboxDraw.constants.activeStates.INACTIVE;
        push(geojson);
    }
    this.fireActionable(state);

};

export default directModeOverride;

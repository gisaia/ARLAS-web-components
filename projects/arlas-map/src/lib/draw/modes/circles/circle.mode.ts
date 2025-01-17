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


export const circleMode = { ...MapboxDraw.modes.draw_polygon };
const DEFAULT_RADIUS_IN_KM = 2;

circleMode.onSetup = function (opts) {
    const polygon = this.newFeature({
        type: MapboxDraw.constants.geojsonTypes.FEATURE,
        properties: {
            isFixedRadius: opts.isFixedRadius !== undefined ? opts.isFixedRadius : false,
            isCircle: true,
            center: opts.center !== undefined ? opts.center : []
        },
        geometry: {
            type: MapboxDraw.constants.geojsonTypes.POLYGON,
            coordinates: [[]]
        }
    });

    this.addFeature(polygon);

    this.clearSelectedFeatures();
    MapboxDraw.lib.doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: MapboxDraw.constants.cursors.ADD });
    this.activateUIButton(MapboxDraw.constants.types.POLYGON);
    this.setActionableState({
        trash: true
    });

    return {
        initialRadiusInKm: opts.initialRadiusInKm || DEFAULT_RADIUS_IN_KM,
        steps: opts.steps || 64,
        units: opts.units || 'kilometers',
        polygon,
        currentVertexPosition: 0
    };
};


circleMode.clickAnywhere = function (state, e) {
    if (state.currentVertexPosition === 0) {
        state.currentVertexPosition++;
        const center = [e.lngLat.lng, e.lngLat.lat];
        const options =  {steps: state.steps, units: state.units};
        const circleFeature = circle(center, state.initialRadiusInKm, options);
        state.polygon.incomingCoords(circleFeature.geometry.coordinates);
        state.polygon.properties.center = center;
        state.polygon.properties.radiusInKm = state.initialRadiusInKm;
    }
    return this.changeMode(MapboxDraw.constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
};

export default circleMode;

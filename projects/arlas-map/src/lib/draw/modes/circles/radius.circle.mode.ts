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
import length from '@turf/length';
import numeral from 'numeral';
import { displayFeatures, updateCoordinates } from '../utils';

export const radiusCircleMode = { ...MapboxDraw.modes.draw_line_string };


radiusCircleMode.fireOnStop = function () {
    this.map.fire('draw.onStop', 'draw end');
  };


function getDisplayMeasurements(feature) {
    // should log both metric and standard display strings for the current drawn feature

    // metric calculation
    const drawnLength = length(feature) * 1000; // meters

    let metricUnits = 'm';
    let metricFormat = '0,0';
    let metricMeasurement;

    let standardUnits = 'feet';
    let standardFormat = '0,0';
    let standardMeasurement;

    metricMeasurement = drawnLength;
    if (drawnLength >= 1000) {
        // if over 1000 meters, upgrade metric
        metricMeasurement = drawnLength / 1000;
        metricUnits = 'km';
        metricFormat = '0.00';
    }

    standardMeasurement = drawnLength * 3.28084;
    if (standardMeasurement >= 5280) {
        // if over 5280 feet, upgrade standard
        standardMeasurement /= 5280;
        standardUnits = 'mi';
        standardFormat = '0.00';
    }

    const displayMeasurements = {
        metric: `${numeral(metricMeasurement).format(metricFormat)} ${metricUnits}`,
        standard: `${numeral(standardMeasurement).format(
            standardFormat
        )} ${standardUnits}`,
    };

    return displayMeasurements;
}

const doubleClickZoom = {
    enable: (ctx) => {
        setTimeout(() => {
            // First check we've got a map and some context.
            if (
                !ctx.map ||
                !ctx.map.doubleClickZoom ||
                !ctx._ctx ||
                !ctx._ctx.store ||
                !ctx._ctx.store.getInitialConfigValue
            ) {
                return;
            }
            // Now check initial state wasn't false (we leave it disabled if so)
            if (!ctx._ctx.store.getInitialConfigValue('doubleClickZoom')) {
                return;
            }
            ctx.map.doubleClickZoom.enable();
        }, 0);
    },
};
radiusCircleMode.onSetup = function (opts) {
    const props = MapboxDraw.modes.draw_line_string.onSetup.call(this, opts);
    const polygon = this.newFeature({
        type: MapboxDraw.constants.geojsonTypes.FEATURE,
        properties: {
            meta: 'radius',
            isFixedRadius: opts.isFixedRadius !== undefined ? opts.isFixedRadius : false,
            isCircle: true,
            center: opts.center !== undefined ? opts.center : []
        },
        geometry: {
            type: MapboxDraw.constants.geojsonTypes.POLYGON,
            coordinates: [[]],
        },
    });
    this.addFeature(polygon);


    return {
        ...props,
        circle:polygon,
        steps: opts.steps || 64,
        units: opts.units || 'kilometers'
    };
};

radiusCircleMode.clickAnywhere = function (state, e) {
    // this ends the drawing after the user creates a second point, triggering this.onStop
    if (state.currentVertexPosition === 1) {
        state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
        return this.changeMode('simple_select', { featureIds: [state.line.id] });
    }
    this.updateUIClasses({ mouse: 'add' });
    state.line.updateCoordinate(
        state.currentVertexPosition,
        e.lngLat.lng,
        e.lngLat.lat
    );
    updateCoordinates(state, e);
    return null;
};

radiusCircleMode.onMouseMove = function (state, e) {
    MapboxDraw.modes.draw_line_string.onMouseMove.call(this, state, e);
    const geojson = state.line.toGeoJSON();
    const center = geojson.geometry.coordinates[0];
    const radiusInKm = length(geojson, { units: 'kilometers' });
    const options =  {steps: state.steps, units: state.units};
    const circleFeature = circle(center, radiusInKm, options);
    circleFeature.properties.parent = state.line.id;
    (circleFeature.properties as any).meta = 'radius';
    state.circle.setCoordinates(circleFeature.geometry.coordinates);
};

// creates the final geojson point feature with a radius property
// triggers draw.create
radiusCircleMode.onStop = function (state) {
    doubleClickZoom.enable(this);

    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.line.id) === undefined) {
        return;
    }

    // remove last added coordinate
    state.line.removeCoordinate('0');
    if (state.line.isValid()) {
        const geojson = state.line.toGeoJSON();
        this.deleteFeature([state.line.id], { silent: true });

        this.map.fire('draw.create', {
            features: [state.circle.toGeoJSON()],
        });
    } else {
        this.deleteFeature([state.line.id], { silent: true });
        this.changeMode('simple_select', {}, { silent: true });
    }
    this.fireOnStop();
};

radiusCircleMode.toDisplayFeatures = function (state, geojson, display) {
    displayFeatures(state, geojson, display);
    const displayMeasurements = getDisplayMeasurements(geojson);

    // create custom feature for the current pointer position
    const currentVertex = {
        type: 'Feature',
        properties: {
            meta: 'currentPosition',
            radiusMetric: displayMeasurements.metric,
            radiusStandard: displayMeasurements.standard,
            parent: state.line.id,
        },
        geometry: {
            type: 'Point',
            coordinates: geojson.geometry.coordinates[1],
        },
    };
    display(currentVertex);

    return null;
};

export default radiusCircleMode;

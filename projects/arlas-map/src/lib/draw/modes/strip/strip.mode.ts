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
import distance from '@turf/distance';
import { bearingToAzimuth, point, polygon } from '@turf/helpers';
import length from '@turf/length';
import midpoint from '@turf/midpoint';
import rhumbBearing from '@turf/rhumb-bearing';
import rhumbDestination from '@turf/rhumb-destination';
import transformRotate from '@turf/transform-rotate';
import transformTranslate from '@turf/transform-translate';
import { displayFeatures, updateCoordinates } from '../utils';

export const stripMode = { ...MapboxDraw.modes.draw_line_string };

export function rotateStrip(start, end, state, currentMaxBearing = 0, options: any = {}) {
    const properties = options.properties ? options.properties : {};
    const startPoint = point(start);
    const endPoint = point(end);
    const bearing = rhumbBearing(startPoint, endPoint);
    const rotatedPoly = transformRotate(state.strip, bearing - currentMaxBearing, { pivot: start });
    state.currentMaxBearing = bearing;
    return polygon(rotatedPoly.coordinates, properties);
}

export function buildStrip(start, end, halfSwath, options: any = {}) {
    const properties = options.properties ? options.properties : {};
    // main
    const coordinates = [];
    const startPoint = point(start);
    const endPoint = point(end);
    // build polygone
    const bearing = rhumbBearing(startPoint, endPoint);
    const corner1 = rhumbDestination(startPoint, halfSwath, bearing - 90);
    const corner2 = rhumbDestination(startPoint, halfSwath, bearing + 90);
    const corner3 = rhumbDestination(endPoint, halfSwath, bearing + 90);
    const corner4 = rhumbDestination(endPoint, halfSwath, bearing - 90);
    coordinates.push(corner1.geometry.coordinates);
    coordinates.push(corner2.geometry.coordinates);
    coordinates.push(corner3.geometry.coordinates);
    coordinates.push(corner4.geometry.coordinates);
    coordinates.push(coordinates[0]);
    properties.start = start;
    properties.end = end;
    return polygon([coordinates], properties);
}

export function computeStripProperties(coordinates) {
    const properties = new Map();

    // Compute bearing
    const bearingAngle = rhumbBearing(point(coordinates[0]), point(coordinates[3]));
    properties['bearingAngle'] = bearingToAzimuth(bearingAngle);

    // Compute origin
    properties['origin'] = midpoint(point(coordinates[0]), point(coordinates[1])).geometry.coordinates;

    // Compute length
    properties['length'] = distance(point(coordinates[1]), point(coordinates[2]), { units: 'kilometers' });

    return properties;
}

const doubleClickZoom = {
    enable: (ctx) => {
        setTimeout(() => {
            // First check we've got a map and some context.
            if (
                !ctx.map?.doubleClickZoom ||
                !ctx._ctx?.store?.getInitialConfigValue
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
stripMode.onSetup = function (opts) {
    const halfSwath = opts.halfSwath;
    const maxLength = opts.maxLength;

    if (!halfSwath) {
        throw new Error('You must provide a valid halfSwath to enter strip_direct mode');
    }
    if (!maxLength) {
        throw new Error('You must provide a valid maxLength to enter strip_direct mode');
    }
    const props = MapboxDraw.modes.draw_line_string.onSetup.call(this, opts);
    const polygon = this.newFeature({
        type: MapboxDraw.constants.geojsonTypes.FEATURE,
        properties: {
            meta: 'strip',
            isCircle: false,
            isStrip: true,
            halfSwath: opts.halfSwath,
            maxLength: opts.maxLength,
            bearingAngle: 0

        },
        geometry: {
            type: MapboxDraw.constants.geojsonTypes.POLYGON,
            coordinates: [[]],
        },
    });
    this.addFeature(polygon);


    return {
        ...props,
        strip: polygon,
        halfSwath,
        maxLength,
        meta: 'strip'
    };
};

stripMode.clickAnywhere = function (state, e) {
    // this ends the drawing after the user creates a second point, triggering this.onStop
    if (state.currentVertexPosition === 1) {
        state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
        return this.changeMode('simple_select', {
            featureIds: [state.line.id]
        });
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

stripMode.onMouseMove = function (state, e) {
    if (state.currentVertexPosition === 1) {
        MapboxDraw.modes.draw_line_string.onMouseMove.call(this, state, e);
        const geojson = state.line.toGeoJSON();
        const stripLength = length(geojson, { units: 'kilometers' });
        const start = geojson.geometry.coordinates[0];
        const end = [e.lngLat.lng, e.lngLat.lat];
        const startPoint = point(start);
        const endPoint = point(end);
        const bearing = rhumbBearing(startPoint, endPoint);
        if (stripLength > state.maxLength && state.isStripDrew === undefined) {
            const translateDistance = -(stripLength - state.maxLength);
            const translatedPoint = transformTranslate(endPoint, translateDistance, bearing);
            const stripFeature = buildStrip(start, translatedPoint.geometry.coordinates, state.halfSwath);
            stripFeature.properties.parent = state.line.id;
            stripFeature.properties.meta = 'strip';
            state.strip.setCoordinates(stripFeature.geometry.coordinates);
            state.currentMaxBearing = bearing;
            state.isStripDrew = true;
            Object.assign(state.strip.properties, computeStripProperties(stripFeature.geometry.coordinates[0]));
        } else if (stripLength <= state.maxLength || state.isStripDrew === undefined) {
            const stripFeature = buildStrip(start, end, state.halfSwath);
            stripFeature.properties.parent = state.line.id;
            stripFeature.properties.meta = 'strip';
            state.strip.setCoordinates(stripFeature.geometry.coordinates);
            state.currentMaxBearing = bearing;
            state.isStripDrew = true;
            Object.assign(state.strip.properties, computeStripProperties(stripFeature.geometry.coordinates[0]));
        } else if (state.isStripDrew && stripLength > state.maxLength) {
            const stripFeature = rotateStrip(start, end, state, state.currentMaxBearing);
            stripFeature.properties.parent = state.line.id;
            stripFeature.properties.meta = 'strip';
            state.strip.setCoordinates(stripFeature.geometry.coordinates);
            Object.assign(state.strip.properties, computeStripProperties(stripFeature.geometry.coordinates[0]));
        }
    }
};

// creates the final geojson point feature with a radius property
// triggers draw.create
stripMode.onStop = function (state) {
    doubleClickZoom.enable(this);

    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.line.id) === undefined) {
        return;
    }

    // remove last added coordinate
    state.line.removeCoordinate('0');
    if (state.line.isValid()) {
        this.deleteFeature([state.line.id], { silent: true });

        this.map.fire('draw.create', {
            features: [state.strip.toGeoJSON()],
        });
    } else {
        this.deleteFeature([state.line.id], { silent: true });
        this.changeMode('simple_select', {}, { silent: true });
    }
};

stripMode.toDisplayFeatures = function (state, geojson, display) {
    displayFeatures(state, geojson, display);

    if (geojson.geometry.coordinates.length >= 2 && geojson.geometry.coordinates[1]) {
        // create custom feature for the current pointer position
        const currentVertex = {
            type: 'Feature',
            properties: {
                meta: 'currentPosition',
                parent: state.line.id,
            },
            geometry: {
                type: 'Point',
                coordinates: geojson.geometry.coordinates[1],
            },
        };
        display(currentVertex);
    }

    return null;
};

export default stripMode;

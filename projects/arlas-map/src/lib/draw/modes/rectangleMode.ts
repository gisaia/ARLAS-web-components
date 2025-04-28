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

// Inspired by https://github.com/thegisdev/mapbox-gl-draw-rectangle-mode/tree/master
export const rectangleMode: any = { };

rectangleMode.onSetup = function() {
    const rectangle = this.newFeature({
        type: MapboxDraw.constants.geojsonTypes.FEATURE,
        properties: {
            source: 'bbox'
        },
        geometry: {
          type: MapboxDraw.constants.geojsonTypes.POLYGON,
          coordinates: [[]]
        }
    });
    this.addFeature(rectangle);

    this.clearSelectedFeatures();
    MapboxDraw.lib.doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: MapboxDraw.constants.cursors.ADD });
    this.activateUIButton(MapboxDraw.constants.types.POLYGON);
    this.setActionableState({
        trash: true
    });

    return {
        rectangle,
        currentVertexPosition: 0,
        start: []
    };
};

rectangleMode.onClick = function(state, e) {
    if (state.currentVertexPosition === 1
        && state.start[0] !== e.lngLat.lng
        && state.start[1] !== e.lngLat.lat
    ) {
        this.updateUIClasses({ mouse: MapboxDraw.constants.cursors.NONE });
        return this.changeMode('simple_select', { featuresId: state.rectangle.id });
    }
    state.start = [e.lngLat.lng, e.lngLat.lat];
    state.currentVertexPosition++;
};

rectangleMode.onMouseMove = function(state, e) {
    if (state.start?.length > 0) {
        const start = state.start;

        // The bbox needs to be oriented in a certain way to match the parsing in the contributors
        const west = Math.min(start[0], e.lngLat.lng);
        const north = Math.max(start[1], e.lngLat.lat);
        const east = Math.max(start[0], e.lngLat.lng);
        const south = Math.min(start[1], e.lngLat.lat);

        state.rectangle.updateCoordinate('0.0', east, south);
        state.rectangle.updateCoordinate('0.1', east, north);
        state.rectangle.updateCoordinate('0.2', west, north);
        state.rectangle.updateCoordinate('0.3', west, south);
    }
};

rectangleMode.toDisplayFeatures = function(state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActivePolygon ? 'true' : 'false';
    if (!isActivePolygon) {
        return display(geojson);
    }

    // Only render the rectangular polygon if it has the starting point
    if (state.start.length === 0) {
        return;
    }
    return display(geojson);
};

rectangleMode.fireOnStop = function () {
    this.map.fire('draw.onStop', 'draw end');
};

rectangleMode.onStop = function(state) {
    MapboxDraw.lib.doubleClickZoom.enable(this);
    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.rectangle.id) === undefined) {
        return;
    }

    // remove last added coordinate
    state.rectangle.removeCoordinate('0.4');
    if (state.rectangle.isValid()) {
        this.map.fire('draw.create', {
            features: [state.rectangle.toGeoJSON()],
        });
    } else {
        this.deleteFeature([state.rectangle.id], { silent: true });
        this.changeMode('simple_select', {featureIds: [state.rectangle.id]}, { silent: true });
    }

    this.fireOnStop();
};

rectangleMode.onTrash = function(state) {
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode('simple_select');
};

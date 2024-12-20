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
import * as jsts from 'jsts/dist/jsts.min';

export const limitVertexDirectSelectMode = MapboxDraw.modes.direct_select;
const reader = new jsts.io.GeoJSONReader();

limitVertexDirectSelectMode.fireInvalidGeom = function (feature) {
  this.map.fire('draw.invalidGeometry', {
    action: 'error',
    features: [feature]
  });
};

limitVertexDirectSelectMode.fireInitialFeature = function (feature) {
  this.map.fire('draw.edit.saveInitialFeature', {
    feature: feature
  });
};

limitVertexDirectSelectMode.toDisplayFeatures = function (state, geojson, push) {
  if (state.featureId === geojson.properties.id) {
    geojson.properties.active = MapboxDraw.constants.activeStates.ACTIVE;
    push(geojson);
    MapboxDraw.lib.createSupplementaryPoints(geojson, {
      map: this.map,
      midpoints: geojson.geometry.coordinates[0].length >= state.maxVertexByPolygon + 1 ? false : true,
      selectedPaths: state.selectedCoordPaths
    }).forEach(push);
  } else {
    geojson.properties.active = MapboxDraw.constants.activeStates.INACTIVE;
    push(geojson);
  }
  this.fireActionable(state);
};

limitVertexDirectSelectMode.onTouchEnd = limitVertexDirectSelectMode.onMouseUp = function (state) {
  if (state.dragMoving) {
    const featureCoords = [...state.feature.coordinates[0]];
    if (
      featureCoords[0][0] !== featureCoords[featureCoords.length - 1][0] ||
      featureCoords[0][1] !== featureCoords[featureCoords.length - 1][1]
    ) {
      featureCoords.push(featureCoords[0]);
    }
    const currentFeature = {
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [featureCoords]
      }
    };
    const g = reader.read(currentFeature);
    if (!g.geometry.isValid()) {
      this.fireInvalidGeom(currentFeature);
    } else {
      this.fireUpdate();
    }
  }
  this.stopDragging(state);
};


limitVertexDirectSelectMode.onSetup = function (opts) {
  const featureId = opts.featureId;
  let maxVertexByPolygon = opts.maxVertexByPolygon;
  const feature = this.getFeature(featureId);
  this.fireInitialFeature(feature);
  if (!feature) {
    throw new Error('You must provide a featureId to enter direct_select mode');
  }

  if (!maxVertexByPolygon) {
    maxVertexByPolygon = 100;
  }

  if (feature.type === MapboxDraw.constants.geojsonTypes.POINT) {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  const state = {
    featureId,
    feature,
    dragMoveLocation: opts.startPos || null,
    dragMoving: false,
    canDragMove: false,
    selectedCoordPaths: opts.coordPath ? [opts.coordPath] : [],
    maxVertexByPolygon
  };

  this.setSelectedCoordinates(this.pathsToCoordinates(featureId, state.selectedCoordPaths));
  this.setSelected(featureId);
  MapboxDraw.lib.doubleClickZoom.disable(this);

  this.setActionableState({
    trash: true
  });

  return state;
};

export default limitVertexDirectSelectMode;

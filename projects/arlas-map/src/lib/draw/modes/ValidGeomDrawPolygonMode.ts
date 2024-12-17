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

export const validGeomDrawPolygonMode = MapboxDraw.modes.draw_polygon;
const reader = new jsts.io.GeoJSONReader();

validGeomDrawPolygonMode.fireInvalidGeom = function (feature) {
  this.map.fire('draw.invalidGeometry', {
    action: 'error',
    features: [feature]
  });
};

validGeomDrawPolygonMode.fireOnClick = function () {
  this.map.fire('draw.onClick', 'point drawn');
};

validGeomDrawPolygonMode.fireOnStop = function () {
  this.map.fire('draw.onStop', 'draw end');
};

validGeomDrawPolygonMode.clickOnVertex = function (state) {
  console.log(MapboxDraw.constants.modes.STATIC);
  return this.changeMode(MapboxDraw.constants.modes.STATIC, {});
};

validGeomDrawPolygonMode.onTap = validGeomDrawPolygonMode.onClick = function (state, e) {
  if (MapboxDraw.lib.CommonSelectors.isVertex(e)) {
    return this.clickOnVertex(state, e);
  } else {
    this.fireOnClick();
    return this.clickAnywhere(state, e);
  }
};

validGeomDrawPolygonMode.onStop = function (state) {
  this.fireOnStop();
  this.updateUIClasses({ mouse: MapboxDraw.constants.cursors.NONE });
  MapboxDraw.lib.doubleClickZoom.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.polygon.id) === undefined) {
    return;
  }

  // remove last added coordinate
  state.polygon.removeCoordinate(`0.${state.currentVertexPosition}`);
  if (state.polygon.isValid()) {

    const featureCoords = [...state.polygon.coordinates[0]];
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
      this.fireInvalidGeom(state.polygon);
      this.deleteFeature([state.polygon.id], { silent: true });
    } else {
      this.map.fire(MapboxDraw.constants.events.CREATE, {
        features: [state.polygon.toGeoJSON()]
      });
    }
  } else {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(MapboxDraw.constants.modes.STATIC, {}, { silent: true });
  }
};

export default validGeomDrawPolygonMode;

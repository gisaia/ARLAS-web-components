import DirectSelect from '@mapbox/mapbox-gl-draw/src/modes/direct_select';
import createSupplementaryPoints from '@mapbox/mapbox-gl-draw/src/lib/create_supplementary_points';
import doubleClickZoom from '@mapbox/mapbox-gl-draw/src/lib/double_click_zoom';
import { activeStates, geojsonTypes } from '@mapbox/mapbox-gl-draw/src/constants';
import * as jsts from 'jsts/dist/jsts.min';

const limitVertexDirectSelectMode = DirectSelect;
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
    geojson.properties.active = activeStates.ACTIVE;
    push(geojson);
    createSupplementaryPoints(geojson, {
      map: this.map,
      midpoints: geojson.geometry.coordinates[0].length >= state.maxVertexByPolygon + 1 ? false : true,
      selectedPaths: state.selectedCoordPaths
    }).forEach(push);
  } else {
    geojson.properties.active = activeStates.INACTIVE;
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

  if (feature.type === geojsonTypes.POINT) {
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
  doubleClickZoom.disable(this);

  this.setActionableState({
    trash: true
  });

  return state;
};

export default limitVertexDirectSelectMode;

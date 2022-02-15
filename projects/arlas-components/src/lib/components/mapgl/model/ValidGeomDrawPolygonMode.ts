import DrawPolygon from '@mapbox/mapbox-gl-draw/src/modes/draw_polygon';
import * as CommonSelectors from '@mapbox/mapbox-gl-draw/src/lib/common_selectors';
import doubleClickZoom from '@mapbox/mapbox-gl-draw/src/lib/double_click_zoom';
import { modes, cursors, events } from '@mapbox/mapbox-gl-draw/src/constants';
import * as jsts from 'jsts/dist/jsts.min';

const validGeomDrawPolygonMode = DrawPolygon;
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
  return this.changeMode(modes.STATIC, {});
};

validGeomDrawPolygonMode.onTap = validGeomDrawPolygonMode.onClick = function (state, e) {
  if (CommonSelectors.isVertex(e)) {
    return this.clickOnVertex(state, e);
  } else {
    this.fireOnClick();
    return this.clickAnywhere(state, e);
  }
};

validGeomDrawPolygonMode.onStop = function (state) {
  this.fireOnStop();
  this.updateUIClasses({ mouse: cursors.NONE });
  doubleClickZoom.enable(this);
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
      this.map.fire(events.CREATE, {
        features: [state.polygon.toGeoJSON()]
      });
    }
  } else {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(modes.STATIC, {}, { silent: true });
  }
};

export default validGeomDrawPolygonMode;

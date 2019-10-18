import DrawPolygon from '@gisaia-team/mapbox-gl-draw/src/modes/draw_polygon';
import doubleClickZoom from '@gisaia-team/mapbox-gl-draw/src/lib/double_click_zoom';
import Constants from '@gisaia-team/mapbox-gl-draw/src/constants';
import * as jsts from 'jsts/dist/jsts';

const ValidGeomDrawPolygonMode = DrawPolygon;
const reader = new jsts.io.GeoJSONReader();

ValidGeomDrawPolygonMode.fireInvalidGeom = function (feature) {
  this.map.fire('draw.invalidGeometry', {
    action: 'error',
    features: [feature]
  });
};

ValidGeomDrawPolygonMode.onStop = function (state) {
  this.updateUIClasses({ mouse: Constants.cursors.NONE });
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
      this.map.fire(Constants.events.CREATE, {
        features: [state.polygon.toGeoJSON()]
      });
    }
  } else {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT, {}, { silent: true });
  }
};

export default ValidGeomDrawPolygonMode;

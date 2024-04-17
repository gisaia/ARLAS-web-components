import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { createSupplementaryPointsForCircle } from './circles/utils';


const simpleSelectModeOverride = MapboxDraw.modes.simple_select;

simpleSelectModeOverride.dragMove = function (state, e) {
    // Dragging when drag move is enabled
    state.dragMoving = true;
    e.originalEvent.stopPropagation();

    const delta = {
        lng: e.lngLat.lng - state.dragMoveLocation.lng,
        lat: e.lngLat.lat - state.dragMoveLocation.lat
    };

    MapboxDraw.lib.moveFeatures(this.getSelected(), delta);

    this.getSelected()
        .filter(feature => feature.properties.isCircle)
        .map(circle => circle.properties.center)
        .forEach(center => {
            center[0] += delta.lng;
            center[1] += delta.lat;
        });

    state.dragMoveLocation = e.lngLat;
};

simpleSelectModeOverride.toDisplayFeatures = function (state, geojson, display) {
    geojson.properties.active = (this.isSelected(geojson.properties.id)) ?
        MapboxDraw.constants.activeStates.ACTIVE : MapboxDraw.constants.activeStates.INACTIVE;
    display(geojson);
    this.fireActionable();
    if (geojson.properties.active !== MapboxDraw.constants.activeStates.ACTIVE ||
        geojson.geometry.type === MapboxDraw.constants.geojsonTypes.POINT) {
        return;
    }
    const supplementaryPoints = geojson.properties.user_isCircle ?
        createSupplementaryPointsForCircle(geojson) : MapboxDraw.lib.createSupplementaryPoints(geojson);
    supplementaryPoints.forEach(display);
};


export default simpleSelectModeOverride;

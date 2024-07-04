
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import circle from '@turf/circle';


const circleMode = { ...MapboxDraw.modes.draw_polygon };
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

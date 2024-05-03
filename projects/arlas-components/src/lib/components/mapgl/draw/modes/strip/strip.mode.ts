
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { polygon, point } from '@turf/helpers';
import rhumbDestination from '@turf/rhumb-destination';
import rhumbBearing from '@turf/rhumb-bearing';
import length from '@turf/length';
import transformRotate from '@turf/transform-rotate';

const stripMode = { ...MapboxDraw.modes.draw_line_string };

function createVertex(parentId, coordinates, path, selected) {
    return {
        type: 'Feature',
        properties: {
            meta: 'vertex',
            parent: parentId,
            coord_path: path,
            active: selected ? 'true' : 'false',
        },
        geometry: {
            type: 'Point',
            coordinates,
        },
    };
}

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
    if (state.direction === 'forward') {
        state.currentVertexPosition += 1; // eslint-disable-line
        state.line.updateCoordinate(
            state.currentVertexPosition,
            e.lngLat.lng,
            e.lngLat.lat
        );
    } else {
        state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    }

    return null;
};

stripMode.onMouseMove = function (state, e) {
    MapboxDraw.modes.draw_line_string.onMouseMove.call(this, state, e);
    const geojson = state.line.toGeoJSON();
    const stripLenght = length(geojson, { units: 'kilometers' });
    const start = geojson.geometry.coordinates[0];
    const end = [e.lngLat.lng, e.lngLat.lat];
    if (stripLenght <= state.maxLength) {
        const stripFeature = buildStrip(start, end, state.halfSwath);
        stripFeature.properties.parent = state.line.id;
        (stripFeature.properties as any).meta = 'strip';
        state.strip.setCoordinates(stripFeature.geometry.coordinates);
        const startPoint = point(start);
        const endPoint = point(end);
        const bearing = rhumbBearing(startPoint, endPoint);
        state.currentMaxBearing = bearing;
        state.strip.properties['bearingAngle'] = bearing;
    } else {
        const stripFeature = rotateStrip(start, end, state, state.currentMaxBearing);
        stripFeature.properties.parent = state.line.id;
        (stripFeature.properties as any).meta = 'strip';
        state.strip.setCoordinates(stripFeature.geometry.coordinates);
        state.strip.properties['bearingAngle'] = state.currentMaxBearing;
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
        const geojson = state.line.toGeoJSON();
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
    const isActiveLine = geojson.properties.id === state.line.id;
    geojson.properties.active = isActiveLine ? 'true' : 'false';
    if (!isActiveLine) {
        if (!geojson.geometry.coordinates[0][0]) {
            return null;
        }
        return display(geojson);
    }

    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) {
        return null;
    }
    geojson.properties.meta = 'feature';

    // displays center vertex as a point feature
    display(
        createVertex(
            state.line.id,
            geojson.geometry.coordinates[
            state.direction === 'forward'
                ? geojson.geometry.coordinates.length - 2
                : 1
            ],
            `${state.direction === 'forward'
                ? geojson.geometry.coordinates.length - 2
                : 1
            }`,
            false
        )
    );

    // displays the line as it is drawn
    display(geojson);

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

    return null;
};

export default stripMode;

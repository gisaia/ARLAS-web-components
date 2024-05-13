import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { bearingToAzimuth, point } from '@turf/helpers';
import center from '@turf/center';
import midpoint from '@turf/midpoint';
import distance from '@turf/distance';
import rhumbDestination from '@turf/rhumb-destination';

import transformRotate from '@turf/transform-rotate';
import rhumbBearing from '@turf/rhumb-bearing';
import { buildStrip } from './strip.mode';

export const stripDirectSelectMode: any = {};


stripDirectSelectMode.onSetup = function (opts) {
    const featureId = opts.featureId;
    const halfSwath = opts.halfSwath;
    const maxLength = opts.maxLength;
    const feature = this.getFeature(featureId);

    if (!featureId) {
        throw new Error('You must provide a valid featureId to enter strip_direct mode');
    }
    if (!halfSwath) {
        throw new Error('You must provide a valid halfSwath to enter strip_direct mode');
    }
    if (!maxLength) {
        throw new Error('You must provide a valid maxLength to enter strip_direct mode');
    }

    if (feature.type !== MapboxDraw.constants.geojsonTypes.POLYGON) {
        throw new TypeError('strip_direct mode can only handle polygons');
    }
    if (feature.coordinates === undefined
        || feature.coordinates.length !== 1
        || feature.coordinates[0].length <= 2) {
        throw new TypeError('strip_direct mode can only handle polygons');
    }

    const state = {
        featureId,
        feature,
        halfSwath,
        maxLength,
        resizePointRadius: opts.resizePointRadius !== undefined ? opts.resizePointRadius : 1,
        rotationPointRadius: opts.rotationPointRadius !== undefined ? opts.rotationPointRadius : 1.0,
        canSelectFeatures: opts.canSelectFeatures !== undefined ? opts.canSelectFeatures : true,
        dragMoveLocation: opts.startPos || null,
        dragMoving: false,
        canDragMove: false,
        selectedCoordPaths: opts.coordPath ? [opts.coordPath] : []
    };

    this.setSelectedCoordinates(this.pathsToCoordinates(featureId, state.selectedCoordPaths));
    this.setSelected(featureId);
    MapboxDraw.lib.doubleClickZoom.disable(this);
    this.setActionableState({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: true
    });
    return state;
};

stripDirectSelectMode.toDisplayFeatures = function (state, geojson, push) {
    if (state.featureId === geojson.properties.id) {
        geojson.properties.active = MapboxDraw.constants.activeStates.ACTIVE;
        push(geojson);
        const suppPoints = MapboxDraw.lib.createSupplementaryPoints(geojson, {
            map: this.map,
            midpoints: false,
            selectedPaths: state.selectedCoordPaths
        });
        const actionsPoints = this.createActionPoints(state, geojson, suppPoints);
        actionsPoints.forEach(push);
    } else {
        geojson.properties.active = MapboxDraw.constants.activeStates.INACTIVE;
        push(geojson);
    }

    this.setActionableState({
        combineFeatures: false,
        uncombineFeatures: false,
        trash: true
    });

};

stripDirectSelectMode.onStop = function () {
    MapboxDraw.lib.doubleClickZoom.enable(this);
    this.clearSelectedCoordinates();
};

stripDirectSelectMode.pathsToCoordinates = function (featureId, paths) {
    return paths.map(coord_path => ({ feature_id: featureId, coord_path }));
};

stripDirectSelectMode._createActionPoint = function (actionWidgets, featureId, v1, v2, rotCenter, radiusScale, type) {
    const cR0 = midpoint(v1, v2).geometry.coordinates;
    const heading = rhumbBearing(rotCenter, cR0);
    const distance0 = distance(rotCenter, cR0);
    const distance1 = radiusScale * distance0;
    const cR1 = rhumbDestination(rotCenter, distance1, heading, {}).geometry.coordinates;

    actionWidgets.push({
        type: MapboxDraw.constants.geojsonTypes.FEATURE,
        properties: {
            meta: MapboxDraw.constants.meta.MIDPOINT,
            actionType: type,
            parent: featureId,
            lng: cR1[0],
            lat: cR1[1],
            coord_path: v1.properties.coord_path,
            coord_path_coords: cR0,
            heading: heading,
        },
        geometry: {
            type: MapboxDraw.constants.geojsonTypes.POINT,
            coordinates: cR1
        }
    }
    );
};

stripDirectSelectMode.createActionPoints = function (state, geojson, suppPoints) {
    const { type, coordinates } = geojson.geometry;
    const featureId = geojson.properties && geojson.properties.id;
    const actionWidgets = [];
    if (type !== MapboxDraw.constants.geojsonTypes.POLYGON) {
        return;
    }
    const corners = suppPoints.slice(0);
    corners[corners.length] = corners[0];
    let v1 = null;
    const rotCenter = this.computeCenter(state, geojson);
    corners.forEach((v2) => {
        if (v1 != null && (v1.properties.coord_path === '0.2')) {
            this._createActionPoint(actionWidgets, featureId, v1, v2, rotCenter, state.rotationPointRadius, 'resize');
        }
        if (v1 != null && (v1.properties.coord_path === '0.0')) {
            this._createActionPoint(actionWidgets, featureId, v1, v2, rotCenter, state.rotationPointRadius, 'origin');
        }
        if (v1 != null && (v1.properties.coord_path === '0.3')) {
            this._createActionPoint(actionWidgets, featureId, v1, v2, rotCenter, state.rotationPointRadius, 'rotation');
        }
        v1 = v2;
    });
    state.actionWidgets = actionWidgets;
    return actionWidgets;
};

stripDirectSelectMode.startDragging = function (state, e) {
    this.map.dragPan.disable();
    state.canDragMove = true;
    state.dragMoveLocation = e.lngLat;
};

stripDirectSelectMode.stopDragging = function (state) {
    this.map.dragPan.enable();
    state.dragMoving = false;
    state.canDragMove = false;
    state.dragMoveLocation = null;
};

const isMidPoint = MapboxDraw.lib.CommonSelectors.isOfMetaType(MapboxDraw.constants.meta.MIDPOINT);

stripDirectSelectMode.onTouchStart = stripDirectSelectMode.onMouseDown = function (state, e) {
    if (isMidPoint(e)) {
        return this.onActivatePoint(state, e);
    }
    if (MapboxDraw.lib.CommonSelectors.isActiveFeature(e)) {
        return this.onFeature(state, e);
    }
};

const stripDirectMode = {
    Resize: 1,
    Rotate: 2
};

stripDirectSelectMode.onActivatePoint = function (state, e) {
    this.computeAxes(state, state.feature.toGeoJSON());
    this.startDragging(state, e);
    const about = e.featureTarget.properties;
    state.selectedCoordPaths = [about.coord_path];
    if (e.featureTarget.properties.actionType === 'rotation') {
        state.stripDirectMode = stripDirectMode.Rotate;
    } else if (e.featureTarget.properties.actionType === 'resize') {
        state.stripDirectMode = stripDirectMode.Resize;
    }
};

stripDirectSelectMode.onFeature = function (state, e) {
    state.selectedCoordPaths = [];
    this.startDragging(state, e);
};

stripDirectSelectMode.coordinateIndex = function (coordPaths) {
    if (coordPaths.length >= 1) {
        const parts = coordPaths[0].split('.');
        return parseInt(parts[parts.length - 1], 10);
    } else {
        return 0;
    }
};

stripDirectSelectMode.computeCenter = function (state, polygon) {
    const center0 = center(polygon);
    return center0;
};

stripDirectSelectMode.computeAxes = function (state, polygon) {
    const center = this.computeCenter(state, polygon);
    const corners = polygon.geometry.coordinates[0].slice(0);
    const n = corners.length - 1;
    const iHalf = Math.floor(n / 2);
    const rotateCenters = [];
    const headings = [];
    for (let i1 = 0; i1 < n; i1++) {
        let i0 = i1 - 1;
        if (i0 < 0) {
            i0 += n;
        }
        const c0 = corners[i0];
        const c1 = corners[i1];
        const rotPoint = midpoint(point(c0), point(c1));
        rotateCenters[i1] = center.geometry.coordinates;
        headings[i1] = rhumbBearing(center, rotPoint);
    }
    state.rotation = {
        feature0: polygon,  // initial feature state
        centers: rotateCenters,
        headings: headings, // rotation start heading for each point
    };
};

stripDirectSelectMode.onDrag = function (state, e) {
    if (state.canDragMove !== true) {
        return;
    }
    state.dragMoving = true;
    e.originalEvent.stopPropagation();

    const delta = {
        lng: e.lngLat.lng - state.dragMoveLocation.lng,
        lat: e.lngLat.lat - state.dragMoveLocation.lat
    };
    if (state.selectedCoordPaths.length > 0 && state.stripDirectMode) {
        switch (state.stripDirectMode) {
            case stripDirectMode.Rotate:
                this.dragRotatePoint(state, e, delta);
                break;
            case stripDirectMode.Resize:
                this.dragResizePoint(state, e, delta);
                break;
        }
    } else {
        this.dragFeature(state, e, delta);
    }


    state.dragMoveLocation = e.lngLat;
};

stripDirectSelectMode.dragRotatePoint = function (state, e, delta) {
    if (state.rotation === undefined || state.rotation == null) {
        console.error('state.rotation required');
        return;
    }
    const m1 = point([e.lngLat.lng, e.lngLat.lat]);
    const n = state.rotation.centers.length;
    const cIdx = (this.coordinateIndex(state.selectedCoordPaths) + 1) % n;
    const cCenter = state.rotation.centers[cIdx];
    const cp = point(cCenter);
    const heading1 = rhumbBearing(cp, m1);
    const heading0 = state.rotation.headings[cIdx];
    const rotateAngle = heading1 - heading0; // in degrees
    const rotatedFeature = transformRotate(state.rotation.feature0,
        rotateAngle,
        {
            pivot: cp,
            mutate: false,
        });
    state.start = undefined;
    state.feature.incomingCoords(rotatedFeature.geometry.coordinates);
    const bearingAngle = rhumbBearing(point(rotatedFeature.geometry.coordinates[0][0]), point(rotatedFeature.geometry.coordinates[0][3]));
    state.feature.properties['bearingAngle'] = bearingToAzimuth(bearingAngle);
    this.fireUpdate();
};


stripDirectSelectMode.dragResizePoint = function (state, e, delta) {
    const end = [e.lngLat.lng, e.lngLat.lat];
    let start;
    if (!state.selectedResizePaths) {
        state.selectedResizePaths = state.selectedCoordPaths[0];
    }
    if (!state.start || state.selectedResizePaths !== state.selectedCoordPaths[0]) {
        if (state.selectedCoordPaths[0] === '0.0') {
            start = state.actionWidgets.find(a => a.properties.coord_path === '0.2').properties.coord_path_coords;
        } else {
            start = state.actionWidgets.find(a => a.properties.coord_path === '0.0').properties.coord_path_coords;
        }
        state.start = start;
    }
    const dist = distance(point(state.start), point(end), { units: 'kilometers' });
    const newPolygon = buildStrip(state.start, end, state.halfSwath);
    if (dist <= state.maxLength) {
        state.feature.setCoordinates(newPolygon.geometry.coordinates);
        this.fireUpdate();
    }
};



stripDirectSelectMode.dragFeature = function (state, e, delta) {
    MapboxDraw.lib.moveFeatures(this.getSelected(), delta);
    state.dragMoveLocation = e.lngLat;
    state.start = undefined;
    this.fireUpdate();
};

stripDirectSelectMode.fireUpdate = function () {
    this.map.fire(MapboxDraw.constants.events.UPDATE, {
        action: MapboxDraw.constants.updateActions.CHANGE_COORDINATES,
        features: this.getSelected().map(f => f.toGeoJSON())
    });
};

stripDirectSelectMode.onMouseOut = function (state) {
    // As soon as you mouse leaves the canvas, update the feature
    if (state.dragMoving) {
        this.fireUpdate();
    }
};

stripDirectSelectMode.onTouchEnd = stripDirectSelectMode.onMouseUp = function (state) {
    if (state.dragMoving) {
        this.fireUpdate();
    }
    this.stopDragging(state);
};

stripDirectSelectMode.clickActiveFeature = function (state) {
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    state.feature.changed();
};

stripDirectSelectMode.onClick = function (state, e) {
    if (MapboxDraw.lib.CommonSelectors.noTarget(e)) {
        return this.clickNoTarget(state, e);
    }
    if (MapboxDraw.lib.CommonSelectors.isActiveFeature(e)) {
        return this.clickActiveFeature(state, e);
    }
    if (MapboxDraw.lib.CommonSelectors.isInactiveFeature(e)) {
        return this.clickInactive(state, e);
    }
    this.stopDragging(state);
};

stripDirectSelectMode.clickNoTarget = function (state, e) {
    if (state.canSelectFeatures) {
        this.changeMode(MapboxDraw.constants.modes.SIMPLE_SELECT);
    }
};

stripDirectSelectMode.clickInactive = function (state, e) {
    if (state.canSelectFeatures) {
        this.changeMode(MapboxDraw.constants.modes.SIMPLE_SELECT, {
            featureIds: [e.featureTarget.properties.id]
        });
    }
};

stripDirectSelectMode.onTrash = function () {
    this.deleteFeature(this.getSelectedIds());
};

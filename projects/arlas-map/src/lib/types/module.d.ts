// The MapboxDraw module is redclared here to have more leeway as to what can be in a DrawCustomMode when constructing our custom modes

// implements Maplibregl.Icontrol & Mapboxgl.IControl
declare class MapboxDraw {
    public static modes: MapboxDraw.Modes;
    public static constants: MapboxDraw.Constants;
    public static lib: MapboxDraw.Lib;

    public modes: Record<string, string>;

    public constructor(options: MapboxDraw.MapboxDrawOptions);
    public changeMode(mode: string, options: Record<string, any>);
    public set(fc: GeoJSON.FeatureCollection);
    public trash();
    public getAll(): GeoJSON.FeatureCollection;
    public get(id: string): GeoJSON.Feature | undefined;
    public add(feature: GeoJSON.Feature | GeoJSON.FeatureCollection);
    public setFeatureProperty(id: string, property: string, value: unknown);
    public getSelected(): GeoJSON.FeatureCollection;
    public onAdd(map);
    public onRemove(map);
    public delete(ids: string | string[]);
    public deleteAll();
    public combineFeatures();
    public uncombineFeatures();
    public getMode(): string;
    public getFeatureIdsAt(point: { x: number; y: number; });
    public getSelectedIds(): string[];
};

declare module MapboxDraw {
    type Coord = GeoJSON.Feature<GeoJSON.Point> | GeoJSON.Point | GeoJSON.Position;

    type DisplayedFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.LineString | GeoJSON.Point>;

    interface LngLat {
        lng: number;
        lat: number;
    }

    interface MapMouseEvent {
        lngLat: LngLat;
        featureTarget: GeoJSON.Feature;
        originalEvent: Event;
    }

    interface MapboxDrawOptions {
        styles: any;
        modes: Record<string, DrawCustomMode>;
        userProperties: boolean;
        displayControlsDefault: boolean;
        boxSelect: boolean;
        keybindings: boolean;
        controls: any;
    };

    interface DrawCustomMode<CustomModeState = any, CustomModeOptions = any> {
        /** Type is maplibregl.Map or mapboxgl.Map */
        map: unknown;

        // Click
        onClick?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent): void;
        clickAnywhere?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent): void;
        onTap?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent): void;
        onTouchStart?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent);
        onTouchEnd?(this: DrawCustomModeThis, state: CustomModeState);
        clickOnVertex?(this: DrawCustomModeThis, state: CustomModeState);

        // Mouse movement
        onMouseMove(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent): void;
        onMouseDown?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent);
        onMouseUp?(this: DrawCustomModeThis, state: CustomModeState);
        onMouseOut?(this: DrawCustomModeThis, state: CustomModeState);

        // Drag
        startDragging?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent);
        stopDragging?(this: DrawCustomModeThis, state: CustomModeState);
        onDrag?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent);
        dragMove?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent);
        dragRotatePoint?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent, delta: LngLat);
        dragResizePoint?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent, delta: number);
        dragFeature?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent, delta: LngLat);
        dragVertex?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent, delta: LngLat);
        // Display
        toDisplayFeatures?(this: DrawCustomModeThis, state: CustomModeState, geojson: DisplayedFeature,
            display: (geojson: DisplayedFeature) => void): void;

        // Fire event
        fireMessage?(this: DrawCustomModeThis, message: sring): void;
        fireOnStop?(this: DrawCustomModeThis): void;
        fireOnClick?(this: DrawCustomModeThis): void;
        fireUpdate(this: DrawCustomModeThis): void;
        fireInvalidGeom?(this: DrawCustomModeThis, feature: GeoJSON.Feature);
        fireInitialFeature?(this: DrawCustomModeThis, feature: GeoJSON.Feature);

        // Life cycle
        onSetup(this: DrawCustomModeThis, opts: CustomModeOptions);
        onTrash?(this: DrawCustomModeThis, state: CustomModeState): void;
        onStop?(this: DrawCustomModeThis, state: CustomModeState): void;

        // Special life cycle
        onActivatePoint?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent);
        onFeature?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent);

        // Utils
        newFeature?(this: DrawCustomModeThis, feature: { type: string; properties: Record<string, any>; geometry: GeoJSON.Geometry; });
        pathsToCoordinates?(this: DrawCustomModeThis, featureId: string, paths: string[]);
        createActionPointHelper?(this: DrawCustomModeThis, actionWidgets: GeoJSON.Feature[], featureId: string, v1: Coord, v2: Coord,
            rotCenter: Coord, radiusScale: number, type: string): void;
        createActionPoints?(this: DrawCustomModeThis, state: CustomModeState,
            geojson: GeoJSON.Feature<GeoJSON.Polygon>, suppPoints: GeoJSON.Feature<GeoJSON.Point>[]);
        computeAxes?(this: DrawCustomModeThis, state: CustomModeState, polygon: GeoJSON.Feature<GeoJSON.Polygon>);
        coordinateIndex?(this: DrawCustomModeThis, coordPaths: string[]);
    }

    interface Modes {
        simple_select: DrawCustomMode;
        draw_polygon: DrawCustomMode;
        direct_select: DrawCustomMode;
        draw_line_string: DrawCustomMode;
    };

    interface Lib {
        CommonSelectors: {
            isActiveFeature: (e: MapMouseEvent) => boolean;
            isInactiveFeature: (e: MapMouseEvent) => boolean;
            isOfMetaType: (meta: string) => (e: MapMouseEvent) => boolean;
            noTarget: (e: MapMouseEvent) => boolean;
            isVertex: (e: MapMouseEvent) => boolean;
        };

        createSupplementaryPoints(
            geojson: GeoJSON.Feature,
            /** Type of map is maplibregl.Map or mapboxgl.Map */
            options?: { midpoints?: boolean; selectedPaths?: string[]; map: unknown; },
            basePath?: string,
        ): GeoJSON.Feature<GeoJSON.Point>[];

        createVertex(parentId: string, coordinates: number[], path: string, selected: boolean);

        doubleClickZoom: {
            disable: (mode: DrawCustomModeThis) => void;
            enable: (mode: DrawCustomModeThis) => void;
        };

        moveFeatures(features: GeoJSON.Feature[], delta: LngLat);

        constrainFeatureMovement(points: GeoJSON.Point[], delta: LngLat);
    }

    interface Constants {
        readonly activeStates: {
            ACTIVE: 'true';
            INACTIVE: 'false';
        };
        classes: {
            CANVAS: string;
            CONTROL_BASE: string;
            CONTROL_PREFIX: string;
            CONTROL_GROUP: string;
        };
        geojsonTypes: {
            FEATURE: 'Feature';
            POLYGON: 'Polygon';
            POINT: 'Point';
        };
        cursors: {
            ADD: 'add';
            NONE: 'none';
        };
        types: {
            POLYGON: 'polygon';
        };
        modes: {
            SIMPLE_SELECT: 'simple_select';
            STATIC: 'static';
        };
        meta: {
            MIDPOINT: 'midpoint';
        };
        events: {
            UPDATE: 'draw.update';
            CREATE: 'draw.create';
        };
        updateActions: {
            CHANGE_COORDINATES: 'change_coordinates';
        };
    }
};

declare module '@mapbox/mapbox-gl-draw' {
    export = MapboxDraw;
};

declare module '@mapbox/mapbox-gl-draw-static-mode';

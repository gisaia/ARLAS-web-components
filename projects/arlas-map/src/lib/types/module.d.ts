// Type declaration has mapbox-gl as a dependency
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/mapbox__mapbox-gl-draw/index.d.ts

type Coord = Feature<Point> | Point | Position;

interface MapMouseEvent extends Event {
    lngLat: { lng: number; lat: number; };
    featureTarget: GeoJSON.Feature;
}

// implements Maplibregl.Icontrol & Mapboxgl.IControl
declare class MapboxDraw {
    public static modes: MapboxDraw.Modes;
    public static constants: MapboxDraw.Constants;
    public static lib: MapboxDraw.Lib;

    public constructor(options: MapboxDraw.MapboxDrawOptions);
    public changeMode(mode: 'direct_select', options: { featureId: string; });
    public changeMode(mode: string);
    public set(fc: GeoJSON.FeatureCollection);
    public trash();
    public getAll(): GeoJSON.FeatureCollection;
    public get(id: string): GeoJSON.Feature | undefined;
    public add(feature: GeoJSON.Feature);
    public setFeatureProperty(id: string, property: string, value: unknown);
    public getSelected(): GeoJSON.FeatureCollection;
};

declare module MapboxDraw {
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
        onClick?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent): void;
        onTrash?(this: DrawCustomModeThis, state: CustomModeState): void;
        fireMessage?(this: DrawCustomModeThis, message: sring): void;
        toDisplayFeatures?(
            this: DrawCustomModeThis,
            state: CustomModeState,
            geojson: GeoJSON,
            display: (geojson: GeoJSON) => void,
        ): void;
        newFeature?(this: DrawCustomModeThis, feature: { type: string; properties: Record<string, any>; geometry: GeoJSON.Geometry; });
        onSetup(this: DrawCustomModeThis, opts: Record<string, unknown>);
        clickAnywhere?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent): void;
        onMouseMove(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent): void;
        onStop?(this: DrawCustomModeThis, state: CustomModeState): void;
        fireOnStop?(this: DrawCustomModeThis): void;
        pathsToCoordinates?(this: DrawCustomModeThis, featureId: string, paths: string[]);
        createActionPointHelper?(this: DrawCustomModeThis, actionWidgets: GeoJSON.Feature[], featureId: string, v1: Coord, v2: Coord,
            rotCenter: Coord, radiusScale: number, type: string): void;
        createActionPoints?(this: DrawCustomModeThis, state: CustomModeState,
            geojson: GeoJSON.Feature<GeoJSON.Polygon>, suppPoints: Coord[]);
        startDragging?(this: DrawCustomModeThis, state: CustomModeState, e: MapMouseEvent);
        stopDragging?(this: DrawCustomModeThis, state: CustomModeState);
        fireUpdate(this: DrawCustomModeThis);
        /** Type is maplibregl.Map or mapboxgl.Map */
        map: unknown;
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
            isOfMetaType: (meta: string) => (type: string) => boolean;
            noTarget: (e: MapMouseEvent) => boolean;
        };

        createSupplementaryPoints(
            geojson: GeoJSON.Feature,
            options?: { midpoints?: boolean; selectedPaths?: string[]; },
            basePath?: string,
        ): GeoJSON.Feature<GeoJSON.Point>[];

        createVertex(parentId: string, coordinates: number[], path: string, selected: boolean);

        doubleClickZoom: {
            disable: (mode: DrawCustomModeThis) => void;
            enable: (mode: DrawCustomModeThis) => void;
        };
    }

    interface Constants {
        readonly activeStates: {
            ACTIVE: 'true';
            INACTIVE: 'false';
        };
        classes: {
            CANVAS: string;
        };
        geojsonTypes: {
            FEATURE: 'Feature';
            POLYGON: 'Polygon';
            POINT: 'Point';
        };
        cursors: {
            ADD: 'add';
        };
        types: {
            POLYGON: 'polygon';
        };
        modes: {
            SIMPLE_SELECT: 'simple_select';
        };
        meta: {
            MIDPOINT: 'midpoint';
        };
        events: {
            UPDATE: 'draw.update';
        };
        updateActions: {
            CHANGE_COORDINATES: 'change_coordinates';
        };
    }
};

declare module '@mapbox/mapbox-gl-draw' {
    export = MapboxDraw;
};

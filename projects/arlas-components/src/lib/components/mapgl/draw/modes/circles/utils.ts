import MapboxDraw from '@mapbox/mapbox-gl-draw';

export function createSupplementaryPointsForCircle(geojson) {
    const { properties, geometry } = geojson;

    if (!properties.user_isCircle) {
        return null;
    }

    const supplementaryPoints = [];
    const vertices = geometry.coordinates[0].slice(0, -1);
    for (let index = 0; index < vertices.length; index += Math.round((vertices.length / 4))) {
        supplementaryPoints.push(MapboxDraw.lib.createVertex(properties.id, vertices[index], `0.${index}`, false));
    }
    return supplementaryPoints;
}

export const dragPan = {
    enable(ctx) {
        setTimeout(() => {
            // First check we've got a map and some context.
            if (!ctx.map || !ctx.map.dragPan || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) {
                return;
            }
            // Now check initial state wasn't false (we leave it disabled if so)
            if (!ctx._ctx.store.getInitialConfigValue('dragPan')) {
                return;
            }
            ctx.map.dragPan.enable();
        }, 0);
    },

    disable(ctx) {
        setTimeout(() => {
            if (!ctx.map || !ctx.map.doubleClickZoom) {
                return;
            }
            // Always disable here, as it's necessary in some cases.
            ctx.map.dragPan.disable();
        }, 0);
    }
};


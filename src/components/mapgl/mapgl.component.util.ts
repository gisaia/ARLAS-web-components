import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
export function paddedBounds(npad: number, spad: number, epad: number,
    wpad: number, map: mapboxgl.Map, SW, NE) {
    const topRight = map.project(NE);
    const bottomLeft = map.project(SW);
    const scale = Math.pow(2, map.getZoom());
    const SWtopoint = map.project(SW);
    const SWpoint = new mapboxgl.Point(((SWtopoint.x - bottomLeft.x) * scale) - wpad, ((SWtopoint.y - topRight.y) * scale) + spad);
    const SWworld = new mapboxgl.Point(SWpoint.x / scale + bottomLeft.x, SWpoint.y / scale + topRight.y);
    const swWorld = map.unproject(SWworld);
    const NEtopoint = map.project(NE);
    const NEpoint = new mapboxgl.Point(((NEtopoint.x - bottomLeft.x) * scale) + epad, ((NEtopoint.y - topRight.y) * scale) - npad);
    const NEworld = new mapboxgl.Point(NEpoint.x / scale + bottomLeft.x, NEpoint.y / scale + topRight.y);
    const neWorld = map.unproject(NEworld);
    return [swWorld, neWorld];
}




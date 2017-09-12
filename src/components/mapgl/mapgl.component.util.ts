import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
export function paddedBounds(npad: number, spad: number, epad: number,
    wpad: number, map: mapboxgl.Map, SW, NE) {
    var topRight = map.project(NE);
    var bottomLeft = map.project(SW);
    var scale = Math.pow(2, map.getZoom());
    var SWtopoint = map.project(SW);
    var SWpoint = new mapboxgl.Point(((SWtopoint.x - bottomLeft.x) * scale) - wpad, ((SWtopoint.y - topRight.y) * scale) + spad);
    var SWworld = new mapboxgl.Point(SWpoint.x / scale + bottomLeft.x, SWpoint.y / scale + topRight.y);
    var swWorld = map.unproject(SWworld);
    var NEtopoint = map.project(NE);
    var NEpoint = new mapboxgl.Point(((NEtopoint.x - bottomLeft.x) * scale) + epad, ((NEtopoint.y - topRight.y) * scale) - npad);
    var NEworld = new mapboxgl.Point(NEpoint.x / scale + bottomLeft.x, NEpoint.y / scale + topRight.y);
    var neWorld = map.unproject(NEworld);
    return [swWorld,neWorld];
}
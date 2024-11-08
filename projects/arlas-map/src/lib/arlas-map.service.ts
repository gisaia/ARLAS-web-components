import { Injectable } from '@angular/core';
import { AbstractArlasMapGL, MapConfig, LngLat } from './map/AbstractArlasMapGL';
import { AbstractDraw } from './draw/AbstractDraw';

@Injectable({
  providedIn: 'root'
})
export abstract class ArlasMapService {

  constructor() { }


  public abstract getInitTransformRequest(): Function;

  public abstract hasCrossOrDrawLayer(e, map: AbstractArlasMapGL): boolean;

  public abstract createMap(config: MapConfig<unknown>): AbstractArlasMapGL;

  public abstract createDraw(drawOptions, enabled: boolean, map: AbstractArlasMapGL): AbstractDraw;

  public abstract getLngLatBound(c1: LngLat, c2: LngLat): any;

  public abstract boundsToString(bounds: any): string;

  public abstract updateMapStyle(map: AbstractArlasMapGL, l: any, ids: Array<string | number>, sourceName: string): void;

  public getVisibleIdsFilter(map: AbstractArlasMapGL, layer: any, ids: Array<string | number>) {
    const lFilter = map.layersMap.get(layer).filter;
    const filters = [];
    if (lFilter) {
      lFilter.forEach(f => {
        filters.push(f);
      });
    }
    if (filters.length === 0) {
      filters.push('all');
    }
    filters.push([
      'match',
      ['get', 'id'],
      Array.from(new Set(ids)),
      true,
      false
    ]);
    return filters;
  }
  /** Binds custom interaction of : 'mouseleave' and 'mouseenter' events
   *  to all draw layers 
  */
  public getCustomEventsToDrawLayers(map: AbstractArlasMapGL) {
    const drawPolygonLayers = [
      'gl-draw-polygon-stroke-inactive',
      'gl-draw-polygon-stroke-active',
      'gl-draw-polygon-stroke-static'
    ].map(layer => ['.cold', '.hot']
      .map(id => layer.concat(id)))
      .reduce((p, ac) => ac.concat(p), []);
    console.log('awili')
    return [
      {
        layers: drawPolygonLayers,
        mapEventBinds:
          [{
            event: 'mousemove',
            fn: (e) => {
              map.setCursorStyle('pointer');
            }
          }
          ],
      },
      {
        layers: drawPolygonLayers,
        mapEventBinds: [
          {
            event: 'mouseleave',
            fn: (e) => {
              map.setCursorStyle('');
            }
          }
        ]
      },
    ]
  }

  public abstract getPointFromScreen(e, container: HTMLElement);

  


}

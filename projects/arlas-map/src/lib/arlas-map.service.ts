import { Injectable } from '@angular/core';
import { AbstractArlasMapGL, MapConfig } from './map/AbstractArlasMapGL';
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

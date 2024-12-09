import { Injectable } from '@angular/core';
import { AbstractArlasMapGL, MapConfig } from './map/AbstractArlasMapGL';
import { AbstractDraw } from './draw/AbstractDraw';
import { LngLat } from './map/model/map';
import { FeatureCollection } from '@turf/helpers';
import { VectorStyle } from './map/model/vector-style';

@Injectable({
  providedIn: 'root'
})
export abstract class ArlasMapService {

  constructor() { }

  public abstract getInitTransformRequest(): Function;

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

  /** Sets `data` to a Geojson `source` of the map
   * @param source A Geojson source
   * @param data A feature collection object.
   */
  public abstract setDataToGeojsonSource(source: any, data: FeatureCollection<GeoJSON.Geometry>);

  public abstract addImage(name: string, url: string, map: AbstractArlasMapGL, errorMessage: string, opt?: any);

  /**
   * Checks if the given layer is already added to the map instance
   * @param map Map instance
   * @param layer layer identifier
   */
  public abstract hasLayer(map: AbstractArlasMapGL, layer: any);
  /** */
  public abstract setSource(sourceId: string, source: any, options: any);
  public abstract addLayer(map: AbstractArlasMapGL, layer: any);
  public abstract removeLayer(map: AbstractArlasMapGL, layer: any);
  public abstract removeSource(map: AbstractArlasMapGL, layer: any);
  public abstract createPopup(lng: number, lat: number, message: string);
  public abstract addPopup(map: AbstractArlasMapGL, popup: any);
  public abstract removePopup(map: AbstractArlasMapGL, popup: any);
  public abstract removeLayers(map: AbstractArlasMapGL, layers: any)
  public abstract removeLayersFromPattern(map: AbstractArlasMapGL, layersIdPattern: string);
  public abstract hasLayersFromPattern(map: AbstractArlasMapGL, layersIdPattern: string);
  public abstract setMapCursor(map: AbstractArlasMapGL, cursor: string): void;

  public abstract addIconLayer(map: AbstractArlasMapGL, layerId: string, iconName: string,
    iconSize: number, data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>);
  public abstract addRasterLayer(map: AbstractArlasMapGL, layerId: string, url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number, beforeId?: string): void;

  public abstract addGeojsonLayer(map: AbstractArlasMapGL, layerId: string, style: VectorStyle,
    data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>
  ): void;

  public abstract createGeojsonSource(data: GeoJSON.GeoJSON): any;
  public abstract createRasterSource(url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number): any;

    public abstract onLayerEvent(eventName: any, map: AbstractArlasMapGL, layer: any, fn: () => void);
    public abstract onMapEvent(eventName: any, map: AbstractArlasMapGL, fn: (e) => void);

}

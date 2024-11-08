import { Injectable } from '@angular/core';
import { ArlasMapService, CROSS_LAYER_PREFIX, LngLat } from 'arlas-map';
import { LngLatBounds, Point } from 'mapbox-gl';
import { ArlasMapboxConfig, ArlasMapboxGL } from './map/ArlasMapboxGL';
import { ArlasDraw } from './draw/ArlasDraw';
import { ArlasAnyLayer } from './map/model/layers';

@Injectable()
export class ArlasMapboxService extends ArlasMapService {
  

  constructor() {
    super();
  }

  public getInitTransformRequest(): Function {
    return (url: string, resourceType: mapboxgl.ResourceType) => ({
      url,
    });
  }

  public hasCrossOrDrawLayer(e: any, map: ArlasMapboxGL): boolean {
    const features = map.queryRenderedFeatures(e.point);
    return (!!features && !!features.find(f => f.layer.id.startsWith(CROSS_LAYER_PREFIX)))
  }

  public createMap(config: ArlasMapboxConfig): ArlasMapboxGL {
    return new ArlasMapboxGL(config);
  }

  public createDraw(drawOptions: any, enabled: boolean, map: ArlasMapboxGL): ArlasDraw {
    return new ArlasDraw(drawOptions, enabled, map);
  }

  public getPointFromScreen(e, container: HTMLElement): Point {
    const rect = container.getBoundingClientRect();
    return new Point(
      e.clientX - rect.left - container.clientLeft,
      e.clientY - rect.top - container.clientTop
    );
  };

  public getLngLatBound(c1: LngLat, c2: LngLat): LngLatBounds {
    return new LngLatBounds(c1, c2);
  }
  public boundsToString(bounds: LngLatBounds): string {
    throw bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
  }

  public updateMapStyle(map: ArlasMapboxGL, l: any, ids: Array<string | number>, sourceName: string): void {
    const layer = map.getLayer(l) as ArlasAnyLayer;
    if (!!layer && typeof (layer.source) === 'string' && layer.source.indexOf(sourceName) >= 0) {
      if (ids && ids.length > 0) {
        // Tests value in camel and kebab case due to an unknown issue on other projects
        if (layer.metadata.isScrollableLayer || layer.metadata['is-scrollable-layer']) {
          map.setFilter(l, this.getVisibleIdsFilter(map, l, ids));
          const strokeLayerId = l.replace('_id:', '-fill_stroke-');
          const strokeLayer = map.getLayer(strokeLayerId);
          if (!!strokeLayer) {
            map.setFilter(strokeLayerId, this.getVisibleIdsFilter(map, strokeLayerId, ids));
          }
        }
      } else {
        map.setFilter(l, map.layersMap.get(l).filter);
        const strokeLayerId = l.replace('_id:', '-fill_stroke-');
        const strokeLayer = map.getLayer(strokeLayerId);
        if (!!strokeLayer) {
          map.setFilter(strokeLayerId,
            map.layersMap.get(strokeLayerId).filter);
        }
      }
    }
  }
}

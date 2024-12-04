import { Injectable } from '@angular/core';
import { ArlasMapService, CROSS_LAYER_PREFIX } from 'arlas-map';
import { GeoJSONSource, LngLatBounds, Point, ResourceType, TypedStyleLayer } from 'maplibre-gl';
import { ArlasMaplibreConfig, ArlasMaplibreGL } from './map/ArlasMaplibreGL';
import { ArlasDraw } from './draw/ArlasDraw';
import { LngLat } from 'arlas-map';
import { LayerMetadata } from 'arlas-map';
import { FeatureCollection } from '@turf/helpers';

@Injectable()
export class ArlasMaplibreService extends ArlasMapService {

  public constructor() {
    super();
  }

  public getInitTransformRequest(): Function {
    return (url: string, resourceType: ResourceType) => ({
      url,
    });
  }

  public createMap(config: ArlasMaplibreConfig): ArlasMaplibreGL {
    return new ArlasMaplibreGL(config);
  }

  public createDraw(drawOptions: any, enabled: boolean, map: ArlasMaplibreGL): ArlasDraw {
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
    return bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
  }

  public updateMapStyle(map: ArlasMaplibreGL, l: any, ids: Array<string | number>, sourceName: string): void {
    const layer = map.getLayer(l) as TypedStyleLayer;
    if (!!layer && typeof (layer.source) === 'string' && layer.source.indexOf(sourceName) >= 0) {
      if (ids && ids.length > 0) {
        // Tests value in camel and kebab case due to an unknown issue on other projects
        if ((layer.metadata as LayerMetadata).isScrollableLayer || layer.metadata['is-scrollable-layer']) {
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

  public setDataToGeojsonSource(source: GeoJSONSource, data: FeatureCollection<GeoJSON.Geometry>) {
    source.setData(data);
  };

}

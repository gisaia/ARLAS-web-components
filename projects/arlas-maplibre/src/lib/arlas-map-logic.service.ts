import { Injectable } from '@angular/core';
import { ArlasMapFunctionalService } from 'arlas-map';
import { ArlasMaplibreService } from './arlas-maplibre.service';
import { FeatureCollection } from '@turf/helpers';
import { ArlasMaplibreGL } from './map/ArlasMaplibreGL';
import { ArlasMapSource } from 'arlas-map';
import { MaplibreSourceType } from './map/model/sources';
import { ExpressionSpecification, FilterSpecification, GeoJSONSourceSpecification, TypedStyleLayer } from 'maplibre-gl';
import { MapLayers } from 'arlas-map';
import { LayerMetadata } from 'arlas-map';
import { VisualisationSetConfig } from 'arlas-map';

@Injectable({
  providedIn: 'root'
})
export class MapLogicService extends ArlasMapFunctionalService{
  public dataSources: GeoJSONSourceSpecification[] = [];
  public layersMap: Map<string, TypedStyleLayer>;
  public constructor(public mapService: ArlasMaplibreService) { 
    super(mapService);
  }

  /** Add to map the sources that will host ARLAS data.  */
  public declareArlasDataSources(dataSourcesIds: Set<string>, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMaplibreGL) {
    super.declareArlasDataSources(dataSourcesIds, data, map);
  }

  public declareLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMaplibreGL) {
    super.declareLabelSources(labelSourceId, data, map);
  }

  public updateLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMaplibreGL) {
    super.updateLabelSources(labelSourceId, data, map);
  }

  public declareBasemapSources(basemapSources: Array<ArlasMapSource<MaplibreSourceType>>, map: ArlasMaplibreGL) {
    super.declareBasemapSources(basemapSources, map);
  }

  public setLayersMap(mapLayers: MapLayers<TypedStyleLayer>, layers?: Array<TypedStyleLayer>) {
    if (mapLayers) {
      const mapLayersCopy = mapLayers;
      if (layers) {
        mapLayersCopy.layers = mapLayersCopy.layers.concat(layers);
      }
      const layersMap = new Map();
      mapLayersCopy.layers.forEach(layer => layersMap.set(layer.id, layer));
      this.layersMap = layersMap;
    }
  }

  public initMapLayers(mapLayers: MapLayers<TypedStyleLayer>, map: ArlasMaplibreGL) {
   super.initMapLayers(mapLayers, map);
  }

  public updateMapStyle(map: ArlasMaplibreGL, l: any, ids: Array<string | number>, sourceName: string): void {
    const layer = this.mapService.getLayer(map, l) as TypedStyleLayer;
    if (!!layer && typeof (layer.source) === 'string' && layer.source.indexOf(sourceName) >= 0) {
      if (ids && ids.length > 0) {
        // Tests value in camel and kebab case due to an unknown issue on other projects
        if ((layer.metadata as LayerMetadata).isScrollableLayer || layer.metadata['is-scrollable-layer']) {
          map.setFilter(l, this.getVisibleIdsFilter(l, ids));
          const strokeLayerId = l.replace('_id:', '-fill_stroke-');
          const strokeLayer = this.mapService.getLayer(map, strokeLayerId);
          if (!!strokeLayer) {
            map.setFilter(strokeLayerId, this.getVisibleIdsFilter(strokeLayerId, ids));
          }
        }
      } else {
        map.setFilter(l, map.layersMap.get(l).filter);
        const strokeLayerId = l.replace('_id:', '-fill_stroke-');
        const strokeLayer = this.mapService.getLayer(map, strokeLayerId);
        if (!!strokeLayer) {
          map.setFilter(strokeLayerId,
            map.layersMap.get(strokeLayerId).filter);
        }
      }
    }
  }

  public getVisibleIdsFilter(layer: any, ids: Array<string | number>): ExpressionSpecification[] {
    const lFilter = this.layersMap.get(layer).filter as ExpressionSpecification;
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

  public addVisualisation(visualisation: VisualisationSetConfig, visualisations: VisualisationSetConfig[], layers: Array<any>,
    sources: Array<ArlasMapSource<MaplibreSourceType>>, mapLayers: MapLayers<TypedStyleLayer>, map: ArlasMaplibreGL): void {
    sources.forEach((s) => {
      if (typeof (s.source) !== 'string') {
        map.getMapProvider().addSource(s.id, s.source);
      }
    });
    visualisations.unshift(visualisation);
    this.visualisationsSets.visualisations.set(visualisation.name, new Set(visualisation.layers));
    this.visualisationsSets.status.set(visualisation.name, visualisation.enabled);
    layers.forEach(layer => {
      this.mapService.addLayer(map, layer);
    });
    this.setLayersMap(mapLayers as MapLayers<TypedStyleLayer>, layers);
    this.reorderLayers(visualisations, map);
  }
}
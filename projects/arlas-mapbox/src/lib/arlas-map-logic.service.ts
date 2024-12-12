/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Injectable } from '@angular/core';
import { MapLogicService as AbstractMapLogicService } from 'arlas-map';
import { ArlasMapboxService } from './arlas-mapbox.service';
import { FeatureCollection } from '@turf/helpers';
import { ArlasMapboxGL } from './map/ArlasMapboxGL';
import { ArlasMapSource } from 'arlas-map';
import { MapboxSourceType } from './map/model/sources';
import { MapLayers } from 'arlas-map';
import { LayerMetadata } from 'arlas-map';
import { Expression, GeoJSONSource } from 'mapbox-gl';
import { ArlasAnyLayer } from './map/model/layers';
import { VisualisationSetConfig } from 'arlas-map';

@Injectable({
  providedIn: 'root'
})
export class MapLogicService extends AbstractMapLogicService {
  public dataSources: GeoJSONSource[] = [];
  public layersMap: Map<string, ArlasAnyLayer>;
  public constructor(public mapService: ArlasMapboxService) {
    super(mapService);
  }

  /** Add to map the sources that will host ARLAS data.  */
  public declareArlasDataSources(dataSourcesIds: Set<string>, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMapboxGL) {
    super.declareArlasDataSources(dataSourcesIds, data, map);
  }

  public declareLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMapboxGL) {
    super.declareLabelSources(labelSourceId, data, map);
  }

  public updateLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMapboxGL) {
    super.updateLabelSources(labelSourceId, data, map);
  }

  public declareBasemapSources(basemapSources: Array<ArlasMapSource<MapboxSourceType>>, map: ArlasMapboxGL) {
    super.declareBasemapSources(basemapSources, map);
  }

  public setLayersMap(mapLayers: MapLayers<ArlasAnyLayer>, layers?: Array<ArlasAnyLayer>) {
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

  public initMapLayers(mapLayers: MapLayers<ArlasAnyLayer>, map: ArlasMapboxGL) {
   super.initMapLayers(mapLayers, map);
  }

  public updateMapStyle(map: ArlasMapboxGL, l: any, ids: Array<string | number>, sourceName: string): void {
    const layer = this.mapService.getLayer(map, l) as ArlasAnyLayer;
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

  public getVisibleIdsFilter(layer: any, ids: Array<string | number>): Expression[] {
    const lFilter = this.layersMap.get(layer).filter as Expression;
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
    sources: Array<ArlasMapSource<MapboxSourceType>>, mapLayers: MapLayers<ArlasAnyLayer>, map: ArlasMapboxGL): void {
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
    this.setLayersMap(mapLayers as MapLayers<ArlasAnyLayer>, layers);
    this.reorderLayers(visualisations, map);
  }
}

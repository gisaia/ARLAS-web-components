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
import { FeatureCollection } from '@turf/helpers';
import {
  AbstractArlasMapService, ARLAS_ID, ArlasDataLayer, ArlasMapSource,
  ExternalEvent, FILLSTROKE_LAYER_PREFIX, LayerMetadata, MapLayers,
  SCROLLABLE_ARLAS_ID, VisualisationSetConfig
} from 'arlas-map';
import {
  AddLayerObject, CanvasSourceSpecification, ExpressionSpecification,
  GeoJSONSource, GeoJSONSourceSpecification, LayerSpecification, MapOptions,
  RasterSourceSpecification, SourceSpecification, TypedStyleLayer
} from 'maplibre-gl';
import { ArlasMaplibreService } from './arlas-maplibre.service';
import { ArlasMaplibreGL } from './map/ArlasMaplibreGL';
import { MaplibreSourceType } from './map/model/sources';

@Injectable({
  providedIn: 'root'
})
export class ArlasMapService extends AbstractArlasMapService<TypedStyleLayer | AddLayerObject,
  MaplibreSourceType | GeoJSONSource | RasterSourceSpecification | SourceSpecification | CanvasSourceSpecification, MapOptions> {
  public layersMap: Map<string, ArlasDataLayer>;


  public dataSources: GeoJSONSourceSpecification[] = [];
  public constructor(public mapService: ArlasMaplibreService) {
    super(mapService);
  }

  /**
    * @description Declares the arlas data sources provided in configuration.
    * @param dataSourcesIds Identifiers of arlas data sources.
    * @param data A feature collection.
    * @param map Map instance.
    */
  public declareArlasDataSources(dataSourcesIds: Set<string>, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMaplibreGL) {
    if (dataSourcesIds) {
      dataSourcesIds.forEach(sourceId => {
        const source = this.mapFrameworkService.createGeojsonSource(data);
        this.dataSources.push(source as GeoJSONSourceSpecification);
        this.mapFrameworkService.setSource(sourceId, source, map);
      });
    }
  }

  /**
   * Declares label sources for draw layers.
   * @param labelSourceId Label source identifier.
   * @param data  A feature collection.
   * @param map Map instance.
   */
  public declareLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMaplibreGL) {
    if (labelSourceId) {
      const source = this.mapFrameworkService.createGeojsonSource(data);
      this.mapFrameworkService.setSource(labelSourceId, source, map);
    }
  }

  public updateLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: ArlasMaplibreGL) {
    super.updateLabelSources(labelSourceId, data, map);
  }

  /**
   * Declares basemap sources
   * @param basemapSources List of basemap sources.
   * @param map Map instance.
   */
  public declareBasemapSources(basemapSources: Array<ArlasMapSource<MaplibreSourceType>>, map: ArlasMaplibreGL) {
    // Add sources defined as input in mapSources;
    const mapSourcesMap = new Map<string, ArlasMapSource<any>>();
    if (basemapSources) {
      basemapSources.forEach(mapSource => {
        mapSourcesMap.set(mapSource.id, mapSource);
      });
      mapSourcesMap.forEach((mapSource, id) => {
        if (typeof (mapSource.source) !== 'string') {
          this.mapFrameworkService.setSource(id, mapSource.source, map);
        }
      });
    }
  }

  public setLayersMap(mapLayers: MapLayers<ArlasDataLayer>, layers?: Array<ArlasDataLayer>) {
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

  public initMapLayers(mapLayers: MapLayers<ArlasDataLayer>, map: ArlasMaplibreGL) {
    super.initMapLayers(mapLayers, map);
  }

  public applyRangeFilter(map: ArlasMaplibreGL, sources: string, field: string, start: number, end: number): void {
    const layers = this.mapFrameworkService.getLayersStartingWithSource(map, sources);
    layers.forEach(layer => {
      map.setFilter(layer.id, this.getRangeFilter(layer.id, field, start, end));
      const strokeLayerId = layer.id.replace('_id:', '-fill_stroke-');
      const strokeLayer = this.mapService.getLayer(map, strokeLayerId);
      if (strokeLayer) {
        map.setFilter(strokeLayerId, this.getRangeFilter(layer.id, field, start, end));
      }
    });
  }

  public removeFilter(map: ArlasMaplibreGL, sources: string): void {
    const layers = this.mapFrameworkService.getLayersStartingWithSource(map, sources);
    layers.forEach(layer => {
      map.setFilter(layer.id, this.layersMap.get(layer.id).filter);
      const strokeLayerId = layer.id.replace('_id:', '-fill_stroke-');
      const strokeLayer = this.mapService.getLayer(map, strokeLayerId);
      if (strokeLayer) {
        map.setFilter(strokeLayerId,
          this.layersMap.get(strokeLayerId).filter);
      }
    });
  }

  public getRangeFilter(layerId: any, field: string, start: number, end: number): ExpressionSpecification[] {
    const lFilter = this.layersMap.get(layerId).filter as ExpressionSpecification;
    const filters = [];
    if (lFilter) {
      lFilter.forEach(f => {
        filters.push(f);
      });
    }
    if (filters.length === 0) {
      filters.push('all');
    }
    filters.push(['<=', ['get', field], end], ['>=', ['get', field], start]);
    return filters;
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
        map.setFilter(l, this.layersMap.get(l).filter as ExpressionSpecification);
        const strokeLayerId = l.replace('_id:', '-fill_stroke-');
        const strokeLayer = this.mapService.getLayer(map, strokeLayerId);
        if (!!strokeLayer) {
          map.setFilter(strokeLayerId,
            this.layersMap.get(strokeLayerId).filter as ExpressionSpecification);
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

  public addVisualisation(visualisation: VisualisationSetConfig, visualisations: VisualisationSetConfig[], layers: Array<ArlasDataLayer>,
    sources: Array<ArlasMapSource<MaplibreSourceType>>, mapLayers: MapLayers<ArlasDataLayer>, map: ArlasMaplibreGL): void {
    sources.forEach((s) => {
      if (typeof (s.source) !== 'string') {
        map.getMapProvider().addSource(s.id, s.source);
      }
    });
    visualisations.unshift(visualisation);
    this.visualisationsSets.visualisations.set(visualisation.name, new Set(visualisation.layers));
    this.visualisationsSets.status.set(visualisation.name, visualisation.enabled);
    layers.forEach(layer => {
      this.mapService.addLayer(map, layer as LayerSpecification);
    });
    this.setLayersMap(mapLayers, layers);
    this.reorderLayers(visualisations, map);
  }

  protected reorderDrawLayers(map: ArlasMaplibreGL) {
    this.mapService.getLayersFromPattern(map, '.cold').forEach(l => this.mapService.moveLayer(map, l.id));
    this.mapService.getLayersFromPattern(map, '.hot').forEach(l => this.mapService.moveLayer(map, l.id));
  }

  /**
   * @override Maplibre implementation.
   * @description Moves the given layer to the top in map instance OR optionnaly before a layer.
   * This method handles any specific treatment when adding ARLAS data.
   * For instance, in mapbox implementation, moving a fill layer needs to move systematically the stroke layer.
   * @param map Map instance.
   * @param layer A layer. It could be a layer identifier OR a layer object (it will depend on the framwork implementation).
   * @param arlasDataLayers Map of ARLAS data layers and their ids (the ids being the key of the map).
   * @param beforeId Identifier of an already added layer. The layers of layersMap are added under this 'beforeId' layer.
   */

  public moveArlasDataLayer(map: ArlasMaplibreGL, layerId: string, arlasDataLayers: Map<string, ArlasDataLayer>, before?: string) {
    const layer = arlasDataLayers.get(layerId);
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollableLayer = arlasDataLayers.get(scrollableId);
    if (!!scrollableLayer && this.mapService.hasLayer(map, scrollableId)) {
      this.mapService.moveLayer(map, scrollableId);
    }
    if (!!this.mapService.hasLayer(map, layerId)) {
      this.mapService.moveLayer(map, layerId);
      if (layer.type === 'fill') {
        const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
        const strokeLayer = arlasDataLayers.get(strokeId);
        if (!!strokeLayer && this.mapService.hasLayer(map, strokeId)) {
          this.mapService.moveLayer(map, strokeId);
        }
        if (!!strokeLayer && !!strokeLayer.id) {
          const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + strokeLayer.id;
          const selectLayer = arlasDataLayers.get(selectId);
          if (!!selectLayer && this.mapService.hasLayer(map, selectId)) {
            this.mapService.moveLayer(map, selectId);
          }
          const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + strokeLayer.id;
          const hoverLayer = arlasDataLayers.get(hoverId);
          if (!!hoverLayer && this.mapService.hasLayer(map, hoverId)) {
            this.mapService.moveLayer(map, hoverId);
          }
        }
      }
    }
    const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + layer.id;
    const selectLayer = arlasDataLayers.get(selectId);
    if (!!selectLayer && this.mapService.hasLayer(map, selectId)) {
      this.mapService.moveLayer(map, selectId);
    }
    const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + layer.id;
    const hoverLayer = arlasDataLayers.get(hoverId);
    if (!!hoverLayer && this.mapService.hasLayer(map, hoverId)) {
      this.mapService.moveLayer(map, hoverId);
    }
  }

  /**
   * Add a layer to the map instance. This method handles any specific treatment when adding ARLAS data.
   * For instance, in maplibre implementation, adding a fill layer needs to add systematically the stroke layer.
   * @param map Map instance.
   * @param layer A layer. It could be a layer identifier OR a layer object (it will depend on the framwork implementation).
   * @param layersMap Map of ARLAS data layers and their ids (the ids being the key of the map).
   * @param beforeId Identifier of an already added layer. The layers of layersMap are added under this 'beforeId' layer.
   */
  public addArlasDataLayer(map: ArlasMaplibreGL, layer: ArlasDataLayer, arlasDataLayers: Map<string, ArlasDataLayer>, before?: string) {
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollableLayer = arlasDataLayers.get(scrollableId) as LayerSpecification;
    if (!!scrollableLayer) {
      this.mapService.addLayer(map, scrollableLayer, before);
    }
    this.mapService.addLayer(map, layer as LayerSpecification, before);
    /** add stroke layer if the layer is a fill */
    if (layer.type === 'fill') {
      const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
      const strokeLayer = arlasDataLayers.get(strokeId) as LayerSpecification;
      if (!!strokeLayer) {
        this.mapService.addLayer(map, strokeLayer, before);
      }
    }
  }


  public filterLayers(mapLayers: MapLayers<ArlasDataLayer>, map: ArlasMaplibreGL,
    visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
    collection?: string): void {
    if (mapLayers && mapLayers.externalEventLayers) {
      mapLayers.externalEventLayers.filter(layer => layer.on === visibilityEvent).forEach(layer => {
        if (this.mapService.hasLayer(map, layer.id)) {
          let originalLayerIsVisible = false;
          const fullLayer = this.layersMap.get(layer.id);
          const isCollectionCompatible = (!collection || (!!collection && (fullLayer.source as string).includes(collection)));
          if (isCollectionCompatible) {
            const originalLayerId = layer.id.replace('arlas-' + visibilityEvent.toString() + '-', '');
            const originalLayer = this.mapService.getAllLayers(map).find(l => l.id === originalLayerId);
            if (!!originalLayer) {
              originalLayerIsVisible = this.mapService.isLayerVisible(originalLayer as LayerSpecification);
            }
            const layerFilter: Array<any> = [];
            const externalEventLayer = this.layersMap.get(layer.id);
            if (!!externalEventLayer && !!externalEventLayer.filter) {
              (externalEventLayer.filter as ExpressionSpecification).forEach(f => {
                layerFilter.push(f);
              });
            }
            if (layerFilter.length === 0) {
              layerFilter.push('all');
            }
            if (visibilityCondition && originalLayerIsVisible) {
              layerFilter.push(visibilityFilter);
              this.mapService.filterGeojsonData(map, layer.id, layerFilter);
            } else {
              this.mapService.filterGeojsonData(map, layer.id, (layer as any).filter);
            }
            this.mapService.setLayerVisibility(layer.id, visibilityCondition && originalLayerIsVisible, map);
          }
        }
      });
    }
  }
}

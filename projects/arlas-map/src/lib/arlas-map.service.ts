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

import { inject, Injectable } from '@angular/core';
import { FeatureCollection } from '@turf/helpers';
import { ElementIdentifier } from 'arlas-web-components';
import { ArlasMapFrameworkService } from './arlas-map-framework.service';
import { AbstractArlasMapGL, OPACITY_SUFFIX } from './map/AbstractArlasMapGL';
import { ArlasDataLayer, ExternalEvent, MapLayers } from './map/model/layers';
import { ArlasMapSource } from './map/model/sources';
import { VisualisationSetConfig } from './map/model/visualisationsets';
import { getAdditionalFillLayers } from './map/tools';

/**
 * This service propose a set of method to execute the ArlasMapComponent logic.
 * Do not confuse with ArlasMapFrameworkService that is more dedicated to a framework logic.
 */
@Injectable({
  providedIn: 'root'
})
/** L: a layer class/interface.
 *  S: a source class/interface.
 *  M: a Map configuration class/interface.
 */
export abstract class AbstractArlasMapService<L, S, M> {
  /** @description List of arlas data sources declared in configuration */
  public dataSources: S[] = [];
  /** @description Map of ARLAS data layers and their ids (the ids being the key of the map).  */
  public layersMap: Map<string, ArlasDataLayer>;
  /**
   * @description Object to describe visualisation sets
   * - visulisations: a map of <visualisation name, set of layers identifiers>;
   * - status: a map of <visualisation name, visibility status>
   */
  public visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  } = {
      visualisations: new Map(),
      status: new Map()
    };

  protected readonly mapFrameworkService = inject(ArlasMapFrameworkService<L, S, M>);

  /**
   * @description Declares the arlas data sources provided in configuration.
   * @param dataSourcesIds Identifiers of arlas data sources.
   * @param data A feature collection.
   * @param map Map instance.
   */
  public abstract declareArlasDataSources(dataSourcesIds: Set<string>, data: FeatureCollection<GeoJSON.Geometry>, map: AbstractArlasMapGL): void;

  public abstract declareLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: AbstractArlasMapGL): void;

  /**
   * Declare a basemapsource
   * @param basemapSources
   * @param map
   */
  public declareBasemapSources(basemapSources: Array<ArlasMapSource<any>>, map: AbstractArlasMapGL){
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

  public setLayersMap(mapLayers: MapLayers<ArlasDataLayer>, layers?: Array<ArlasDataLayer>){
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

  public updateLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: AbstractArlasMapGL) {
    if (labelSourceId) {
      const source = this.mapFrameworkService.getSource(labelSourceId, map);
      this.mapFrameworkService.setDataToGeojsonSource(source, data);
    }
  }

  /**
   * @description Inits a map of visulisation sets from the configuration.
   * @param visualisationSetsConfig Visualisation set configuration.
   */
  public initVisualisationSet(visualisationSetsConfig: VisualisationSetConfig[]) {
    if (visualisationSetsConfig) {
      visualisationSetsConfig.forEach(visu => {
        this.visualisationsSets.visualisations.set(visu.name, new Set(visu.layers));
        this.visualisationsSets.status.set(visu.name, visu.enabled);
      });
    }
  }

  public initMapLayers(mapLayers: MapLayers<ArlasDataLayer>, map: AbstractArlasMapGL) {
    if (mapLayers) {
      this.setLayersMap(mapLayers);
    }
  }

  public abstract moveArlasDataLayer(map: AbstractArlasMapGL, layer: any, layersMap: Map<string, ArlasDataLayer>, beforeId?: string);

  /**
   * Add a layer to the map instance. This method handles any specific treatment when adding ARLAS data.
   * For instance, in mapbox and maplibre implementation, adding a fill layer needs to add systematically the stroke layer.
   * @param map Map instance.
   * @param layer A layer. It could be a layer identifier OR a layer object (it will depend on the framwork implementation).
   * @param layersMap Map of ARLAS data layers and their ids (the ids being the key of the map).
   * @param beforeId Identifier of an already added layer. The layers of layersMap are added under this 'beforeId' layer.
   */
  public abstract addArlasDataLayer(map: AbstractArlasMapGL, layer: ArlasDataLayer | string,
    layersMap: Map<string, ArlasDataLayer>, beforeId?: string);

  public addArlasDataLayers(visualisationSetsConfig: VisualisationSetConfig[], mapLayers: MapLayers<ArlasDataLayer>, map: AbstractArlasMapGL) {
    this.initMapLayers(mapLayers, map);
    this.initVisualisationSet(visualisationSetsConfig);
    for (let i = visualisationSetsConfig.length - 1; i >= 0; i--) {
      const visualisation: VisualisationSetConfig = visualisationSetsConfig[i];
      if (visualisation.layers) {
        for (let j = visualisation.layers.length - 1; j >= 0; j--) {
          const l = visualisation.layers[j];
          const layer = this.layersMap.get(l);
          this.addArlasDataLayer(map, layer, this.layersMap);
        }
      }
    }
    this._addExternalEventLayers(mapLayers, map);
    this.visualisationsSets.status.forEach((visible, vs) => {
      this.visualisationsSets.visualisations.get(vs).forEach(l => {
        this.mapFrameworkService.setLayerVisibility(l, visible, map);
      });
    });
    this.reorderLayers(visualisationSetsConfig, map);
  }

  private _addExternalEventLayers(mapLayers: MapLayers<ArlasDataLayer>, map: AbstractArlasMapGL) {
    if (mapLayers.externalEventLayers) {
      mapLayers.layers
        .filter(layer => mapLayers.externalEventLayers.map(e => e.id).includes(layer.id))
        .forEach(l => {
          this.mapFrameworkService.addLayer(map, l as L);
        });
    }
  }


  public reorderLayers(visualisationSetsConfig: VisualisationSetConfig[], map: AbstractArlasMapGL) {
    // parses the visulisation list from bottom in order to put the fist ones first
    for (let i = visualisationSetsConfig.length - 1; i >= 0; i--) {
      const visualisation: VisualisationSetConfig = visualisationSetsConfig[i];
      if (!!visualisation.layers && visualisation.enabled) {
        for (let j = visualisation.layers.length - 1; j >= 0; j--) {
          const l = visualisation.layers[j];
          this.moveArlasDataLayer(map, l, this.layersMap);
        }
      }
    }
    this.reorderDrawLayers(map);

  }

  protected abstract reorderDrawLayers(map: AbstractArlasMapGL);


  public abstract filterLayers(mapLayers: MapLayers<ArlasDataLayer>, map: AbstractArlasMapGL,
    visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
    collection?: string): void;

  public selectFeatures(mapLayers: MapLayers<ArlasDataLayer>, map: AbstractArlasMapGL, elementToSelect: Array<ElementIdentifier>) {
    if (elementToSelect) {
      const ids = elementToSelect.length > 0 ?
        elementToSelect.reduce((memo, element) => {
          memo.push(element.idValue);
          return memo;
        }, []) : [];
      const numericalIds = ids.filter(id => !Number.isNaN(+id)).map(id => +id);
      const visibilityFilter = ids.length > 0 ? ['in', ['get', elementToSelect[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
      this.filterLayers(mapLayers, map, (elementToSelect.length > 0), visibilityFilter, ExternalEvent.select);
    }
  }

  public highlightFeature(mapLayers: MapLayers<ArlasDataLayer>, map: AbstractArlasMapGL,
    featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; }) {
    if (featureToHightLight?.elementidentifier) {
      const ids: Array<number | string> = [featureToHightLight.elementidentifier.idValue];
      if (!Number.isNaN(+featureToHightLight.elementidentifier.idValue)) {
        ids.push(+featureToHightLight.elementidentifier.idValue);
      }
      const visibilityFilter = ['in', ['get', featureToHightLight.elementidentifier.idFieldName],
        ['literal', ids]];
      this.filterLayers(mapLayers, map, !featureToHightLight.isleaving, visibilityFilter, ExternalEvent.hover);
    }
  }

  public selectFeaturesByCollection(mapLayers: MapLayers<ArlasDataLayer>, map: AbstractArlasMapGL,
    features: Array<ElementIdentifier>, collection: string) {
    const ids: Array<number | string> = features.map(f => f.idValue);
    const numericalIds = ids.filter(id => !Number.isNaN(+id)).map(id => +id);
    const visibilityFilter = ids.length > 0 ? ['in', ['get', features[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
    this.filterLayers(mapLayers, map, (features.length > 0), visibilityFilter, ExternalEvent.select, collection);
  }


  public updateLayoutVisibility(visualisationName: string, visualisationSetsConfig: VisualisationSetConfig[], map: AbstractArlasMapGL) {
    const visuStatus = !this.visualisationsSets.status.get(visualisationName);
    visualisationSetsConfig.find(v => v.name === visualisationName).enabled = visuStatus;
    if (!visuStatus) {
      const layersSet = new Set(this.visualisationsSets.visualisations.get(visualisationName));
      this.visualisationsSets.visualisations.forEach((ls, v) => {
        if (v !== visualisationName) {
          ls.forEach(ll => {
            if (layersSet?.has(ll)) {
              layersSet.delete(ll);
            }
          });
        }
      });
      layersSet.forEach(ll => {
        this.mapFrameworkService.setLayerVisibility(ll, false, map);
      });
    }
    this.visualisationsSets.status.set(visualisationName, visuStatus);
    const layers = new Set<string>();
    this.visualisationsSets.visualisations.forEach((ls, v) => {
      if (this.visualisationsSets.status.get(v)) {
        ls.forEach(l => {
          layers.add(l);
          this.mapFrameworkService.setLayerVisibility(l, true, map);
        });
      }
    });
    return layers;
  }

  public updateVisibility(visibilityStatus: Map<string, boolean>, visualisationSetsConfig: VisualisationSetConfig[], map: AbstractArlasMapGL) {
    visibilityStatus.forEach((visibilityStatus, l) => {
      let layerInVisualisations = false;
      if (visibilityStatus) {
        let oneVisualisationEnabled = false;
        visualisationSetsConfig.forEach(v => {
          const ls = new Set(v.layers);
          if (!layerInVisualisations) {
            layerInVisualisations = ls.has(l);
          }
          if (ls.has(l) && v.enabled) {
            oneVisualisationEnabled = true;
            this.mapFrameworkService.setLayerVisibility(l, true, map);
          }
        });
        if (!oneVisualisationEnabled && layerInVisualisations) {
          this.mapFrameworkService.setLayerVisibility(l, false, map);
        }
      } else {
        visualisationSetsConfig.forEach(v => {
          const ls = new Set(v.layers);
          if (!layerInVisualisations) {
            layerInVisualisations = ls.has(l);
          }
        });
        if (layerInVisualisations) {
          this.mapFrameworkService.setLayerVisibility(l, false, map);
        }
      }
    });
  }


  public findVisualisationSetLayer(visuName: string, visualisationSetsConfig: VisualisationSetConfig[]) {
    return visualisationSetsConfig.find(v => v.name === visuName).layers;
  }
  public setVisualisationSetLayers(visuName: string, layers: string[], visualisationSetsConfig: VisualisationSetConfig[]) {
    const f = visualisationSetsConfig.find(v => v.name === visuName);
    if (f) {
      f.layers = layers;
    }
  }

  public abstract updateMapStyle(map: AbstractArlasMapGL, l: any, ids: Array<string | number>, sourceName: string): void;

  /**
   * Move an external layer
   * @param map
   * @param arlasDataLayers
   * @param additionalLayer
   * @param beforeId
   * @protected
   */
  protected moveExternalLayer(map: AbstractArlasMapGL, arlasDataLayers: Map<string, ArlasDataLayer>,
                              additionalLayer: ArlasDataLayer, beforeId?: string){
    const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + additionalLayer.id;
    this.moveLayerIfExist(map, arlasDataLayers, selectId,beforeId);
    const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + additionalLayer.id;
    this.moveLayerIfExist(map, arlasDataLayers, hoverId, beforeId);
  }

  /**
   * Move layer if exist
   * @param map
   * @param arlasDataLayers
   * @param selectId
   * @param beforeId
   * @protected
   */
  protected moveLayerIfExist(map: AbstractArlasMapGL, arlasDataLayers: Map<string, ArlasDataLayer>,
                             selectId: string, beforeId?: string){
    const selectLayer = arlasDataLayers.get(selectId);
    if (!!selectLayer && this.mapFrameworkService.hasLayer(map, selectId)) {
      this.mapFrameworkService.moveLayer(map, selectId, beforeId);
    }
  }

  /**
   * Get visible layer that match an id
   * @param layer
   * @param ids
   */
  public getVisibleIdsFilter(layer: any, ids: Array<string | number>) {
    const lFilter = this.layersMap.get(layer).filter as Array<unknown>;
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
  };

  /**
   * Applies an opacity style to map layers based on a specified range of field values.
   * This method iterates over all layers whose source IDs start with the given sourceIdPrefix
   * and adjusts the opacity of features within those layers. Features with field values
   * within the specified range (between start and end values) will have the insideOpacity
   * applied, while features with values outside this range will have the outsideOpacity applied.
   *
   * @param {AbstractArlasMapGL} map - The map instance on which the opacity style will be applied.
   * @param {string} sourceIdPrefix - The prefix used to identify source IDs of the layers to which the opacity style will be applied.
   * @param {string} field - The name of the field on which the range filter is applied.
   * @param {number} start - The start value of the range filter.
   * @param {number} end - The end value of the range filter.
   * @param {number} insideOpacity - The opacity value to apply to features with field values within the specified range.
   * @param {number} outsideOpacity - The opacity value to apply to features with field values outside the specified range.
   */
  public adjustOpacityByRange(map: AbstractArlasMapGL, sourceIdPrefix: string, field: string,
    start: number, end: number, insideOpacity: number, outsideOpacity: number) {
    const layers = this.mapFrameworkService.getLayersStartingWithSource(map, sourceIdPrefix);
    const style = this.getRangeStyle(field, start, end, insideOpacity, outsideOpacity);

    layers
      .filter(l => this.mapFrameworkService.isLayerVisible(l))
      .forEach(layer => {
        map.setLayerOpacity(layer.id, layer.type, style);
        if (layer.type === 'circle') {
          const circleStrokePrefix = layer.type + '-stroke';

          map.setLayerOpacity(layer.id, circleStrokePrefix, style);
        }
        const layersIds = getAdditionalFillLayers(layer.id);
        for (const id of layersIds) {
          const additionalLayer = this.mapFrameworkService.getLayer(map, id);
          if(additionalLayer){
            map.setLayerOpacity(id, additionalLayer.type, style);
          }
        }
      });
  };

  /**
   * Generates a style expression that applies different style values based on a specified range.
   *
   * @param {string} field - The name of the field to evaluate for the range condition.
   * @param {number} start - The start value of the range. Features with field values greater than or equal to this value are considered.
   * @param {number} end - The end value of the range. Features with field values less than or equal to this value are considered.
   * @param {number} inValue - The style value to apply if the field value is within the specified range.
   * @param {number} outValue - The style value to apply if the field value is outside the specified range.
   *
   * @returns {Type} A style expression that applies `inValue` or `outValue` based on the range condition.
   */
  protected getRangeStyle<T>(field: string, start: number, end: number, inValue: number, outValue: number): T {
    return [
      'case',
      ['all',
        ['>=', ['get', field], start],
        ['<=', ['get', field], end]
      ],
      inValue, // the style value if field is between 'start' and 'end'
      outValue // the style value otherwise
    ] as T;
  }

  /**
   * Resets the initial configured opacity style of the map layers whose source IDs start with the given sourceIdPrefix.
   *
   * @param {AbstractArlasMapGL} map - The map instance on which the opacity style will be applied.
   * @param {string} sourceIdPrefix - The prefix used to identify source IDs of the layers to which the opacity style will be applied.
   */
  public resetOpacity<T>(map: AbstractArlasMapGL, sourceIdPrefix: string) {
    const layers = this.mapFrameworkService.getLayersStartingWithSource(map, sourceIdPrefix);
    layers.forEach(layer => {
      const layerOpacity = this.layersMap?.get(layer.id)?.paint[map.layerTypeToPaintKeyword(layer.type) + OPACITY_SUFFIX] as T | number;
      map.setLayerOpacity(layer.id, layer.type, layerOpacity);
      if (layer.type === 'circle') {
        const circleStrokePrefix = layer.type + '-stroke';
        const circleStrokeOpacity = this.layersMap?.get(layer.id)?.paint[map.layerTypeToPaintKeyword(circleStrokePrefix)
        + OPACITY_SUFFIX] as T | number;
        map.setLayerOpacity(layer.id, circleStrokePrefix, circleStrokeOpacity);
      }
      const layersIds = getAdditionalFillLayers(layer.id);
      for (const id of layersIds) {
        const layer = this.mapFrameworkService.getLayer(map, id);
        if (layer) {
          map.setLayerOpacity(id, layer.type, layerOpacity);
        }
      }
    });
  };
}

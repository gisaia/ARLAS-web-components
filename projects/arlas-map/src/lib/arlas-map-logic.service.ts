import { Injectable } from '@angular/core';
import { ArlasMapService } from './map/service/arlas-map.service';
import { FeatureCollection } from '@turf/helpers';
import { AbstractArlasMapGL } from './map/AbstractArlasMapGL';
import { ArlasMapSource } from './map/model/sources';
import { VisualisationSetConfig } from './map/model/visualisationsets';
import { ARLAS_ID, ExternalEvent, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from './map/model/layers';
import { ElementIdentifier } from 'arlas-web-components';


@Injectable({
  providedIn: 'root'
})
export abstract class ArlasMapFunctionalService {
  /** IMPORTANT NOTE: All the attributes/params that are typed with "any", will have the right type in the implementation. */
  public dataSources: any[] = [];
  public abstract layersMap: Map<string, any>;
  public visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  } = {
      visualisations: new Map(),
      status: new Map()
    };
  public constructor(public mapService: ArlasMapService) { }

  /** Add to map the sources that will host ARLAS data.  */
  public declareArlasDataSources(dataSourcesIds: Set<string>, data: FeatureCollection<GeoJSON.Geometry>, map: AbstractArlasMapGL) {
    if (dataSourcesIds) {
      dataSourcesIds.forEach(sourceId => {
        const source = this.mapService.createGeojsonSource(data)
        this.dataSources.push(source);
        /** For an implementation that doesn't add a source to map
         * --- for instance Openalayers, adds the source to layer ---
         * the following line should be reconsidered.
         */
        this.mapService.setSource(sourceId, source, map);
      });
    }
  }

  public declareLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: AbstractArlasMapGL) {
    if (labelSourceId) {
      const source = this.mapService.createGeojsonSource(data)
      this.mapService.setSource(labelSourceId, source, map);
    }
  }

  public updateLabelSources(labelSourceId: string, data: FeatureCollection<GeoJSON.Geometry>, map: AbstractArlasMapGL) {
    if (labelSourceId) {
      const source = this.mapService.getSource(labelSourceId, map);
      this.mapService.setDataToGeojsonSource(source, data);
    }
  }

  public declareBasemapSources(basemapSources: Array<ArlasMapSource<any>>, map: AbstractArlasMapGL) {
    // Add sources defined as input in mapSources;
    const mapSourcesMap = new Map<string, ArlasMapSource<any>>();
    if (basemapSources) {
      basemapSources.forEach(mapSource => {
        mapSourcesMap.set(mapSource.id, mapSource);
      });
      mapSourcesMap.forEach((mapSource, id) => {
        if (typeof (mapSource.source) !== 'string') {
          this.mapService.setSource(id, mapSource.source, map);
        }
      });
    }
  }

  public abstract setLayersMap(mapLayers: MapLayers<any>, layers?: Array<any>);

  /**
   * Inits a map of visulisation from the configuration.
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

  public initMapLayers(mapLayers: MapLayers<any>, map: AbstractArlasMapGL) {
    if (mapLayers) {
      this.setLayersMap(mapLayers as MapLayers<any>);
    }
  }

  public addArlasDataLayers(visualisationSetsConfig: VisualisationSetConfig[], mapLayers: MapLayers<any>, map: AbstractArlasMapGL) {
    this.initMapLayers(mapLayers, map);
    this.initVisualisationSet(visualisationSetsConfig);
    for (let i = visualisationSetsConfig.length - 1; i >= 0; i--) {
      const visualisation: VisualisationSetConfig = visualisationSetsConfig[i];
      if (!!visualisation.layers) {
        for (let j = visualisation.layers.length - 1; j >= 0; j--) {
          const l = visualisation.layers[j];
          const layer = this.layersMap.get(l);
          this.mapService.addArlasDataLayer(map, layer, this.layersMap);
        }
      }
    }
    this._addExternalEventLayers(mapLayers, map);
    this.visualisationsSets.status.forEach((visible, vs) => {
      this.visualisationsSets.visualisations.get(vs).forEach(l => {
        this.mapService.setLayerVisibility(l, visible, map);
      });
    });
    this.reorderLayers(visualisationSetsConfig, map);
  }

  private _addExternalEventLayers(mapLayers: MapLayers<any>, map: AbstractArlasMapGL) {
    if (!!mapLayers.externalEventLayers) {
      mapLayers.layers
        .filter(layer => mapLayers.externalEventLayers.map(e => e.id).indexOf(layer.id) >= 0)
        .forEach(l => {
          this.mapService.addLayer(map, l);
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
          this.mapService.moveArlasDataLayer(map, l, this.layersMap)
        }
      }
    }
    this.reorderDrawLayers(map);

  }

  private reorderDrawLayers(map: AbstractArlasMapGL) {
    this.mapService.getLayersFromPattern(map, '.cold').forEach(l => this.mapService.moveLayer(map, l.id));
    this.mapService.getLayersFromPattern(map, '.hot').forEach(l => this.mapService.moveLayer(map, l.id));
  }


  public filterLayersOnEvent(mapLayers: MapLayers<any>, map: AbstractArlasMapGL, visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
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
              originalLayerIsVisible = this.mapService.isLayerVisible(originalLayer);
            }
            const layerFilter: Array<any> = [];
            const externalEventLayer = this.layersMap.get(layer.id);
            if (!!externalEventLayer && !!externalEventLayer.filter) {
              externalEventLayer.filter.forEach(f => {
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

  public selectFeatures(mapLayers: MapLayers<any>, map: AbstractArlasMapGL, elementToSelect: Array<ElementIdentifier>) {
    if (elementToSelect) {
      const ids = elementToSelect.length > 0 ?
        elementToSelect.reduce((memo, element) => {
          memo.push(element.idValue);
          return memo;
        }, []) : [];
      const numericalIds = ids.filter(id => !isNaN(+id)).map(id => +id);
      const visibilityFilter = ids.length > 0 ? ['in', ['get', elementToSelect[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
      this.filterLayersOnEvent(mapLayers, map, (elementToSelect.length > 0), visibilityFilter, ExternalEvent.select);
    }
  }

  public highlightFeature(mapLayers: MapLayers<any>, map: AbstractArlasMapGL, featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; }) {
    if (featureToHightLight && featureToHightLight.elementidentifier) {
      const ids: Array<number | string> = [featureToHightLight.elementidentifier.idValue];
      if (!isNaN(+featureToHightLight.elementidentifier.idValue)) {
        ids.push(+featureToHightLight.elementidentifier.idValue);
      }
      const visibilityFilter = ['in', ['get', featureToHightLight.elementidentifier.idFieldName],
        ['literal', ids]];
      this.filterLayersOnEvent(mapLayers, map, !featureToHightLight.isleaving, visibilityFilter, ExternalEvent.hover);
    }
  }

  public selectFeaturesByCollection(mapLayers: MapLayers<any>, map: AbstractArlasMapGL, features: Array<ElementIdentifier>, collection: string) {
    const ids: Array<number | string> = features.map(f => f.idValue);
    const numericalIds = ids.filter(id => !isNaN(+id)).map(id => +id);
    const visibilityFilter = ids.length > 0 ? ['in', ['get', features[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
    this.filterLayersOnEvent(mapLayers, map, (features.length > 0), visibilityFilter, ExternalEvent.select, collection);
  }


  public updateLayoutVisibility(visualisationName: string, visualisationSetsConfig: VisualisationSetConfig[], map: AbstractArlasMapGL) {
    const visuStatus = !this.visualisationsSets.status.get(visualisationName);
    visualisationSetsConfig.find(v => v.name === visualisationName).enabled = visuStatus;
    if (!visuStatus) {
      const layersSet = new Set(this.visualisationsSets.visualisations.get(visualisationName));
      this.visualisationsSets.visualisations.forEach((ls, v) => {
        if (v !== visualisationName) {
          ls.forEach(ll => {
            if (layersSet && layersSet.has(ll)) {
              layersSet.delete(ll);
            }
          });
        }
      });
      layersSet.forEach(ll => {
        this.mapService.setLayerVisibility(ll, false, map);
      });
    }
    this.visualisationsSets.status.set(visualisationName, visuStatus);
    const layers = new Set<string>();
    this.visualisationsSets.visualisations.forEach((ls, v) => {
      if (this.visualisationsSets.status.get(v)) {
        ls.forEach(l => {
          layers.add(l);
          this.mapService.setLayerVisibility(l, true, map);
        });
      }
    });
    return layers;
  }

  public updateVisibility(visibilityStatus: Map<string, boolean>, visualisationSetsConfig: VisualisationSetConfig[], map: AbstractArlasMapGL) {
    visibilityStatus.forEach((visibilityStatus, l) => {
      let layerInVisualisations = false;
      if (!visibilityStatus) {
        visualisationSetsConfig.forEach(v => {
          const ls = new Set(v.layers);
          if (!layerInVisualisations) {
            layerInVisualisations = ls.has(l);
          }
        });
        if (layerInVisualisations) {
          this.mapService.setLayerVisibility(l, false, map);
        }
      } else {
        let oneVisualisationEnabled = false;
        visualisationSetsConfig.forEach(v => {
          const ls = new Set(v.layers);
          if (!layerInVisualisations) {
            layerInVisualisations = ls.has(l);
          }
          if (ls.has(l) && v.enabled) {
            oneVisualisationEnabled = true;
            this.mapService.setLayerVisibility(l, true, map);
          }
        });
        if (!oneVisualisationEnabled && layerInVisualisations) {
          this.mapService.setLayerVisibility(l, false, map);
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

  public abstract getVisibleIdsFilter(map: AbstractArlasMapGL, layer: any, ids: Array<string | number>);



}
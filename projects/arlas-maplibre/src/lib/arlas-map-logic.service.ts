import { Injectable } from '@angular/core';
import { ArlasMapFunctionalService } from 'arlas-map';
import { ArlasMaplibreService } from './arlas-maplibre.service';
import { FeatureCollection } from '@turf/helpers';
import { ArlasMaplibreGL } from './map/ArlasMaplibreGL';
import { ArlasMapSource } from 'arlas-map';
import { MaplibreSourceType } from './map/model/sources';
import { TypedStyleLayer } from 'maplibre-gl';
import { MapLayers } from 'arlas-map';

@Injectable({
  providedIn: 'root'
})
export class MapLogicService extends ArlasMapFunctionalService{
  /** IMPORTANT NOTE: All the attributes/params that are typed with "any", will have the right type in the implementation. */
  public dataSources: any[] = [];
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
    if (mapLayers) {
      this.setLayersMap(mapLayers as MapLayers<any>);
      this.addVisualLayers();
      this._addExternalEventLayers();

      this.bindLayersToMapEvent(
        map,
        mapLayers.events.zoomOnClick,
        this.config.mapLayersEventBind.zoomOnClick
      );

      this.bindLayersToMapEvent(
        map,
        this.config.mapLayers.events.emitOnClick,
        this.config.mapLayersEventBind.emitOnClick
      );

      this.bindLayersToMapEvent(
        map,
        this.config.mapLayers.events.onHover,
        this.config.mapLayersEventBind.onHover
      );
    }
  }

  public reorderLayers() {
    // parses the visulisation list from bottom in order to put the fist ones first
    for (let i = this.visualisationSetsConfig.length - 1; i >= 0; i--) {
      const visualisation: VisualisationSetConfig = this.visualisationSetsConfig[i];
      if (!!visualisation.layers && visualisation.enabled) {
        for (let j = visualisation.layers.length - 1; j >= 0; j--) {
          const l = visualisation.layers[j];
          const layer = this.layersMap.get(l);
          const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
          const scrollableLayer = this.layersMap.get(scrollableId);
          if (!!scrollableLayer && !!this.getLayer(scrollableId)) {
            this.moveLayer(scrollableId);
          }
          if (!!this.getLayer(l)) {
            this.moveLayer(l);
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this.layersMap.get(strokeId);
              if (!!strokeLayer && !!this.getLayer(strokeId)) {
                this.moveLayer(strokeId);
              }
              if (!!strokeLayer && !!strokeLayer.id) {
                const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + strokeLayer.id;
                const selectLayer = this.layersMap.get(selectId);
                if (!!selectLayer && !!this.getLayer(selectId)) {
                  this.moveLayer(selectId);
                }
                const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + strokeLayer.id;
                const hoverLayer = this.layersMap.get(hoverId);
                if (!!hoverLayer && !!this.getLayer(hoverId)) {
                  this.moveLayer(hoverId);
                }
              }
            }
          }
          const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + layer.id;
          const selectLayer = this.layersMap.get(selectId);
          if (!!selectLayer && !!this.getLayer(selectId)) {
            this.moveLayer(selectId);
          }
          const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + layer.id;
          const hoverLayer = this.layersMap.get(hoverId);
          if (!!hoverLayer && !!this.getLayer(hoverId)) {
            this.moveLayer(hoverId);
          }
        }
      }
    }

    this.getColdOrHotLayers().forEach(id => this.moveLayer(id));
  }

  public updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
    collection?: string): void {
    if (this._mapLayers && this._mapLayers.externalEventLayers) {
      this._mapLayers.externalEventLayers.filter(layer => layer.on === visibilityEvent).forEach(layer => {
        if (this.getLayer(layer.id) !== undefined) {
          let originalLayerIsVisible = false;
          const fullLayer = this.layersMap.get(layer.id);
          const isCollectionCompatible = (!collection || (!!collection && (fullLayer.source as string).includes(collection)));
          if (isCollectionCompatible) {
            const originalLayerId = layer.id.replace('arlas-' + visibilityEvent.toString() + '-', '');
            const originalLayer = this.getMapProvider().getStyle().layers.find(l => l.id === originalLayerId);
            if (!!originalLayer) {
              originalLayerIsVisible = this.isLayerVisible(originalLayer);
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
              this.setFilter(layer.id, layerFilter);
              this.setLayoutProperty(layer.id, 'visibility', 'visible');
            } else {
              this.setFilter(layer.id, (layer as any).filter);
              this.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          }
        }
      });
    }
  }


}
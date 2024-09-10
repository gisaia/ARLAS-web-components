
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

import {
  AbstractArlasMapGL,
  BaseMapGlConfig,
  BindLayerToEvent,
  ControlPosition,
  DrawControlsOption,
  GEOJSON_SOURCE_TYPE,
  MapEventBinds,
  OnMoveResult,
  VisualisationSetConfig
} from './AbstractArlasMapGL';
import mapboxgl, {
  AnyLayer,
  AnySourceData,
  Control,
  FilterOptions,
  IControl, LngLat, LngLatBoundsLike,
  MapboxOptions,
  MapLayerEventType, PointLike
} from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { MapSource } from './mapSource';
import { ArlasAnyLayer, MapExtend, paddedBounds } from '../mapgl.component.util';
import { ControlButton, PitchToggle } from '../mapgl.component.control';
import { ARLAS_ID, ExternalEvent, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from './mapLayers';
import { fromEvent, map } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ElementIdentifier } from '../../results/utils/results.utils';
import { MapOverride } from './map.type';

export interface ArlasMapGlConfig extends BaseMapGlConfig<MapboxOptions>  {
  mapLayers: MapLayers<AnyLayer>;
  customEventBind: BindLayerToEvent<keyof MapLayerEventType>[];
  mapLayersEventBind: {
    onHover: MapEventBinds<keyof MapLayerEventType>[];
    emitOnClick: MapEventBinds<keyof MapLayerEventType>[];
    zoomOnClick: MapEventBinds<keyof MapLayerEventType>[];
  };
}

/**
 *  The aim of this class is to handle all core interaction we have
 *  with a map provider. And also to handle all new behaviour
 *  we create from this provider.
 *
 * The aim is also to separate the alras map from the angular framework.
 * The advantage is that in arlas-wui we can use an instance of this class (or not) without worrying about the library used
 *
 * it will be instantiated in mapgl and will be responsible for initializing the map and all map behavior.
 *
 * Drawing behavior may be handled by another class.
 *
 * improvement (open to discussion) :
 *  - wrap of provider methode could be implemented in another class in middle of
 *  abstract class.
 */
export class ArlasMapGL extends AbstractArlasMapGL implements MapOverride {
  protected _mapLayers: MapLayers<AnyLayer>;
  protected _mapProvider: mapboxgl.Map;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  public startlngLat: mapboxgl.LngLat;
  public endlngLat: mapboxgl.LngLat;
  public movelngLat: mapboxgl.LngLat;
  public layersMap: Map<string, ArlasAnyLayer>;

   public constructor(protected config: ArlasMapGlConfig) {
      super(config);
    }

  protected initMapProvider(config: ArlasMapGlConfig){
    this._mapProvider = new mapboxgl.Map(
      config.mapProviderOptions
    );
    // Disable map pitch and rotation with keyboard
    this.getMapProvider().keyboard.disableRotation();

    // disable box zoom;
    this.getMapProvider().boxZoom.disable();
  }

  protected initOnLoad(){
    this.onLoad(() => {
      console.log('on load');
      this._updateBounds();
      this._updateZoom();
      this.firstDrawLayer = this.getColdOrHotLayers()[0];
      this.initLoadIcons();
      this.initSources();
      this.initMapLayers();
      this.getMapProvider().showTileBoundaries = false;
      this.bindCustomEvent();
      // Fit bounds on current bounds to emit init position in moveend bus
      this.getMapProvider().fitBounds(this.getMapProvider().getBounds());
      this.initVisualisationSet();
    });
  }

  protected initMapMoveEvents(){
   this._zoomStart$ = fromEvent(this.getMapProvider(), 'zoomstart')
      .pipe(debounceTime(750));

   this._dragStart$ = fromEvent(this.getMapProvider(), 'dragstart')
      .pipe(debounceTime(750));

    this._dragEnd$ = fromEvent(this.getMapProvider(), 'dragend')
      .pipe(debounceTime(750));

    this._moveEnd$ = fromEvent(this.getMapProvider(), 'moveend')
      .pipe(debounceTime(750));

    this.getMapProvider().on('mousedown', (e) =>
      this._updateStartLngLat(e)
    );
    this.getMapProvider().on('mouseup', (e) =>
      this._updateEndLngLat(e)
    );

    this.getMapProvider().on('mousemove', (e) =>
      this._updateCurrentLngLat(e)
    );

    this.updateOnZoomStart();
    this.updateOnDragStart();
    this.updateOnDragEnd();
    this.updateOnMoveEnd();
  }

  public initControls(): void {
     console.log('init controls');
    if(this._controls) {
      if(this._controls.mapAttribution) {
        this.addControl(new mapboxgl.AttributionControl(this._controls.mapAttribution.config),this._controls.mapAttribution.position);
      }

      /** Whether to display scale */
      if (this._controls?.scale?.enable) {
        const defaultOpt = {
          maxWidth: this._maxWidthScale,
          unit: this._unitScale,
        };
        const opt = this._controls?.scale?.config ?? defaultOpt;
        const scale = new mapboxgl.ScaleControl(opt);
        this.addControl(scale, this._controls.scale?.position ?? 'bottom-right');
      }

      if(this._controls?.pitchToggle?.enable){
        const conf = this._controls.pitchToggle.config;
        this.addControl(new PitchToggle(conf.bearing, conf.pitch, conf.minpitchzoom), this._controls.pitchToggle?.position ?? 'top-right');
      }

      if(this._controls?.navigationControl?.enable) {
        this.addControl(
          new mapboxgl.NavigationControl(this._controls.navigationControl.config),
          this._controls.navigationControl?.position ?? 'top-right');
      }
    }
  }

  protected initSources(){
    if(this._dataSources){
      this._dataSources.forEach(id => {
        this.getMapProvider().addSource(id, {type: GEOJSON_SOURCE_TYPE, data:  Object.assign({}, this._emptyData) });
      });
    }

    this.getMapProvider().addSource(this.POLYGON_LABEL_SOURCE, {
      'type': GEOJSON_SOURCE_TYPE,
      'data': this.polygonlabeldata
    });

    if(this.mapSources){
      this.addSourcesToMap(this.mapSources);
    }

  }

  protected initVisualisationSet(){
    if (this._visualisationSetsConfig) {
      this._visualisationSetsConfig.forEach(visu => {
        this.visualisationsSets.visualisations.set(visu.name, new Set(visu.layers));
        this.visualisationsSets.status.set(visu.name, visu.enabled);
      });
    }
  }

  public initDrawControls(config: DrawControlsOption) {

     if(!(config.draw.control instanceof MapboxDraw)) {
       console.warn(' Draw control is not instance of MapBoxDraw');
     } else {
       this.addControl(config.draw.control as Control, (config.draw?.position ?? 'top-right'));
     }

    if(config.addGeoBox.enable){
      const addGeoBoxButton = new ControlButton(config.addGeoBox?.name ?? 'addgeobox');
      this.addControl(addGeoBoxButton, config.addGeoBox?.position ?? 'top-right', config.addGeoBox?.overrideEvent);

    }
    if(config.addGeoBox.enable) {
      const removeAoisButton = new ControlButton('removeaois');
      this.addControl(removeAoisButton, config.removeAois?.position ?? 'top-right', config.removeAois?.overrideEvent);
    }
  }

  protected initImages(){
    this.loadInternalImage('assets/rotate/01.png', 'rotate');
    this.loadInternalImage('assets/resize/01.png', 'resize');
  }

  protected loadInternalImage(filePath: string, name: string, errorMessage?: string, opt?: any){
    this.getMapProvider().loadImage(filePath, (error, image) => {
      if (error) {
        console.warn(errorMessage);
      } else {
        if(opt){
          this.getMapProvider().addImage(name, image, opt);
        } else {
          this.getMapProvider().addImage(name, image);
        }
      }
    });
  }

  protected initLoadIcons(){
    if (this._icons) {
      this._icons.forEach(icon => {
        this.loadInternalImage(
          this.ICONS_BASE_PATH + icon.path,
          icon.path.split('.')[0],
          'The icon "' + this.ICONS_BASE_PATH + icon.path + '" is not found',
          { 'sdf': icon.recolorable }
        );
      });
    }
  }

  protected initMapLayers(){
    if(this._mapLayers){
      this.setLayersMap(this._mapLayers as MapLayers<AnyLayer>);
      this.addVisuLayers();
      this.addExternalEventLayers();

      this.bindLayersToMapEvent(
        this._mapLayers.events.zoomOnClick,
        this.config.mapLayersEventBind.zoomOnClick
      );

      this.bindLayersToMapEvent(
        this.config.mapLayers.events.emitOnClick,
        this.config.mapLayersEventBind.emitOnClick
      );

      this.bindLayersToMapEvent(
        this.config.mapLayers.events.onHover,
        this.config.mapLayersEventBind.onHover
      );

    }
  }


  public bindLayersToMapEvent(layers: string[] | Set<string>, binds: MapEventBinds<keyof  MapLayerEventType>[]){
    layers.forEach(layerId => {
      binds.forEach(el => {
        this.getMapProvider().on(el.event, layerId, (e) => {
          el.fn(e);
        });
      });
    });
  }

  protected bindCustomEvent(){
    if(this.config.customEventBind){
      this.config.customEventBind.forEach(element =>
        this.bindLayersToMapEvent(element.layers, element.mapEventBinds)
      );
    }
  }

  protected addVisuLayers() {
    if (!!this._visualisationSetsConfig) {
      for (let i = this._visualisationSetsConfig.length - 1; i >= 0; i--) {
        const visualisation: VisualisationSetConfig = this._visualisationSetsConfig[i];
        if (!!visualisation.layers) {
          for (let j = visualisation.layers.length - 1; j >= 0; j--) {
            const l = visualisation.layers[j];
            const layer = this.layersMap.get(l);
            const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
            const scrollableLayer = this.layersMap.get(scrollableId);
            if (!!scrollableLayer) {
              this.addLayerInWritePlaceIfNotExist(scrollableId);
            }
            this.addLayerInWritePlaceIfNotExist(l);
            /** add stroke layer if the layer is a fill */
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this.layersMap.get(strokeId);
              if (!!strokeLayer) {
                this.addLayerInWritePlaceIfNotExist(strokeId);
              }
            }
          }
        }
      }
      this.visualisationsSets.status.forEach((b, vs) => {
        if (!b) {
          this.visualisationsSets.visualisations.get(vs).forEach(l => {
            this.getMapProvider().setLayoutProperty(l, 'visibility', 'none');
            this.setStrokeLayoutVisibility(l, 'none');
            this.setScrollableLayoutVisibility(l, 'none');
          });
        }
      });
      this.visualisationsSets.status.forEach((b, vs) => {
        if (b) {
          this.visualisationsSets.visualisations.get(vs).forEach(l => {
            this.getMapProvider().setLayoutProperty(l, 'visibility', 'visible');
            this.setStrokeLayoutVisibility(l, 'visible');
            this.setScrollableLayoutVisibility(l, 'visible');
          });

        }
      });
      this.reorderLayers();
    }
  }

  public reorderLayers() {
    // parses the visulisation list from bottom in order to put the fist ones first
    for (let i = this._visualisationSetsConfig.length - 1; i >= 0; i--) {
      const visualisation: VisualisationSetConfig = this._visualisationSetsConfig[i];
      if (!!visualisation.layers && visualisation.enabled) {
        for (let j = visualisation.layers.length - 1; j >= 0; j--) {
          const l = visualisation.layers[j];
          const layer = this.layersMap.get(l);
          const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
          const scrollableLayer = this.layersMap.get(scrollableId);
          if (!!scrollableLayer && !!this.getMapProvider().getLayer(scrollableId)) {
            this.getMapProvider().moveLayer(scrollableId);
          }
          if (!!this.getMapProvider().getLayer(l)) {
            this.getMapProvider().moveLayer(l);
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this.layersMap.get(strokeId);
              if (!!strokeLayer && !!this.getMapProvider().getLayer(strokeId)) {
                this.getMapProvider().moveLayer(strokeId);
              }
              if (!!strokeLayer && !!strokeLayer.id) {
                const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + strokeLayer.id;
                const selectLayer = this.layersMap.get(selectId);
                if (!!selectLayer && !!this.getMapProvider().getLayer(selectId)) {
                  this.getMapProvider().moveLayer(selectId);
                }
                const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + strokeLayer.id;
                const hoverLayer = this.layersMap.get(hoverId);
                if (!!hoverLayer && !!this.getMapProvider().getLayer(hoverId)) {
                  this.getMapProvider().moveLayer(hoverId);
                }
              }
            }
          }
          const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + layer.id;
          const selectLayer = this.layersMap.get(selectId);
          if (!!selectLayer && !!this.getMapProvider().getLayer(selectId)) {
            this.getMapProvider().moveLayer(selectId);
          }
          const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + layer.id;
          const hoverLayer = this.layersMap.get(hoverId);
          if (!!hoverLayer && !!this.getMapProvider().getLayer(hoverId)) {
            this.getMapProvider().moveLayer(hoverId);
          }
        }
      }
    }

    this.getColdOrHotLayers().forEach(id => this.getMapProvider().moveLayer(id));
  }

  protected setStrokeLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer.type === 'fill') {
      const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
      const strokeLayer = this.layersMap.get(strokeId);
      if (!!strokeLayer) {
        this.getMapProvider().setLayoutProperty(strokeId, 'visibility', visibility);
      }
    }
  }

  protected setScrollableLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollbaleLayer = this.layersMap.get(scrollableId);
    if (!!scrollbaleLayer) {
      this.getMapProvider().setLayoutProperty(scrollableId, 'visibility', visibility);
    }
  }

  public addLayerInWritePlaceIfNotExist(layerId: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer !== undefined && layer.id === layerId) {
      /** Add the layer if it is not already added */
      if (this.getMapProvider().getLayer(layerId) === undefined) {
        if (this.firstDrawLayer.length > 0) {
          /** draw layers must be on the top of the layers */
          this.getMapProvider().addLayer(layer, this.firstDrawLayer);
        } else {
          this.getMapProvider().addLayer(layer);
        }
      }
    } else {
      throw new Error('The layer `' + layerId + '` is not declared in `mapLayers.layers`');
    }
  }

  public setLayersMap(mapLayers: MapLayers<AnyLayer>, layers?: Array<AnyLayer>){
    if(mapLayers) {
      const mapLayersCopy = mapLayers;
      if(layers){
        mapLayersCopy.layers = mapLayersCopy.layers.concat(layers);
      }
      const layersMap = new Map();
      mapLayersCopy.layers.forEach(layer => layersMap.set(layer.id, layer));
      this.layersMap = layersMap;
    }
  }

  public addSourcesToMap(sources: Array<MapSource>): void {
    // Add sources defined as input in mapSources;
    const mapSourcesMap = new Map<string, MapSource>();
    if (sources) {
      sources.forEach(mapSource => {
        mapSourcesMap.set(mapSource.id, mapSource);
      });
      mapSourcesMap.forEach((mapSource, id) => {
        if (this.getMapProvider().getSource(id) === undefined && typeof (mapSource.source) !== 'string') {
          this.getMapProvider().addSource(id, mapSource.source);
        }
      });
    }
  }


  public getMapExtend(): MapExtend {
    const bounds = this.getMapProvider().getBounds();
    return  { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.getMapProvider().getZoom() };
  }

  public redrawSource(id: string, data){
    if (this.getMapProvider().getSource(id) !== undefined) {
      (this.getMapProvider().getSource(id) as mapboxgl.GeoJSONSource).setData({
        'type': 'FeatureCollection',
        'features': data
      });
    }
  }

  public addControl(control: Control | IControl | ControlButton,
                    position?: ControlPosition,
                    eventOverride?: {
                      event: string; fn: (e?) => void;
                    }){
    this.getMapProvider().addControl(control, position);
    if(control instanceof  ControlButton && eventOverride){
      control.btn[eventOverride.event] = () => eventOverride.fn();
    }
    return this;
  }

  public setCursorStyle(cursor: string){
    this.getMapProvider().getCanvas().style.cursor = cursor;
  }

  public enableDragPan(){
    this.getMapProvider().dragPan.enable();
  }

  public disableDragPan(){
    this.getMapProvider().dragPan.disable();
  }

  public updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
                                collection?: string): void {
    if (this._mapLayers && this._mapLayers.externalEventLayers) {
      this._mapLayers.externalEventLayers.filter(layer => layer.on === visibilityEvent).forEach(layer => {
        if (this.getMapProvider().getLayer(layer.id) !== undefined) {
          let originalLayerIsVisible = false;
          const fullLayer = this.layersMap.get(layer.id);
          const isCollectionCompatible = (!collection || (!!collection && (fullLayer.source as string).includes(collection)));
          if (isCollectionCompatible) {
            const originalLayerId = layer.id.replace('arlas-' + visibilityEvent.toString() + '-', '');
            const originalLayer = this.getMapProvider().getStyle().layers.find(l => l.id === originalLayerId);
            if (!!originalLayer) {
              originalLayerIsVisible = (originalLayer as ArlasAnyLayer).layout.visibility === 'visible';
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
              this.getMapProvider().setFilter(layer.id, layerFilter);
              this.getMapProvider().setLayoutProperty(layer.id, 'visibility', 'visible');
            } else {
              this.getMapProvider().setFilter(layer.id, (layer as any).filter);
              this.getMapProvider().setLayoutProperty(layer.id, 'visibility', 'none');
            }
          }
        }
      });
    }
  }

  public updateLayoutVisibility(visualisationName: string) {
    const visuStatus = !this.visualisationsSets.status.get(visualisationName);
    this._visualisationSetsConfig.find(v => v.name === visualisationName).enabled = visuStatus;
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
        this.disableLayoutVisibility(ll);
      });
    }
    this.visualisationsSets.status.set(visualisationName, visuStatus);
    const layers = new Set<string>();
    this.visualisationsSets.visualisations.forEach((ls, v) => {
      if (this.visualisationsSets.status.get(v)) {
        ls.forEach(l => {
          layers.add(l);
          this.enableLayoutVisibility(l);
        });
      }
    });
    return layers;
  }

  public updateVisibility(visibilityStatus: Map<string, boolean>){
    visibilityStatus.forEach((visibilityStatus, l) => {
      let layerInVisualisations = false;
      if (!visibilityStatus) {
        this._visualisationSetsConfig.forEach(v => {
          const ls = new Set(v.layers);
          if (!layerInVisualisations) {
            layerInVisualisations = ls.has(l);
          }
        });
        if (layerInVisualisations) {
          this.disableLayoutVisibility(l);
        }
      } else {
        let oneVisualisationEnabled = false;
        this._visualisationSetsConfig.forEach(v => {
          const ls = new Set(v.layers);
          if (!layerInVisualisations) {
            layerInVisualisations = ls.has(l);
          }
          if (ls.has(l) && v.enabled) {
            oneVisualisationEnabled = true;
            this.enableLayoutVisibility(l);
          }
        });
        if (!oneVisualisationEnabled && layerInVisualisations) {
          this.disableLayoutVisibility(l);
        }
      }
    });
  }


  public highlightFeature(featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; }) {
    if (featureToHightLight && featureToHightLight.elementidentifier) {
      const ids: Array<number | string> = [featureToHightLight.elementidentifier.idValue];
      if (!isNaN(+featureToHightLight.elementidentifier.idValue)) {
        ids.push(+featureToHightLight.elementidentifier.idValue);
      }
      const visibilityFilter = ['in', ['get', featureToHightLight.elementidentifier.idFieldName],
        ['literal', ids]];
      this.updateLayersVisibility(!featureToHightLight.isleaving, visibilityFilter, ExternalEvent.hover);
    }
  }

  public selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string) {
    const ids: Array<number | string> = features.map(f => f.idValue);
    const numericalIds = ids.filter(id => !isNaN(+id)).map(id => +id);
    const visibilityFilter = ids.length > 0 ? ['in', ['get', features[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
    this.updateLayersVisibility((features.length > 0), visibilityFilter, ExternalEvent.select, collection);
  }

  public selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    if (elementToSelect) {
      const ids = elementToSelect.length > 0 ?
        elementToSelect.reduce((memo, element) => {
          memo.push(element.idValue);
          return memo;
        }, []) : [];
      const numericalIds = ids.filter(id => !isNaN(+id)).map(id => +id);
      const visibilityFilter = ids.length > 0 ? ['in', ['get', elementToSelect[0].idFieldName], ['literal', ids.concat(numericalIds)]] : [];
      this.updateLayersVisibility((elementToSelect.length > 0), visibilityFilter, ExternalEvent.select);
    }
  }
  public disableLayoutVisibility(layer: string){
    this.getMapProvider().setLayoutProperty(layer, 'visibility', 'none');
    this.setStrokeLayoutVisibility(layer, 'none');
    this.setScrollableLayoutVisibility(layer, 'none');
  }

  public enableLayoutVisibility(layer: string){
    this.getMapProvider().setLayoutProperty(layer, 'visibility', 'visible');
    this.setStrokeLayoutVisibility(layer, 'visible');
    this.setScrollableLayoutVisibility(layer, 'visible');
  }

  public getMapProvider(): mapboxgl.Map {
    return this._mapProvider;
  }

  public getLayers(){
    return this.getMapProvider().getStyle().layers;
  }

  public getColdOrHotLayers(){
    return this.getLayers().map(layer => layer.id)
      .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0);
  }


  public addVisualisation(visualisation: VisualisationSetConfig, layers: Array<AnyLayer>, sources: Array<MapSource>): void {
    sources.forEach((s) => {
      if (typeof (s.source) !== 'string') {
        this.getMapProvider().addSource(s.id, s.source);
      }
    });
    this._visualisationSetsConfig.unshift(visualisation);
    this.visualisationsSets.visualisations.set(visualisation.name, new Set(visualisation.layers));
    this.visualisationsSets.status.set(visualisation.name, visualisation.enabled);
    layers.forEach(layer => {
      this.getMapProvider().addLayer(layer);
    });

    this.setLayersMap(this._mapLayers as MapLayers<AnyLayer>, layers);
    this.reorderLayers();
  }

  protected addExternalEventLayers() {
    if (!!this._mapLayers.externalEventLayers) {
      this._mapLayers.layers
        .filter(layer => this._mapLayers.externalEventLayers.map(e => e.id).indexOf(layer.id) >= 0)
        .forEach(l => this.addLayerInWritePlaceIfNotExist(l.id));
    }
  }


  public onLoad(fn: () => void): void {
    this.getMapProvider().on('load', fn);
  }

  public onMoveEnd() {
    return this._moveEnd$
      .pipe(map(_ => {
        this._updateBounds();
        this._updateZoom();
        return this.getMoveEnd();
      }));
  }

  protected updateOnZoomStart(){
    const sub = this._zoomStart$.subscribe(_ => this._updateZoomStart());
    this._eventSubscription.push(sub);
  }

  protected updateOnDragStart(){
    const sub = this._dragStart$.subscribe(e => this._updateDragStart(e));
    this._eventSubscription.push(sub);
  }

  protected updateOnDragEnd(){
    const sub = this._dragEnd$
      .subscribe(e => {
        this._updateDragEnd(e);
        this._updateMoveRatio(e);
      });
    this._eventSubscription.push(sub);
  }

  protected updateOnMoveEnd(){
    const sub = this._moveEnd$
      .subscribe(_ => {
        this._updateBounds();
        this._updateZoom();
      });
    this._eventSubscription.push(sub);
  }

  protected _updateBounds(): void {
    this._west = this.getWestBounds();
    this._south = this.getSouthBounds();
    this._east = this.getEstBounds();
    this._north = this.getNorthBounds();
  }

  protected _updateCurrentLngLat(e: mapboxgl.MapMouseEvent): void {
    const lngLat = e.lngLat;
    if (this._displayCurrentCoordinates) {
      const displayedLngLat = this._wrapLatLng ? lngLat.wrap() : lngLat;
      this.currentLng = String(Math.round(displayedLngLat.lng * 100000) / 100000);
      this.currentLat = String(Math.round(displayedLngLat.lat * 100000) / 100000);
    }
  }

  protected _updateDragEnd(e: any): void {
    if(e.originalEvent){
      this._dragEndX = e.originalEvent.clientX;
      this._dragEndY = e.originalEvent.clientY;
    }
  }

  protected _updateDragStart(e: any): void {
    this._dragStartX = e.originalEvent.clientX;
    this._dragStartY = e.originalEvent.clientY;
  }

  protected _updateEndLngLat(e: any): void {
    this.endlngLat = e.lngLat;
  }

  protected _updateMoveRatio(e: any): void {
    this._xMoveRatio = Math.abs(this._dragEndX - this._dragStartX) / e.target._canvas.clientWidth;
    this._yMoveRatio = Math.abs(this._dragEndY - this._dragStartY) / e.target._canvas.clientHeight;
  }

  protected _updateStartLngLat(e: any): void {
    this.startlngLat = e.lngLat;
  }

  protected _updateZoom(): void {
    this.zoom = this.getMapProvider().getZoom();
  }

  protected  _updateZoomStart(): void {
    this._zoomStart = this.getMapProvider().getZoom();
  }

  public calcOffsetPoint() {
    return new mapboxgl.Point((this._offset.east + this._offset.west) / 2, (this._offset.north + this._offset.south) / 2);
  }

  protected getMoveEnd(){
    const offsetPoint = this.calcOffsetPoint();
    const centerOffsetPoint = this.getMapProvider().project(this.getMapProvider().getCenter()).add(offsetPoint);
    const centerOffSetLatLng = this.getMapProvider().unproject(centerOffsetPoint);

    const southWest = this.getSouthWestBounds();
    const northEast = this.getNorthEastBounds();
    const bottomLeft = this.getMapProvider().project(southWest);
    const topRght = this.getMapProvider().project(northEast);
    const height = bottomLeft.y;
    const width = topRght.x;

    const bottomLeftOffset = bottomLeft.add(new mapboxgl.Point(this._offset.west, this._offset.south));
    const topRghtOffset = topRght.add(new mapboxgl.Point(this._offset.east, this._offset.north));

    const bottomLeftOffsetLatLng = this.getMapProvider().unproject(bottomLeftOffset);
    const topRghtOffsetLatLng = this.getMapProvider().unproject(topRghtOffset);

    const wrapWestOffset = bottomLeftOffsetLatLng.wrap().lng;
    const wrapSouthOffset = bottomLeftOffsetLatLng.wrap().lat;
    const wrapEastOffset = topRghtOffsetLatLng.wrap().lng;
    const wrapNorthOffset = topRghtOffsetLatLng.wrap().lat;

    const rawWestOffset = bottomLeftOffsetLatLng.lng;
    const rawSouthOffset = bottomLeftOffsetLatLng.lat;
    const rawEastOffset = topRghtOffsetLatLng.lng;
    const rawNorthOffset = topRghtOffsetLatLng.lat;
    const visibleLayers = new Set<string>();
    this.visualisationsSets.status.forEach((b, vs) => {
      if (b) {
        this.visualisationsSets.visualisations.get(vs).forEach(l => visibleLayers.add(l));
      }
    });
    const onMoveData: OnMoveResult = {
      zoom: this.zoom,
      zoomStart: this._zoomStart,
      center: this.getMapProvider().getCenter().toArray(),
      centerWithOffset: [centerOffSetLatLng.lng, centerOffSetLatLng.lat],
      extendWithOffset: [wrapNorthOffset, wrapWestOffset, wrapSouthOffset, wrapEastOffset],
      rawExtendWithOffset: [rawNorthOffset, rawWestOffset, rawSouthOffset, rawEastOffset],
      extend: [this._north, this._west, this._south, this._east],
      extendForLoad: [],
      extendForTest: [],
      rawExtendForLoad: [],
      rawExtendForTest: [],
      xMoveRatio: this._xMoveRatio,
      yMoveRatio: this._yMoveRatio,
      visibleLayers: visibleLayers
    };

    const panLoad = this._margePanForLoad * Math.max(height, width) / 100;
    const panTest = this._margePanForTest * Math.max(height, width) / 100;
    const extendForLoadLatLng = paddedBounds(panLoad, panLoad, panLoad, panLoad, this.getMapProvider(), southWest, northEast);
    const extendForTestdLatLng = paddedBounds(panTest, panTest, panTest, panTest, this.getMapProvider(), southWest, northEast);
    onMoveData.extendForLoad = [
      extendForLoadLatLng[1].wrap().lat,
      extendForLoadLatLng[0].wrap().lng,
      extendForLoadLatLng[0].wrap().lat,
      extendForLoadLatLng[1].wrap().lng
    ];
    onMoveData.extendForTest = [
      extendForTestdLatLng[1].wrap().lat,
      extendForTestdLatLng[0].wrap().lng,
      extendForTestdLatLng[0].wrap().lat,
      extendForTestdLatLng[1].wrap().lng
    ];
    onMoveData.rawExtendForLoad = [
      extendForLoadLatLng[1].lat,
      extendForLoadLatLng[0].lng,
      extendForLoadLatLng[0].lat,
      extendForLoadLatLng[1].lng,
    ];
    onMoveData.rawExtendForTest = [
      extendForTestdLatLng[1].lat,
      extendForTestdLatLng[0].lng,
      extendForTestdLatLng[0].lat,
      extendForTestdLatLng[1].lng,
    ];

    return onMoveData;
  }

  public paddedFitBounds(bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) {
    const paddedOptions = Object.assign({}, options);
    paddedOptions.padding = {
      top: this._offset.north + this._fitBoundsPadding,
      bottom: this._offset.south + this._fitBoundsPadding,
      left: this._offset.west + this._fitBoundsPadding,
      right: this._offset.east + this._fitBoundsPadding
    };
    this.getMapProvider().fitBounds(bounds, paddedOptions);
  }

  public addSourceType(ind: string, protocol: any, cb: (e?) => void) {
    (this.getMapProvider() as any).addSourceType(ind, protocol, cb);
  }

  public getWestBounds(){
    return this.getMapProvider().getBounds().getWest();
  }
  public getNorthBounds(){
    return this.getMapProvider().getBounds().getNorth();
  }

  public getNorthEastBounds(){
    return this.getMapProvider().getBounds().getNorthEast();
  }
  public getSouthBounds(){
    return this.getMapProvider().getBounds().getSouth();
  }

  public getSouthWestBounds(){
    return this.getMapProvider().getBounds().getSouthWest();
  }
  public getEstBounds(){
    return this._mapProvider.getBounds().getEast();
  }

  /** *****
   ******* MAP PROVIDER WRAP
   *******/


  public addLayer(layerId: AnyLayer, before?: string){
    this._mapProvider.addLayer(layerId, before);
    return this;
  }

  public moveLayer(id: string, before?: string){
    this._mapProvider.moveLayer(id, before);
    return this;
  }

  public getSource(id: string){
    return this._mapProvider.getSource(id);
  }

  public setLayoutProperty(layer: string, name: string, value: any, options?: FilterOptions){
    this._mapProvider.setLayoutProperty(layer, name, value, options);
    return this;
  }

  public getBounds(){
    return this._mapProvider.getBounds();
  }

  public fitBounds(bounds: LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions, eventData?: mapboxgl.EventData){
    this._mapProvider.fitBounds(bounds, options, eventData);
    return this;
  }

  public setCenter(lngLat: [number, number]){
    this._mapProvider.setCenter(lngLat);
    return this;
  }

  public getZoom(){
    return this._mapProvider.getZoom();
  }

  public getCanvasContainer(){
    return this._mapProvider.getCanvasContainer();
  }


  public queryRenderedFeatures(point){
    return this._mapProvider.queryRenderedFeatures(point);
  }

  public project(latLng: LngLat){
    return this._mapProvider.project(latLng);
  }

  public unproject(latLng: PointLike){
    return this._mapProvider.unproject(latLng);
  }


  public getCenter(){
    return this._mapProvider.getCenter();
  }

  public getLayer (id: string){
    return this._mapProvider.getLayer(id);
  }

  public setStyle(style: mapboxgl.Style | string, option?: { diff?: boolean | undefined; localIdeographFontFamily?: string | undefined; }){
    this._mapProvider.setStyle(style, option);
    return this;
  }

  public removeLayer(id: string){
    this._mapProvider.removeLayer(id);
    return this;
  }
  public removeSource(id: string){
    this._mapProvider.removeSource(id);
    return this;
  }

  public getStyle(){
    return this._mapProvider.getStyle();
  }

  public addImage(name: string, image: HTMLImageElement | ArrayBufferView | {
    width: number;
    height: number;
    data: Uint8Array | Uint8ClampedArray;
  } | ImageData | ImageBitmap, options?: { pixelRatio?: number | undefined; sdf?: boolean | undefined; }): this {
    this._mapProvider.addImage(name, image);
    return this;
  }

  public areTilesLoaded(): boolean {
    return this._mapProvider.areTilesLoaded();
  }

  public cameraForBounds(bounds: mapboxgl.LngLatBoundsLike,
                         options?: mapboxgl.CameraForBoundsOptions): mapboxgl.CameraForBoundsResult | undefined {
    return this._mapProvider.cameraForBounds(bounds, options);
  }

  public easeTo(options: mapboxgl.EaseToOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.easeTo(options, eventData);
    return this;
  }

  public fitScreenCoordinates(p0: mapboxgl.PointLike,
                              p1: mapboxgl.PointLike,
                              bearing: number,
                              options?: mapboxgl.AnimationOptions & mapboxgl.CameraOptions,
                              eventData?: mapboxgl.EventData): this {
    this._mapProvider.fitScreenCoordinates(p0, p1, bearing, options);
    return this;
  }

  public getBearing(): number {
    return this._mapProvider.getBearing();
  }

  public getCanvas(): HTMLCanvasElement {
    return this._mapProvider.getCanvas();
  }

  public getContainer(): HTMLElement {
    return this._mapProvider.getContainer();
  }

  public getFeatureState(feature: mapboxgl.FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature): { [p: string]: any; } {
    return this._mapProvider.getFeatureState(feature);
  }

  public getFilter(layer: string): any[] {
    return this._mapProvider.getFilter(layer);
  }

  public getLayoutProperty(layer: string, name: string): any {
    return this._mapProvider.getLayoutProperty(layer, name);
  }

  public getLight(): mapboxgl.Light {
    return this._mapProvider.getLight();
  }

  public getMaxBounds(): mapboxgl.LngLatBounds | null {
    return this._mapProvider.getMaxBounds();
  }

  public getMaxPitch(): number {
    return this._mapProvider.getMaxPitch();
  }

  public getMaxZoom(): number {
    return this._mapProvider.getMaxZoom();
  }

  public getMinPitch(): number {
    return  this._mapProvider.getMinPitch();
  }

  public getMinZoom(): number {
    return this._mapProvider.getMinZoom();
  }

  public getPadding(): mapboxgl.PaddingOptions {
    return this._mapProvider.getPadding();
  }

  public getPaintProperty(layer: string, name: string): any {
    return  this._mapProvider.getPaintProperty(layer, name) ;
  }

  public getPitch(): number {
    return  this._mapProvider.getPitch() ;
  }

  public getRenderWorldCopies(): boolean {
    return  this._mapProvider.getRenderWorldCopies() ;
  }

  public hasControl(control: mapboxgl.IControl): boolean {
    return  this._mapProvider.hasControl(control) ;
  }

  public hasImage(name: string): boolean {
    return this._mapProvider.hasImage(name);
  }

  public isEasing(): boolean {
    return this._mapProvider.isEasing();
  }

  public isMoving(): boolean {
    return this._mapProvider.isMoving();
  }

  public isRotating(): boolean {
    return this._mapProvider.isRotating();
  }

  public isSourceLoaded(id: string): boolean {
    return this._mapProvider.isSourceLoaded(id);
  }

  public isStyleLoaded(): boolean {
    return this._mapProvider.isStyleLoaded();
  }

  public isZooming(): boolean {
    return this._mapProvider.isZooming();
  }

  public jumpTo(options: mapboxgl.CameraOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.jumpTo(options, eventData);
    return this;
  }

  public listImages(): string[] {
    return this._mapProvider.listImages();
  }

  public loaded(): boolean {
    return this._mapProvider.loaded();
  }

  public off<T extends keyof mapboxgl.MapLayerEventType>(
    type: T,
    layer: string,
    listener: (ev: (mapboxgl.MapLayerEventType[T] & mapboxgl.EventData)) => void): this;
  public off<T extends keyof mapboxgl.MapEventType>(type: T, listener: (ev: (mapboxgl.MapEventType[T] & mapboxgl.EventData)) => void): this;
  public off(type: string, listener: (ev: any) => void): this;
  public off(type, layer, listener?): this {
    this._mapProvider.off(type, layer, listener);
    return this;
  }

  public panBy(offset: mapboxgl.PointLike, options?: mapboxgl.AnimationOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.panBy(offset, options, eventData);
    return this;
  }

  public panTo(lnglat: mapboxgl.LngLatLike, options?: mapboxgl.AnimationOptions, eventdata?: mapboxgl.EventData): this {
    this._mapProvider.panTo(lnglat, options, eventdata);
    return this;
  }

  public querySourceFeatures(sourceID: string, parameters?: {
    sourceLayer?: string | undefined;
    filter?: any[] | undefined;
  } & mapboxgl.FilterOptions): mapboxgl.MapboxGeoJSONFeature[] {
    return this._mapProvider.querySourceFeatures(sourceID, parameters);
  }

  public remove(): void {
    this._mapProvider.remove();
  }

  public removeControl(control: mapboxgl.Control | mapboxgl.IControl): this {
    this._mapProvider.removeControl(control);
    return this;
  }

  public removeFeatureState(target: mapboxgl.FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature, key?: string): void {
    this._mapProvider.removeFeatureState(target, key);
  }

  public removeImage(name: string): this {
    this._mapProvider.removeImage(name);
    return this;
  }

  public resetNorth(options?: mapboxgl.AnimationOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.resetNorth(options, eventData);
    return this;
  }

  public resetNorthPitch(options?: mapboxgl.AnimationOptions | null, eventData?: mapboxgl.EventData | null): this {
    this._mapProvider.resetNorthPitch(options, eventData);
    return this;
  }

  public resize(eventData?: mapboxgl.EventData): this {
    this._mapProvider.resize(eventData);
    return this;
  }

  public rotateTo(bearing: number, options?: mapboxgl.AnimationOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.rotateTo(bearing, options, eventData);
    return this;
  }

  public setBearing(bearing: number, eventData?: mapboxgl.EventData): this {
    this._mapProvider.setBearing(bearing, eventData);
    return this;
  }

  public setFeatureState(feature: mapboxgl.FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature, state: {
    [p: string]: any;
  }): void {
    this._mapProvider.setFeatureState(feature, state);
  }

  public setFilter(layer: string, filter?: any[] | boolean | null, options?: mapboxgl.FilterOptions | null): this {
    this._mapProvider.setFilter(layer, filter, options);
    return this;
  }

  public setLayerZoomRange(layerId: string, minzoom: number, maxzoom: number): this {
    this._mapProvider.setLayerZoomRange(layerId, minzoom, maxzoom);
    return this;
  }

  public setLight(light: mapboxgl.Light, options?: mapboxgl.FilterOptions): this {
    this._mapProvider.setLight(light, options);
    return this;
  }

  public setMaxBounds(lnglatbounds?: mapboxgl.LngLatBoundsLike): this {
    this._mapProvider.setMaxBounds(lnglatbounds);
    return this;
  }

  public setMaxPitch(maxPitch?: number | null): this {
    this._mapProvider.setMaxPitch(maxPitch);
    return this;
  }

  public setMaxZoom(maxZoom?: number | null): this {
    this._mapProvider.setMaxZoom(maxZoom);
    return this;
  }

  public setMinPitch(minPitch?: number | null): this {
    this._mapProvider.setMinPitch(minPitch);
    return this;
  }

  public setMinZoom(minZoom?: number | null): this {
    this._mapProvider.setMinZoom(minZoom);
    return this;
  }

  public setPadding(padding: mapboxgl.PaddingOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.setPadding(padding, eventData);
    return this;
  }

  public setPaintProperty(layer: string, name: string, value: any, options?: mapboxgl.FilterOptions): this {
    this._mapProvider.setPaintProperty(layer, name, value, options);
    return this;
  }

  public setPitch(pitch: number, eventData?: mapboxgl.EventData): this {
    this._mapProvider.setPitch(pitch, eventData);
    return this;
  }

  public setRenderWorldCopies(renderWorldCopies?: boolean): this {
    this._mapProvider.setRenderWorldCopies(renderWorldCopies);
    return this;
  }

  public setZoom(zoom: number, eventData?: mapboxgl.EventData): this {
    this._mapProvider.setZoom(zoom, eventData);
    return this;
  }

  public snapToNorth(options?: mapboxgl.AnimationOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.snapToNorth(options, eventData);
    return this;
  }

  public stop(): this {
    this._mapProvider.stop();
    return this;
  }

  public triggerRepaint(): void {
    this._mapProvider.triggerRepaint();
  }

  public zoomIn(options?: mapboxgl.AnimationOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.zoomIn(options, eventData);
    return this;
  }

  public zoomOut(options?: mapboxgl.AnimationOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.zoomOut(options, eventData);
    return undefined;
  }

  public zoomTo(
    zoom: number,
                options?: mapboxgl.AnimationOptions,
    eventData?: mapboxgl.EventData): this {
    this._mapProvider.zoomTo(zoom, options, eventData);
    return this;
  }

  public flyTo(options: mapboxgl.FlyToOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.flyTo(options, eventData);
    return this;
  }

  public on<T extends keyof mapboxgl.MapLayerEventType>(
    type: T, layer: string,
    listener: (ev: (mapboxgl.MapLayerEventType[T] & mapboxgl.EventData)) => void): this;
  public on<T extends keyof mapboxgl.MapEventType>(type: T, listener: (ev: (mapboxgl.MapEventType[T] & mapboxgl.EventData)) => void): this;
  public on(type: string, listener: (ev: any) => void): this;
  public on(type, layer, listener?): this {
    this._mapProvider.on(type, layer, listener);
    return this;
  }

  public once<T extends keyof mapboxgl.MapLayerEventType>
  (type: T, layer: string, listener: (ev: (mapboxgl.MapLayerEventType[T] & mapboxgl.EventData)) => void): this;
  public once<T extends keyof mapboxgl.MapEventType>(type: T, listener: (ev: (mapboxgl.MapEventType[T] & mapboxgl.EventData)) => void): this;
  public once(type: string, listener: (ev: any) => void): this;
  public once(type, layer, listener?): this {
    this._mapProvider.once(type, layer, listener);
    return  this;
  }

  public loadImage(url: string, callback: Function): this {
    this._mapProvider.loadImage(url, callback);
    return this;
  }

  public  addSource(id: string, source: AnySourceData): this {
    this._mapProvider.addSource(id, source);
    return this;
  }

}

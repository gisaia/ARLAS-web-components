import {
  AbstractArlasMapGL,
  BaseMapGlConfig,
  BindLayerToEvent,
  ControlPosition,
  DrawControlsOption,
  MapEventBinds
} from './AbstractArlasMapGL';
import mapboxgl, {
  AnyLayer,
  AnySourceData,
  Control,
  FilterOptions,
  IControl,
  LngLat,
  LngLatBoundsLike,
  MapboxOptions,
  MapLayerEventType,
  PointLike
} from 'mapbox-gl';
import { MapSource } from './mapSource';
import { ArlasAnyLayer, MapExtend, paddedBounds } from '../mapgl.component.util';
import { ControlButton, PitchToggle } from '../mapgl.component.control';
import { GEOJSON_SOURCE_TYPE, OnMoveResult, VisualisationSetConfig } from '../mapgl.component';
import { ARLAS_ID, ExternalEvent, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from './mapLayers';
import { fromEvent, map } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ElementIdentifier } from '../../results/utils/results.utils';

export interface ArlasMapGlConfig extends BaseMapGlConfig<MapboxOptions> {
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
export class ArlasMapGL extends AbstractArlasMapGL {
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
    this._mapProvider.keyboard.disableRotation();

    // disable box zoom;
    this._mapProvider.boxZoom.disable();
  }

  protected initOnLoad(){
    this.onLoad(() => {
      console.log('on load');
      this._updateBounds();
      this._updateZoom();
      this.firstDrawLayer = this.getColdOrHotLayers()[0];
      this.loadIcons();
      this.initSources();
      this.initMapLayers();
      this.getMap().showTileBoundaries = false;
      this.bindCustomEvent();
      // Fit bounds on current bounds to emit init position in moveend bus
      this.fitBounds(this.getBounds());
      this.initVisualisationSet();
    });
  }

  protected initMapMoveEvents(){
   this._zoomStart$ = fromEvent(this._mapProvider, 'zoomstart')
      .pipe(debounceTime(750));

   this._dragStart$ = fromEvent(this._mapProvider, 'dragstart')
      .pipe(debounceTime(750));

    this._dragEnd$ = fromEvent(this._mapProvider, 'dragend')
      .pipe(debounceTime(750));

    this._moveEnd$ = fromEvent(this._mapProvider, 'moveend')
      .pipe(debounceTime(750));

    this.getMap().on('mousedown', (e) =>
      this._updateStartLngLat(e)
    );
    this.getMap().on('mouseup', (e) =>
      this._updateEndLngLat(e)
    );

    this.getMap().on('mousemove', (e) =>
      this._updateCurrentLngLat(e)
    );


    this.updateOnZoomStart();
    this.updateOnDragStart();
    this.updateOnDragEnd();
    this.updateOnMoveEnd();
  }

  public initControls(): void {
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
        this.addSource(id, {type: GEOJSON_SOURCE_TYPE, data:  Object.assign({}, this._emptyData) });
      });
    }

    this.addSource(this.POLYGON_LABEL_SOURCE, {
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

    this.addControl(config.draw.control as Control, (config.draw?.position ?? 'top-right'));

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
    this.loadImage('assets/rotate/01.png', 'rotate');
    this.loadImage('assets/resize/01.png', 'resize');
  }

  protected loadImage(filePath: string, name: string, errorMessage?: string,  opt?: any){
    this._mapProvider.loadImage(filePath, (error, image) => {
      if (error) {
        console.warn(errorMessage);
      } else {
        if(opt){
          this._mapProvider.addImage(name, image, opt);
        } else {
          this._mapProvider.addImage(name, image);
        }
      }
    });
  }

  protected loadIcons(){
    if (this._icons) {
      this._icons.forEach(icon => {
        this.loadImage(
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
        this._mapProvider.on(el.event, layerId, (e) => {
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
            this.setLayoutProperty(l, 'visibility', 'none');
            this.setStrokeLayoutVisibility(l, 'none');
            this.setScrollableLayoutVisibility(l, 'none');
          });
        }
      });
      this.visualisationsSets.status.forEach((b, vs) => {
        if (b) {
          this.visualisationsSets.visualisations.get(vs).forEach(l => {
            this.setLayoutProperty(l, 'visibility', 'visible');
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
          if (!!scrollableLayer && !!this.getLayerFromMapProvider(scrollableId)) {
            this.moveLayer(scrollableId);
          }
          if (!!this.getLayerFromMapProvider(l)) {
            this.moveLayer(l);
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this.layersMap.get(strokeId);
              if (!!strokeLayer && !!this.getLayerFromMapProvider(strokeId)) {
                this.moveLayer(strokeId);
              }
              if (!!strokeLayer && !!strokeLayer.id) {
                const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + strokeLayer.id;
                const selectLayer = this.layersMap.get(selectId);
                if (!!selectLayer && !!this.getLayerFromMapProvider(selectId)) {
                  this.moveLayer(selectId);
                }
                const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + strokeLayer.id;
                const hoverLayer = this.layersMap.get(hoverId);
                if (!!hoverLayer && !!this.getLayerFromMapProvider(hoverId)) {
                  this.moveLayer(hoverId);
                }
              }
            }
          }
          const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + layer.id;
          const selectLayer = this.layersMap.get(selectId);
          if (!!selectLayer && !!this.getLayerFromMapProvider(selectId)) {
            this.moveLayer(selectId);
          }
          const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + layer.id;
          const hoverLayer = this.layersMap.get(hoverId);
          if (!!hoverLayer && !!this.getLayerFromMapProvider(hoverId)) {
            this.moveLayer(hoverId);
          }
        }
      }
    }

    this.getColdOrHotLayers().forEach(id => this.moveLayer(id));
  }

  protected setStrokeLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer.type === 'fill') {
      const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
      const strokeLayer = this.layersMap.get(strokeId);
      if (!!strokeLayer) {
        this.setLayoutProperty(strokeId, 'visibility', visibility);
      }
    }
  }

  protected setScrollableLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollbaleLayer = this.layersMap.get(scrollableId);
    if (!!scrollbaleLayer) {
      this.setLayoutProperty(scrollableId, 'visibility', visibility);
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

  public addLayerInWritePlaceIfNotExist(layerId: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer !== undefined && layer.id === layerId) {
      /** Add the layer if it is not already added */
      if (this.getLayerFromMapProvider(layerId) === undefined) {
        if (this.firstDrawLayer.length > 0) {
          /** draw layers must be on the top of the layers */
          this.addLayer(layer, this.firstDrawLayer);
        } else {
          this.addLayer(layer);
        }
      }
    } else {
      throw new Error('The layer `' + layerId + '` is not declared in `mapLayers.layers`');
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
        if (this.getSource(id) === undefined && typeof (mapSource.source) !== 'string') {
          this.addSource(id, mapSource.source);
        }
      });
    }
  }


  public getMapExtend(): MapExtend {
    const bounds = this._mapProvider.getBounds();
    return  { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this._mapProvider.getZoom() };
  }

  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this._visualisationSetsConfig, event.previousIndex, event.currentIndex);
    this.reorderLayers();
  }

  public dropLayer(event: CdkDragDrop<string[]>, visuName: string) {
    const layers = Array.from(this.findVisualisationSetLayer(visuName));
    moveItemInArray(layers, event.previousIndex, event.currentIndex);
    this.setVisualisationSetLayers(visuName, layers);
    this.reorderLayers();
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


  public redrawSource(id: string, data){
    if (this.getSource(id) !== undefined) {
      (this.getSource(id) as mapboxgl.GeoJSONSource).setData({
        'type': 'FeatureCollection',
        'features': data
      });
    }
  }



  public addControl(control: ControlButton, position?: ControlPosition);
  public addControl(control: Control | IControl, position?: ControlPosition,  eventOverride?: { event: string; fn: (e?) => void;});
  public addControl(control: Control | IControl | ControlButton,
                    position?: ControlPosition,
                    eventOverrid?: {
                      event: string; fn: (e?) => void;
                    }){
    this._mapProvider.addControl(control, position);
    if(control instanceof  ControlButton && eventOverrid){
      control.btn[eventOverrid.event] = () => eventOverrid.fn();
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

  public updateLayersVisibility(visibilityCondition: boolean, visibilityFilter: Array<any>, visibilityEvent: ExternalEvent,
                                collection?: string): void {
    if (this._mapLayers && this._mapLayers.externalEventLayers) {
      this._mapLayers.externalEventLayers.filter(layer => layer.on === visibilityEvent).forEach(layer => {
        if (this._mapProvider.getLayer(layer.id) !== undefined) {
          let originalLayerIsVisible = false;
          const fullLayer = this.layersMap.get(layer.id);
          const isCollectionCompatible = (!collection || (!!collection && (fullLayer.source as string).includes(collection)));
          if (isCollectionCompatible) {
            const originalLayerId = layer.id.replace('arlas-' + visibilityEvent.toString() + '-', '');
            if (this._mapProvider.getLayer(originalLayerId) !== undefined) {
              originalLayerIsVisible = (this._mapProvider.getLayer(originalLayerId) as ArlasAnyLayer).layout.visibility === 'visible';
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
              const condition = visibilityFilter;
              layerFilter.push(condition);
              this._mapProvider.setFilter(layer.id, layerFilter);
              this._mapProvider.setLayoutProperty(layer.id, 'visibility', 'visible');
            } else {
              this._mapProvider.setFilter(layer.id, (layer as any).filter);
              this._mapProvider.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          }
        }
      });
    }
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

  public disableLayoutVisibility(layer: string){
    this.setLayoutProperty(layer, 'visibility', 'none');
    this.setStrokeLayoutVisibility(layer, 'none');
    this.setScrollableLayoutVisibility(layer, 'none');
  }

  public enableLayoutVisibility(layer: string){
    this.setLayoutProperty(layer, 'visibility', 'visible');
    this.setStrokeLayoutVisibility(layer, 'visible');
    this.setScrollableLayoutVisibility(layer, 'visible');
  }


  public getColdOrHotLayers(){
    return this.getLayers().map(layer => layer.id)
      .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0);
  }

  public findVisualisationSetLayer(visuName: string){
    return this._visualisationSetsConfig.find(v => v.name === visuName).layers;
  }
  public setVisualisationSetLayers(visuName: string, layers: string[]){
    const f = this._visualisationSetsConfig.find(v => v.name === visuName);
    if(f){
      f.layers = layers;
    }
  }

  public addVisualisation(visualisation: VisualisationSetConfig, layers: Array<AnyLayer>, sources: Array<MapSource>): void {
    sources.forEach((s) => {
      if (typeof (s.source) !== 'string') {
        this.addSource(s.id, s.source);
      }
    });
    this._visualisationSetsConfig.unshift(visualisation);
    this.visualisationsSets.visualisations.set(visualisation.name, new Set(visualisation.layers));
    this.visualisationsSets.status.set(visualisation.name, visualisation.enabled);
    layers.forEach(layer => {
      this.addLayer(layer);
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
    this.on('load', fn);
  }

  public onMoveEnd() {
    return this._moveEnd$
      .pipe(map(e => {
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
      .subscribe(e => {
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

  // TODO: put in abstract class as they are not provider specific
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
    this.zoom = this.getZoom();
  }

  protected  _updateZoomStart(): void {
    this._zoomStart = this.getZoom();
  }

  public calcOffsetPoint() {
    return new mapboxgl.Point((this._offset.east + this._offset.west) / 2, (this._offset.north + this._offset.south) / 2);
  }


  protected getMoveEnd(){
    const offsetPoint = this.calcOffsetPoint();
    const centerOffsetPoint = this.project(this.getCenter()).add(offsetPoint);
    const centerOffSetLatLng = this.unproject(centerOffsetPoint);

    const southWest = this.getSouthWestBounds();
    const northEast = this.getNorthEastBounds();
    const bottomLeft = this.project(southWest);
    const topRght = this.project(northEast);
    const height = bottomLeft.y;
    const width = topRght.x;

    const bottomLeftOffset = bottomLeft.add(new mapboxgl.Point(this._offset.west, this._offset.south));
    const topRghtOffset = topRght.add(new mapboxgl.Point(this._offset.east, this._offset.north));

    const bottomLeftOffsetLatLng = this.unproject(bottomLeftOffset);
    const topRghtOffsetLatLng = this.unproject(topRghtOffset);

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
      center: this.getCenter().toArray(),
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
    const extendForLoadLatLng = paddedBounds(panLoad, panLoad, panLoad, panLoad, this.getMap(), southWest, northEast);
    const extendForTestdLatLng = paddedBounds(panTest, panTest, panTest, panTest, this.getMap(), southWest, northEast);
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
    this.fitBounds(bounds, paddedOptions);
  }

  public unsubscribeEvents(){
    this._eventSubscription.forEach(s => s.unsubscribe());
  }



  /** *******************************************
   ******************* WRAPPER *****************
   *********************************************
   *********************************************/


  public setCursorStyle(cursor: string){
    this._mapProvider.getCanvas().style.cursor = cursor;
  }

  public addSource(sourceId: string, source: AnySourceData) {
    this._mapProvider.addSource(sourceId, source);
  }

  public addLayer(layerId: AnyLayer, before?: string){
    return this._mapProvider.addLayer(layerId, before);
  }
  public getLayerFromMapProvider(layerId: string){
   return this._mapProvider.getLayer(layerId);
  }

  public moveLayer(id: string, before?: string){
    this._mapProvider.moveLayer(id, before);
  }

  public getSource(id: string){
    return this._mapProvider.getSource(id);
  }

  public getMap(): mapboxgl.Map {
    return this._mapProvider;
  }

  public setLayoutProperty(layer: string, name: string, value: any, options?: FilterOptions){
    this._mapProvider.setLayoutProperty(layer, name, value, options);
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

  public getWestBounds(){
    return this._mapProvider.getBounds().getWest();
  }
  public getNorthBounds(){
    return this._mapProvider.getBounds().getNorth();
  }

  public getNorthEastBounds(){
    return this._mapProvider.getBounds().getNorthEast();
  }
  public getSouthBounds(){
    return this._mapProvider.getBounds().getSouth();
  }

  public getSouthWestBounds(){
    return this._mapProvider.getBounds().getSouthWest();
  }
  public getEstBounds(){
    return this.getBounds().getEast();
  }

  public getZoom(){
    return this._mapProvider.getZoom();
  }

  public getCanvasContainer(){
    return this._mapProvider.getCanvasContainer();
  }

  public getLayers(){
    return this._mapProvider.getStyle().layers;
  }

  public enableDragPan(){
    this._mapProvider.dragPan.enable();
  }

  public disableDragPan(){
    this._mapProvider.dragPan.disable();
  }

  public flyTo(center, zoom: number){
    this._mapProvider.flyTo({ center, zoom });
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

  public on(event: string, func: (e) => void){
    this._mapProvider.on(event, func);
  }

  public getCenter(){
    return this._mapProvider.getCenter();
  }
}

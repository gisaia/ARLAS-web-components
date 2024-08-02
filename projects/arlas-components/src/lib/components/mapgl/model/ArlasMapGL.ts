import { BaseMapGL, BaseMapGlConfig, BindLayerToEvent, DrawControlsOption, MapEventBinds } from "./BaseMapGL";
import mapboxgl, {
  AnyLayer,
  AnySourceData,
  Control,
  FilterOptions,
  IControl, LngLatBoundsLike, LngLatLike,
  MapboxOptions,
  MapLayerEventType, PointLike
} from "mapbox-gl";
import { MapSource } from "./mapSource";
import { ArlasAnyLayer, MapExtend, paddedBounds } from "../mapgl.component.util";
import { ControlButton, PitchToggle } from "../mapgl.component.control";
import { GEOJSON_SOURCE_TYPE, OnMoveResult, VisualisationSetConfig } from "../mapgl.component";
import { ARLAS_ID, ExternalEvent, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from "./mapLayers";
import * as console from "console";
import { fromEvent, map } from "rxjs";
import { debounceTime } from "rxjs/operators";

export interface ArlasMapGlConfig extends BaseMapGlConfig<MapboxOptions> {
  mapLayers: MapLayers<AnyLayer>;
  customEventBind:BindLayerToEvent<keyof MapLayerEventType>[];
  mapLayersEventBind: {
    onHover: MapEventBinds<keyof MapLayerEventType>;
    emitOnClick: MapEventBinds<keyof MapLayerEventType>
    zoomOnClick: MapEventBinds<keyof MapLayerEventType>;
  }
}

export class ArlasMapGl extends BaseMapGL {
  _mapLayers: MapLayers<AnyLayer>;
  mapProvider: mapboxgl.Map;
  drawProvider;
  config: ArlasMapGlConfig;
  // points which xy coordinates are in screen referential
  start: mapboxgl.Point;
  current: mapboxgl.Point;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  startlngLat: mapboxgl.LngLat;
  endlngLat: mapboxgl.LngLat;
  movelngLat: mapboxgl.LngLat;

  init(config: ArlasMapGlConfig): void {
    this.initMapProvider(config);
    this.initControls();
    this.initImages();
    this.initOnLoad();
    this.initMapMoveEvents();
  }

  initMapProvider(config: ArlasMapGlConfig){
    this.mapProvider = new mapboxgl.Map(
      config.mapProviderOptions
    );
    // Disable map pitch and rotation with keyboard
    this.mapProvider.keyboard.disableRotation();

    // disable box zoom;
    this.mapProvider.boxZoom.disable();
  }

  /**
   *
   */
  initOnLoad(){
    this.onLoad(() => {
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
    })
  }

  initMapMoveEvents(){
   this._zoomStart$ = fromEvent(this.mapProvider, 'zoomstart')
      .pipe(debounceTime(750));

   this._dragStart$ = fromEvent(this.mapProvider, 'dragstart')
      .pipe(debounceTime(750));

    this._dragEnd$ = fromEvent(this.mapProvider, 'dragend')
      .pipe(debounceTime(750));

    this._moveEnd$ = fromEvent(this.mapProvider, 'moveend')
      .pipe(debounceTime(750));

    this.getMap().on('mousedown', (e) =>
      this._updateStartLngLat(e)
    )
    this.getMap().on('mouseup', (e) =>
      this._updateEndLngLat(e)
    )

    this.getMap().on('mousemove', (e) =>
      this._updateCurrentLngLat(e)
    )


    this.updateOnZoomStart();
    this.updateOnDragStart();
    this.updateOnDragEnd();
    this.updateOnMoveEnd();
  }


  initControls(): void {
    if(this.config.controls) {
      const controls = this.config.controls;
      if(controls.mapAttribution) {
        this.addControl(new mapboxgl.AttributionControl(controls.mapAttribution.config),controls.mapAttribution.position);
      }

      /** Whether to display scale */
      if (controls?.scale?.enable) {
        const defaultOpt = {
          maxWidth: this.config.maxWidthScale,
          unit: this.config.unitScale,
        };
        const opt = controls?.scale?.config ?? defaultOpt;
        const scale = new mapboxgl.ScaleControl(opt);
        this.addControl(scale, controls.scale?.position ?? 'bottom-right');
      }

      if(controls?.pitchToggle?.enable){
        const conf = controls.pitchToggle.config;
        this.addControl(new PitchToggle(conf.bearing, conf.pitch, conf.minpitchzoom), controls.pitchToggle?.position ?? 'top-right');
      }

      if(controls?.navigationControl?.enable) {
        this.addControl(new mapboxgl.NavigationControl(controls.navigationControl.config), controls.navigationControl?.position ?? 'top-right');
      }
    }
  }

  initSources(){
    if(this.config.dataSources){
      this.config.dataSources.forEach(id => {
        this.addSource(id, {type: GEOJSON_SOURCE_TYPE, data:  Object.assign({}, this.emptyData) })
      });
    }

    this.addSource(this.POLYGON_LABEL_SOURCE, {
      'type': GEOJSON_SOURCE_TYPE,
      'data': this.polygonlabeldata
    });

    if(this.config.mapSources){
      this.addSourcesToMap(this.config.mapSources)
    }

  }

  initMapLayers(){
    if(this.config?.mapLayers){
      this.setLayersMap(this.config.mapLayers as MapLayers<AnyLayer>);
      this.addVisuLayers();
      this.addExternalEventLayers();
      this.bindMapLayersEventZoomOnClick();
      this.bindMapLayersEventEmitOnClick();
      this.bindMapLayersEventOnHover();
    }
  }

  bindLayersToMapEvent(layers: string[] | Set<string>, binds: MapEventBinds<keyof  MapLayerEventType>){
    layers.forEach(layerId => {
      binds.mapEventBinds.forEach(el => {
        this.mapProvider.on(el.event, layerId, (e) => {
          el.fn(e);
        });
      })

    });
  }

  bindMapLayersEventZoomOnClick(){
    this.bindLayersToMapEvent(
      this.config.mapLayers.events.zoomOnClick,
      this.config.mapLayersEventBind.zoomOnClick
    );
  }



  bindMapLayersEventEmitOnClick(){
    this.bindLayersToMapEvent(
      this.config.mapLayers.events.emitOnClick,
      this.config.mapLayersEventBind.emitOnClick
    );
  }

  bindMapLayersEventOnHover() {
    this.bindLayersToMapEvent(
      this.config.mapLayers.events.onHover,
      this.config.mapLayersEventBind.onHover
    );
  }

  bindCustomEvent(){
    if(this.config.customEventBind){
      this.config.customEventBind.forEach(element =>
        this.bindLayersToMapEvent(element.layers, element.mapEventBinds)
      )
    }
  }

  private addVisuLayers() {
    if (!!this.config.visualisationSetsConfig) {
      for (let i = this.config.visualisationSetsConfig.length - 1; i >= 0; i--) {
        const visualisation: VisualisationSetConfig = this.config.visualisationSetsConfig[i];
        if (!!visualisation.layers) {
          for (let j = visualisation.layers.length - 1; j >= 0; j--) {
            const l = visualisation.layers[j];
            const layer = this.layersMap.get(l);
            const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
            const scrollableLayer = this.layersMap.get(scrollableId);
            if (!!scrollableLayer) {
              this.arlasAddLayer(scrollableId);
            }
            this.arlasAddLayer(l);
            /** add stroke layer if the layer is a fill */
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this.layersMap.get(strokeId);
              if (!!strokeLayer) {
                this.arlasAddLayer(strokeId);
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
    for (let i = this.config.visualisationSetsConfig.length - 1; i >= 0; i--) {
      const visualisation: VisualisationSetConfig = this.config.visualisationSetsConfig[i];
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

  private setStrokeLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer.type === 'fill') {
      const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
      const strokeLayer = this.layersMap.get(strokeId);
      if (!!strokeLayer) {
        this.setLayoutProperty(strokeId, 'visibility', visibility);
      }
    }
  }

  private setScrollableLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this.layersMap.get(layerId);
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollbaleLayer = this.layersMap.get(scrollableId);
    if (!!scrollbaleLayer) {
      this.setLayoutProperty(scrollableId, 'visibility', visibility);
    }
  }

  private initVisualisationSet(){
    if (this.config.visualisationSetsConfig) {
      this.config.visualisationSetsConfig.forEach(visu => {
        this.visualisationsSets.visualisations.set(visu.name, new Set(visu.layers));
        this.visualisationsSets.status.set(visu.name, visu.enabled);
      });
    }
  }

  initDrawControls(config: DrawControlsOption) {

    this.addControl(config.draw.control, (config.draw?.position ?? 'top-right'));

    if(config.addGeoBox.enable){
      const addGeoBoxButton = new ControlButton(config.addGeoBox?.name ?? 'addgeobox');
      this.addControl(addGeoBoxButton, config.addGeoBox?.position ?? 'top-right', config.addGeoBox?.overrideEvent);

    }
    if(config.addGeoBox.enable) {
      const removeAoisButton = new ControlButton('removeaois');
      this.addControl(removeAoisButton, config.removeAois?.position ?? 'top-right', config.removeAois?.overrideEvent);
    }
  }

  public setCursorStyle(cursor: string){
    this.mapProvider.getCanvas().style.cursor = cursor;
  }

  addSource(sourceId: string, source: AnySourceData) {
    this.mapProvider.addSource(sourceId, source);
  }

  setLayersMap(mapLayers: MapLayers<AnyLayer>, layers?: Array<AnyLayer>){
    if(mapLayers) {
      let mapLayersCopy = mapLayers;
      if(layers){
        mapLayersCopy.layers = mapLayersCopy.layers.concat(layers);
      }
      const layersMap = new Map();
      mapLayersCopy.layers.forEach(layer => layersMap.set(layer.id, layer));
      this.layersMap = layersMap;
    }
  }

  private arlasAddLayer(layerId: string,): void {
    const layer = this.layersMap.get(layerId);
    if (layer !== undefined && layer.id === layerId) {
      /** Add the layer if it is not already added */
      if (this.getLayerFromMapProvider(layerId) === undefined) {
        if (this.firstDrawLayer.length > 0) {
          /** draw layers must be on the top of the layers */
          this.mapProviderAddLayer(layer, this.firstDrawLayer);
        } else {
          this.mapProviderAddLayer(layer);
        }
      }
    } else {
      throw new Error('The layer `' + layerId + '` is not declared in `mapLayers.layers`');
    }
  }

  protected addSourcesToMap(sources: Array<MapSource>): void {
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
  mapProviderAddLayer(layerId: AnyLayer, before?:string){
    return this.mapProvider.addLayer(layerId, before);
  }
  getLayerFromMapProvider(layerId: string){
   return this.mapProvider.getLayer(layerId);
  }

  moveLayer(id: string, before?:string){
    this.mapProvider.moveLayer(id, before);
  }

  getSource(id: string){
    return this.mapProvider.getSource(id)
  }

  getMap(): mapboxgl.Map {
    return this.mapProvider;
  }

  getMapExtend(): MapExtend {
    const bounds = this.mapProvider.getBounds();
    return  { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.mapProvider.getZoom() };
  }

  initImages(){
    this.loadImage('assets/rotate/01.png', 'rotate');
    this.loadImage('assets/resize/01.png', 'resize');
  }

  loadImage(filePath: string, name: string, errorMessage?:string,  opt?: any){
    this.mapProvider.loadImage(filePath, (error, image) => {
      if (error) {
        console.warn(errorMessage);
      } else {
        if(opt){
          this.mapProvider.addImage(name, image, opt);
        } else {
          this.mapProvider.addImage(name, image);
        }
      }
    });
  }

  loadIcons(){
    if (this.config.icons) {
      this.config.icons.forEach(icon => {
        this.loadImage(
          this.ICONS_BASE_PATH + icon.path,
          icon.path.split('.')[0],
          'The icon "' + this.ICONS_BASE_PATH + icon.path + '" is not found',
          { 'sdf': icon.recolorable }
        );
      });
    }
  }

  public redrawSource(id:string, data){
    if (this.getSource(id) !== undefined) {
      (this.getSource(id) as mapboxgl.GeoJSONSource).setData({
        'type': 'FeatureCollection',
        'features': data
      });
    }
  }

  public setLayoutProperty(layer: string, name: string, value: any, options?: FilterOptions){
    this.mapProvider.setLayoutProperty(layer, name, value, options);
  }


  public addControl(control: ControlButton, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left",  eventOverrid?: {
    event: string, fn: () => void});
  public addControl(control: Control | IControl, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left");
  public addControl(control: Control | IControl | ControlButton, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left", eventOverrid?: {
    event: string, fn: () => void
  }){
    this.mapProvider.addControl(control, position);

    if(control instanceof  ControlButton && eventOverrid){
      control.btn[eventOverrid.event] = () => eventOverrid.fn();
    }
  }

  getBounds(){
    return this.mapProvider.getBounds();
  }

  fitBounds(bounds: LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions, eventData?: mapboxgl.EventData){
    this.mapProvider.fitBounds(bounds, options, eventData);
    return this;
  }

  setCenter(lngLat: [number, number]){
    this.mapProvider.setCenter(lngLat);
    return this;
  }

  getWestBounds(){
    return this.mapProvider.getBounds().getWest();
  }
  getNorthBounds(){
    return this.mapProvider.getBounds().getNorth();
  }

  getNorthEastBounds(){
    return this.mapProvider.getBounds().getNorthEast();
  }
  getSouthBounds(){
    return this.mapProvider.getBounds().getSouth();
  }

  getSouthWestBounds(){
    return this.mapProvider.getBounds().getSouthWest();
  }
  getEstBounds(){
    return this.getBounds().getEast();
  }

  getZoom(){
    return this.mapProvider.getZoom();
  }

  getCanvasContainer(){
    return this.mapProvider.getCanvasContainer();
  }

  public getLayers(){
    return this.mapProvider.getStyle().layers
  }

  /***
   * core arlas methode
   *
   * */
  public updateLayoutVisibility(visualisationName: string) {
    const visuStatus = !this.visualisationsSets.status.get(visualisationName);
    this.config.visualisationSetsConfig.find(v => v.name === visualisationName).enabled = visuStatus;
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
        if (this.mapProvider.getLayer(layer.id) !== undefined) {
          let originalLayerIsVisible = false;
          const fullLayer = this.layersMap.get(layer.id);
          const isCollectionCompatible = (!collection || (!!collection && (fullLayer.source as string).includes(collection)));
          if (isCollectionCompatible) {
            const originalLayerId = layer.id.replace('arlas-' + visibilityEvent.toString() + '-', '');
            if (this.mapProvider.getLayer(originalLayerId) !== undefined) {
              originalLayerIsVisible = (this.mapProvider.getLayer(originalLayerId) as ArlasAnyLayer).layout.visibility === 'visible';
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
              this.mapProvider.setFilter(layer.id, layerFilter);
              this.mapProvider.setLayoutProperty(layer.id, 'visibility', 'visible');
            } else {
              this.mapProvider.setFilter(layer.id, (layer as any).filter);
              this.mapProvider.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          }
        }
      });
    }
  }

  updateVisibility(visibilityStatus: Map<string, boolean>){
    visibilityStatus.forEach((visibilityStatus, l) => {
      let layerInVisualisations = false;
      if (!visibilityStatus) {
        this.config.visualisationSetsConfig.forEach(v => {
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
        this.config.visualisationSetsConfig.forEach(v => {
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

  public enableDragPan(){
    this.mapProvider.dragPan.enable();
  }

  public getColdOrHotLayers(){
    return this.getLayers().map(layer => layer.id)
      .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0);
  }

  public findVisualisationSetLayer(visuName:string){
    return this.config.visualisationSetsConfig.find(v => v.name === visuName).layers;
  }
  public setVisualisationSetLayers(visuName:string, layers: string[]){
    const f = this.config.visualisationSetsConfig.find(v => v.name === visuName);
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
    this.config.visualisationSetsConfig.unshift(visualisation);
    this.visualisationsSets.visualisations.set(visualisation.name, new Set(visualisation.layers));
    this.visualisationsSets.status.set(visualisation.name, visualisation.enabled);
    layers.forEach(layer => {
      this.mapProviderAddLayer(layer);
    });

    this.setLayersMap(this.config.mapLayers as MapLayers<AnyLayer>, layers)
    this.reorderLayers();
  }

  private addExternalEventLayers() {
    if (!!this.config.mapLayers.externalEventLayers) {
      this.config.mapLayers.layers
        .filter(layer => this.config.mapLayers.externalEventLayers.map(e => e.id).indexOf(layer.id) >= 0)
        .forEach(l => this.arlasAddLayer(l.id));
    }
  }

  flyTo(center, zoom: number){
    this.mapProvider.flyTo({ center, zoom });
  }
  queryRenderedFeatures(point){
    return this.mapProvider.queryRenderedFeatures(point);
  }

  public onLoad(fn: () => void): void {
    this.mapProvider.on('load', fn);
  }

  public onZoomStart(){
    return this._zoomStart$;
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
    this.eventSubscription.push(sub);
  }

  protected updateOnDragStart(){
    const sub = this._dragStart$.subscribe(e => this._updateDragStart(e));
    this.eventSubscription.push(sub);
  }

  protected updateOnDragEnd(){
    const sub = this._dragEnd$
      .subscribe(e => {
          this._updateDragEnd(e);
          this._updateMoveRatio(e);
      });
    this.eventSubscription.push(sub);
  }

  protected updateOnMoveEnd(){
    const sub = this._moveEnd$
      .subscribe(e => {
        this._updateBounds();
        this._updateZoom();
      });
    this.eventSubscription.push(sub);
  }

  _updateBounds(): void {
    this.west = this.getWestBounds();
    this.south = this.getSouthBounds();
    this.east = this.getEstBounds();
    this.north = this.getNorthBounds();
  }

  _updateCurrentLngLat(e: mapboxgl.MapMouseEvent): void {
    const lngLat = e.lngLat;
    if (this._displayCurrentCoordinates) {
      const displayedLngLat = this._wrapLatLng ? lngLat.wrap() : lngLat;
      this.currentLng = String(Math.round(displayedLngLat.lng * 100000) / 100000);
      this.currentLat = String(Math.round(displayedLngLat.lat * 100000) / 100000);
    }
  }

  _updateDragEnd(e:mapboxgl.MapboxEvent): void {
    this.dragEndX = e.originalEvent.clientX;
    this.dragEndY = e.originalEvent.clientY;
  }

  _updateDragStart(e:mapboxgl.MapboxEvent): void {
    this.dragStartX = e.originalEvent.clientX;
    this.dragStartY = e.originalEvent.clientY;
  }

  _updateEndLngLat(e:mapboxgl.MapMouseEvent): void {
    this.endlngLat = e.lngLat;
  }

  _updateMoveRatio(e: any): void {
    this.xMoveRatio = Math.abs(this.dragEndX - this.dragStartX) / e.target._canvas.clientWidth;
    this.yMoveRatio = Math.abs(this.dragEndY - this.dragStartY) / e.target._canvas.clientHeight;

  }

  _updateStartLngLat(e?:mapboxgl.MapMouseEvent): void {
    this.startlngLat = e.lngLat;
  }

  _updateZoom(): void {
    this.zoom = this.getZoom();
  }

  _updateZoomStart(): void {
    const sub = this._zoomStart$.subscribe(_ => this.zoomStart = this.getZoom());
  }

  calcOffsetPoint(){
    return new mapboxgl.Point((this._offset.east + this._offset.west) / 2, (this._offset.north + this._offset.south) / 2);
  }

  project(latlng :LngLatLike){
    return this.mapProvider.project(latlng);
  }

  unproject(latlng :PointLike){
    return this.mapProvider.unproject(latlng);
  }

  getCenter(){
    return this.mapProvider.getCenter();
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
      zoomStart: this.zoomStart,
      center: this.getCenter().toArray(),
      centerWithOffset: [centerOffSetLatLng.lng, centerOffSetLatLng.lat],
      extendWithOffset: [wrapNorthOffset, wrapWestOffset, wrapSouthOffset, wrapEastOffset],
      rawExtendWithOffset: [rawNorthOffset, rawWestOffset, rawSouthOffset, rawEastOffset],
      extend: [this.north, this.west, this.south, this.east],
      extendForLoad: [],
      extendForTest: [],
      rawExtendForLoad: [],
      rawExtendForTest: [],
      xMoveRatio: this.xMoveRatio,
      yMoveRatio: this.yMoveRatio,
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

}

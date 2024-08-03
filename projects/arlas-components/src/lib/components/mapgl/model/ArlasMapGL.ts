import { AbstractArlasMapGL, BaseMapGlConfig, BindLayerToEvent, DrawControlsOption, MapEventBinds } from "./AbstractArlasMapGL";
import mapboxgl, {
  AnyLayer,
  AnySourceData,
  Control,
  FilterOptions,
  IControl, LngLatBoundsLike, LngLatLike, MapboxEvent,
  MapboxOptions,
  MapLayerEventType, PointLike
} from "mapbox-gl";
import { MapSource } from "./mapSource";
import { ArlasAnyLayer, MapExtend, paddedBounds } from "../mapgl.component.util";
import { ControlButton, PitchToggle } from "../mapgl.component.control";
import { GEOJSON_SOURCE_TYPE, IconConfig, OnMoveResult, VisualisationSetConfig } from "../mapgl.component";
import { ARLAS_ID, ExternalEvent, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from "./mapLayers";
import { fromEvent, map } from "rxjs";
import { debounceTime } from "rxjs/operators";

export interface ArlasMapGlConfig extends BaseMapGlConfig<MapboxOptions> {
  mapLayers: MapLayers<AnyLayer>;
  customEventBind:BindLayerToEvent<keyof MapLayerEventType>[];
  mapLayersEventBind: {
    onHover: MapEventBinds<keyof MapLayerEventType>[];
    emitOnClick: MapEventBinds<keyof MapLayerEventType>[];
    zoomOnClick: MapEventBinds<keyof MapLayerEventType>[];
  }
}

export class ArlasMapGl extends AbstractArlasMapGL {
  _mapLayers: MapLayers<AnyLayer>;
  mapProvider: mapboxgl.Map;
  // points which xy coordinates are in screen referential
  start: mapboxgl.Point;
  current: mapboxgl.Point;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  startlngLat: mapboxgl.LngLat;
  endlngLat: mapboxgl.LngLat;
  movelngLat: mapboxgl.LngLat;

    constructor(protected config: ArlasMapGlConfig) {
      super(config);
    }

  protected initMapProvider(config: ArlasMapGlConfig){
    this.mapProvider = new mapboxgl.Map(
      config.mapProviderOptions
    );
    // Disable map pitch and rotation with keyboard
    this.mapProvider.keyboard.disableRotation();

    // disable box zoom;
    this.mapProvider.boxZoom.disable();
  }

  protected initOnLoad(){
    this.onLoad(() => {
      console.log('on load')
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

  protected initMapMoveEvents(){
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
        this.addControl(new mapboxgl.NavigationControl(this._controls.navigationControl.config), this._controls.navigationControl?.position ?? 'top-right');
      }
    }
  }

  protected initSources(){
    if(this._dataSources){
      this._dataSources.forEach(id => {
        this.addSource(id, {type: GEOJSON_SOURCE_TYPE, data:  Object.assign({}, this.emptyData) })
      });
    }

    this.addSource(this.POLYGON_LABEL_SOURCE, {
      'type': GEOJSON_SOURCE_TYPE,
      'data': this.polygonlabeldata
    });

    if(this._mapSources){
      this.addSourcesToMap(this._mapSources)
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

  protected initImages(){
    this.loadImage('assets/rotate/01.png', 'rotate');
    this.loadImage('assets/resize/01.png', 'resize');
  }

  protected loadImage(filePath: string, name: string, errorMessage?:string,  opt?: any){
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
        this.mapProvider.on(el.event, layerId, (e) => {
          el.fn(e);
        });
      })

    });
  }

  protected bindCustomEvent(){
    if(this.config.customEventBind){
      this.config.customEventBind.forEach(element =>
        this.bindLayersToMapEvent(element.layers, element.mapEventBinds)
      )
    }
  }

  protected addVisuLayers() {
    if (!!this._visualisationSetsConfig) {
      for (let i = this._visualisationSetsConfig.length - 1; i >= 0; i--) {
        const visualisation: VisualisationSetConfig = this._visualisationSetsConfig[i];
        if (!!visualisation.layers) {
          for (let j = visualisation.layers.length - 1; j >= 0; j--) {
            const l = visualisation.layers[j];
            const layer = this._layersMap.get(l);
            const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
            const scrollableLayer = this._layersMap.get(scrollableId);
            if (!!scrollableLayer) {
              this.addLayerInWritePlaceIfNotExist(scrollableId);
            }
            this.addLayerInWritePlaceIfNotExist(l);
            /** add stroke layer if the layer is a fill */
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this._layersMap.get(strokeId);
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
          const layer = this._layersMap.get(l);
          const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
          const scrollableLayer = this._layersMap.get(scrollableId);
          if (!!scrollableLayer && !!this.getLayerFromMapProvider(scrollableId)) {
            this.moveLayer(scrollableId);
          }
          if (!!this.getLayerFromMapProvider(l)) {
            this.moveLayer(l);
            if (layer.type === 'fill') {
              const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
              const strokeLayer = this._layersMap.get(strokeId);
              if (!!strokeLayer && !!this.getLayerFromMapProvider(strokeId)) {
                this.moveLayer(strokeId);
              }
              if (!!strokeLayer && !!strokeLayer.id) {
                const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + strokeLayer.id;
                const selectLayer = this._layersMap.get(selectId);
                if (!!selectLayer && !!this.getLayerFromMapProvider(selectId)) {
                  this.moveLayer(selectId);
                }
                const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + strokeLayer.id;
                const hoverLayer = this._layersMap.get(hoverId);
                if (!!hoverLayer && !!this.getLayerFromMapProvider(hoverId)) {
                  this.moveLayer(hoverId);
                }
              }
            }
          }
          const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + layer.id;
          const selectLayer = this._layersMap.get(selectId);
          if (!!selectLayer && !!this.getLayerFromMapProvider(selectId)) {
            this.moveLayer(selectId);
          }
          const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + layer.id;
          const hoverLayer = this._layersMap.get(hoverId);
          if (!!hoverLayer && !!this.getLayerFromMapProvider(hoverId)) {
            this.moveLayer(hoverId);
          }
        }
      }
    }

    this.getColdOrHotLayers().forEach(id => this.moveLayer(id));
  }

  protected setStrokeLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this._layersMap.get(layerId);
    if (layer.type === 'fill') {
      const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
      const strokeLayer = this._layersMap.get(strokeId);
      if (!!strokeLayer) {
        this.setLayoutProperty(strokeId, 'visibility', visibility);
      }
    }
  }

  protected setScrollableLayoutVisibility(layerId: string, visibility: string): void {
    const layer = this._layersMap.get(layerId);
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollbaleLayer = this._layersMap.get(scrollableId);
    if (!!scrollbaleLayer) {
      this.setLayoutProperty(scrollableId, 'visibility', visibility);
    }
  }



  public setCursorStyle(cursor: string){
    this.mapProvider.getCanvas().style.cursor = cursor;
  }

  public addSource(sourceId: string, source: AnySourceData) {
    this.mapProvider.addSource(sourceId, source);
  }

  public setLayersMap(mapLayers: MapLayers<AnyLayer>, layers?: Array<AnyLayer>){
    if(mapLayers) {
      let mapLayersCopy = mapLayers;
      if(layers){
        mapLayersCopy.layers = mapLayersCopy.layers.concat(layers);
      }
      const layersMap = new Map();
      mapLayersCopy.layers.forEach(layer => layersMap.set(layer.id, layer));
      this._layersMap = layersMap;
    }
  }

  public addLayerInWritePlaceIfNotExist(layerId: string): void {
    const layer = this._layersMap.get(layerId);
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
  public addLayer(layerId: AnyLayer, before?:string){
    return this.mapProvider.addLayer(layerId, before);
  }
  public getLayerFromMapProvider(layerId: string){
   return this.mapProvider.getLayer(layerId);
  }

  public moveLayer(id: string, before?:string){
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
    event: string, fn: (e?) => void});
  public addControl(control: Control | IControl, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left");
  public addControl(control: Control | IControl | ControlButton, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left", eventOverrid?: {
    event: string, fn: (e?) => void
  }){
    this.mapProvider.addControl(control, position);
    console.log('add', control)
    if(control instanceof  ControlButton && eventOverrid){
      control.btn[eventOverrid.event] = () => eventOverrid.fn();
    }
  }

  public getBounds(){
    return this.mapProvider.getBounds();
  }

  public fitBounds(bounds: LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions, eventData?: mapboxgl.EventData){
    this.mapProvider.fitBounds(bounds, options, eventData);
    return this;
  }

  public setCenter(lngLat: [number, number]){
    this.mapProvider.setCenter(lngLat);
    return this;
  }

  public getWestBounds(){
    return this.mapProvider.getBounds().getWest();
  }
  public getNorthBounds(){
    return this.mapProvider.getBounds().getNorth();
  }

  public getNorthEastBounds(){
    return this.mapProvider.getBounds().getNorthEast();
  }
  public getSouthBounds(){
    return this.mapProvider.getBounds().getSouth();
  }

  public getSouthWestBounds(){
    return this.mapProvider.getBounds().getSouthWest();
  }
  public getEstBounds(){
    return this.getBounds().getEast();
  }

  public getZoom(){
    return this.mapProvider.getZoom();
  }

  getCanvasContainer(){
    return this.mapProvider.getCanvasContainer();
  }

  public getLayers(){
    return this.mapProvider.getStyle().layers
  }


  public enableDragPan(){
    this.mapProvider.dragPan.enable();
  }

  /***
   * core arlas methode
   *
   * */
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
        if (this.mapProvider.getLayer(layer.id) !== undefined) {
          let originalLayerIsVisible = false;
          const fullLayer = this._layersMap.get(layer.id);
          const isCollectionCompatible = (!collection || (!!collection && (fullLayer.source as string).includes(collection)));
          if (isCollectionCompatible) {
            const originalLayerId = layer.id.replace('arlas-' + visibilityEvent.toString() + '-', '');
            if (this.mapProvider.getLayer(originalLayerId) !== undefined) {
              originalLayerIsVisible = (this.mapProvider.getLayer(originalLayerId) as ArlasAnyLayer).layout.visibility === 'visible';
            }
            const layerFilter: Array<any> = [];
            const externalEventLayer = this._layersMap.get(layer.id);
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

  public findVisualisationSetLayer(visuName:string){
    return this._visualisationSetsConfig.find(v => v.name === visuName).layers;
  }
  public setVisualisationSetLayers(visuName:string, layers: string[]){
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

    this.setLayersMap(this._mapLayers as MapLayers<AnyLayer>, layers)
    this.reorderLayers();
  }

  protected addExternalEventLayers() {
    if (!!this._mapLayers.externalEventLayers) {
      this._mapLayers.layers
        .filter(layer => this._mapLayers.externalEventLayers.map(e => e.id).indexOf(layer.id) >= 0)
        .forEach(l => this.addLayerInWritePlaceIfNotExist(l.id));
    }
  }

  public flyTo(center, zoom: number){
    this.mapProvider.flyTo({ center, zoom });
  }
  public queryRenderedFeatures(point){
    return this.mapProvider.queryRenderedFeatures(point);
  }

  public onLoad(fn: () => void): void {
    this.mapProvider.on('load', fn);
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

  _updateDragEnd(e:any): void {
    if(e.originalEvent){
      this.dragEndX = e.originalEvent.clientX;
      this.dragEndY = e.originalEvent.clientY;
    }
  }

  _updateDragStart(e:any): void {
    this.dragStartX = e.originalEvent.clientX;
    this.dragStartY = e.originalEvent.clientY;
  }

  _updateEndLngLat(e:any): void {
    this.endlngLat = e.lngLat;
  }

  _updateMoveRatio(e: any): void {
    this.xMoveRatio = Math.abs(this.dragEndX - this.dragStartX) / e.target._canvas.clientWidth;
    this.yMoveRatio = Math.abs(this.dragEndY - this.dragStartY) / e.target._canvas.clientHeight;
  }

  _updateStartLngLat(e: any): void {
    this.startlngLat = e.lngLat;
  }

  _updateZoom(): void {
    this._zoom = this.getZoom();
  }

  _updateZoomStart(): void {
    this.zoomStart = this.getZoom();
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
      zoom: this._zoom,
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

  unsubscribeEvents(){
    this.eventSubscription.forEach(s => s.unsubscribe());
  }

}

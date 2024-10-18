
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
export class ArlasMapboxGL extends AbstractArlasMapGL implements MapOverride {
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

  protected _initMapProvider(config: ArlasMapGlConfig){
    this._mapProvider = new mapboxgl.Map(
      config.mapProviderOptions
    );
    // Disable map pitch and rotation with keyboard
    this.getMapProvider().keyboard.disableRotation();

    // disable box zoom;
    this.getMapProvider().boxZoom.disable();
  }

  protected _initOnLoad(){
    this.onLoad(() => {
      console.log('on load');
      this._updateBounds();
      this._updateZoom();
      this.firstDrawLayer = this.getColdOrHotLayers()[0];
      this._initLoadIcons();
      this._initSources();
      this._initMapLayers();
      this.getMapProvider().showTileBoundaries = false;
      this._bindCustomEvent();
      // Fit bounds on current bounds to emit init position in moveend bus
      this.getMapProvider().fitBounds(this.getBounds());
      this._initVisualisationSet();
    });
  }

  protected _initMapMoveEvents(){
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

    this._updateOnZoomStart();
    this._updateOnDragStart();
    this._updateOnDragEnd();
    this._updateOnMoveEnd();
  }

  public _initControls(): void {
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

  protected _initSources(){
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

  protected _initVisualisationSet(){
    if (this.visualisationSetsConfig) {
      this.visualisationSetsConfig.forEach(visu => {
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

  protected _initImages(){
    this._loadInternalImage('assets/rotate/01.png', 'rotate');
    this._loadInternalImage('assets/resize/01.png', 'resize');
  }

  protected _loadInternalImage(filePath: string, name: string, errorMessage?: string, opt?: any){
    this.loadImage(filePath, (error, image) => {
      if (error) {
        console.warn(errorMessage);
      } else {
        if(opt){
          this.addImage(name, image, opt);
        } else {
          this.addImage(name, image);
        }
      }
    });
  }

  protected _initLoadIcons(){
    if (this._icons) {
      this._icons.forEach(icon => {
        this._loadInternalImage(
          this.ICONS_BASE_PATH + icon.path,
          icon.path.split('.')[0],
          'The icon "' + this.ICONS_BASE_PATH + icon.path + '" is not found',
          { 'sdf': icon.recolorable }
        );
      });
    }
  }

  protected _initMapLayers(){
    if(this._mapLayers){
      this.setLayersMap(this._mapLayers as MapLayers<AnyLayer>);
      this.addVisualLayers();
      this._addExternalEventLayers();

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

  protected _bindCustomEvent(){
    if(this.config.customEventBind){
      this.config.customEventBind.forEach(element =>
        this.bindLayersToMapEvent(element.layers, element.mapEventBinds)
      );
    }
  }

  protected addVisualLayers() {
    if (!!this.visualisationSetsConfig) {
      for (let i = this.visualisationSetsConfig.length - 1; i >= 0; i--) {
        const visualisation: VisualisationSetConfig = this.visualisationSetsConfig[i];
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


  public getMapExtend(): MapExtend {
    const bounds = this.getBounds();
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


  public getMapProvider(): mapboxgl.Map {
    return this._mapProvider;
  }

  public getLayers(){
    return this.getMapProvider().getStyle().layers;
  }

  public isLayerVisible(layer: ArlasAnyLayer): boolean {
    return layer.layout.visibility === 'visible';
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
    this.visualisationSetsConfig.unshift(visualisation);
    this.visualisationsSets.visualisations.set(visualisation.name, new Set(visualisation.layers));
    this.visualisationsSets.status.set(visualisation.name, visualisation.enabled);
    layers.forEach(layer => {
      this.addLayer(layer);
    });

    this.setLayersMap(this._mapLayers as MapLayers<AnyLayer>, layers);
    this.reorderLayers();
  }

  protected _addExternalEventLayers() {
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
        return this._getMoveEnd();
      }));
  }

  protected _updateOnZoomStart(){
    const sub = this._zoomStart$.subscribe(_ => this._updateZoomStart());
    this._eventSubscription.push(sub);
  }

  protected _updateOnDragStart(){
    const sub = this._dragStart$.subscribe(e => this._updateDragStart(e));
    this._eventSubscription.push(sub);
  }

  protected _updateOnDragEnd(){
    const sub = this._dragEnd$
      .subscribe(e => {
        this._updateDragEnd(e);
        this._updateMoveRatio(e);
      });
    this._eventSubscription.push(sub);
  }

  protected _updateOnMoveEnd(){
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
    this._east = this.getEastBounds();
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

  protected _getMoveEnd(){
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
    return this.getBounds().getWest();
  }
  public getNorthBounds(){
    return this.getBounds().getNorth();
  }

  public getNorthEastBounds(){
    return this.getBounds().getNorthEast();
  }
  public getSouthBounds(){
    return this.getBounds().getSouth();
  }

  public getSouthWestBounds(){
    return this.getBounds().getSouthWest();
  }
  public getEastBounds(){
    return this.getBounds().getEast();
  }

  /** *****
   ******* MAP PROVIDER WRAP
   *******/


  public addLayer(layer: AnyLayer, before?: string){
    this.getMapProvider().addLayer(layer, before);
    return this;
  }

  public moveLayer(id: string, before?: string){
    this.getMapProvider().moveLayer(id, before);
    return this;
  }

  public getSource(id: string){
    return this._mapProvider.getSource(id);
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

  public cameraForBounds(bounds: mapboxgl.LngLatBoundsLike,
                         options?: mapboxgl.CameraForBoundsOptions): mapboxgl.CameraForBoundsResult | undefined {
    return this._mapProvider.cameraForBounds(bounds, options);
  }

  public easeTo(options: mapboxgl.EaseToOptions, eventData?: mapboxgl.EventData): this {
    this._mapProvider.easeTo(options, eventData);
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

  public getLight(): mapboxgl.Light {
    return this._mapProvider.getLight();
  }

  public getMaxBounds(): mapboxgl.LngLatBounds | null {
    return this._mapProvider.getMaxBounds();
  }

  public getRenderWorldCopies(): boolean {
    return  this._mapProvider.getRenderWorldCopies() ;
  }

  public panTo(lnglat: mapboxgl.LngLatLike, options?: mapboxgl.AnimationOptions, eventdata?: mapboxgl.EventData): this {
    this._mapProvider.panTo(lnglat, options, eventdata);
    return this;
  }

  public removeFeatureState(target: mapboxgl.FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature, key?: string): void {
    this._mapProvider.removeFeatureState(target, key);
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

  public setMaxBounds(lnglatbounds?: mapboxgl.LngLatBoundsLike): this {
    this._mapProvider.setMaxBounds(lnglatbounds);
    return this;
  }

  public setMaxZoom(maxZoom?: number | null): this {
    this._mapProvider.setMaxZoom(maxZoom);
    return this;
  }

  public setMinZoom(minZoom?: number | null): this {
    this._mapProvider.setMinZoom(minZoom);
    return this;
  }

  public setPitch(pitch: number, eventData?: mapboxgl.EventData): this {
    this._mapProvider.setPitch(pitch, eventData);
    return this;
  }

  public setZoom(zoom: number, eventData?: mapboxgl.EventData): this {
    this._mapProvider.setZoom(zoom, eventData);
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

  public addSource(id: string, source: AnySourceData): this {
    this._mapProvider.addSource(id, source);
    return this;
  }

  public getBounds(){
    return this.getMapProvider().getBounds();
  }

}

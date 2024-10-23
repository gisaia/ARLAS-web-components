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
  DrawControlsOption,
  MapEventBinds,
  OnMoveResult,
  VisualisationSetConfig
} from "./AbstractArlasMapGL";
import maplibre, {
  AddLayerObject,
  AnimationOptions,
  CameraForBoundsOptions,
  CanvasSourceSpecification,
  ControlPosition,
  EaseToOptions,
  FeatureIdentifier,
  FitBoundsOptions,
  FlyToOptions, IControl,
  LngLatBounds,
  LngLatLike,
  MapEventType, MapGeoJSONFeature,
  MapLayerEventType, MapMouseEvent,
  MapOptions,
  PointLike, QueryRenderedFeaturesOptions,
  SourceSpecification,
  StyleImageInterface,
  StyleSetterOptions,
  StyleSpecification,
  TypedStyleLayer
} from 'maplibre-gl';

import { ARLAS_ID, FILLSTROKE_LAYER_PREFIX, MapLayers, SCROLLABLE_ARLAS_ID } from "./mapLayers";
import { MapExtend, paddedBounds } from "../mapgl.component.util";
import { ControlButton, PitchToggle } from "../mapgl.component.control";
import mapboxgl, { Control } from "mapbox-gl";


export interface ArlasMaplibreConfig extends BaseMapGlConfig<MapOptions>  {
  mapLayers: MapLayers<TypedStyleLayer>;
  customEventBind: BindLayerToEvent<keyof MapLayerEventType>[];
  mapLayersEventBind: {
    onHover: MapEventBinds<keyof MapLayerEventType>[];
    emitOnClick: MapEventBinds<keyof MapLayerEventType>[];
    zoomOnClick: MapEventBinds<keyof MapLayerEventType>[];
  };
}

export class ArlasMaplibre extends AbstractArlasMapGL{
  protected _mapLayers: MapLayers<TypedStyleLayer>;
  protected _mapProvider: maplibre.Map;
  endlngLat: any;
  layersMap: Map<string, any>;
  movelngLat: any;
  startlngLat: any;

  public constructor(protected config: ArlasMaplibreConfig) {
    super(config);
  }

  protected _initMapProvider(config: ArlasMaplibreConfig){
    this._mapProvider = new maplibre.Map(
      config.mapProviderOptions
    );
    this._mapProvider.addControl(new maplibre.NavigationControl());
    // Disable map pitch and rotation with keyboard
    this.getMapProvider().keyboard.disableRotation();

    // disable box zoom;
    this.getMapProvider().boxZoom.disable();
  }

  protected _initOnLoad(){
    super._initOnLoad({
      beforeOnLoadOption: () => {
        this.firstDrawLayer = this.getColdOrHotLayers()[0];
        this.getMapProvider().showTileBoundaries = false;
      },
      afterOnLoadOptions: () => {
        this.getMapProvider().fitBounds(this.getBounds());
      }
    });
  }

  public calcOffsetPoint() {
    return new maplibre.Point((this._offset.east + this._offset.west) / 2, (this._offset.north + this._offset.south) / 2);
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

    const bottomLeftOffset = bottomLeft.add(new maplibre.Point(this._offset.west, this._offset.south));
    const topRghtOffset = topRght.add(new maplibre.Point(this._offset.east, this._offset.north));

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

  protected _initControls(): void {
    console.log('init controls', this._controls);
    if(this._controls) {
      if(this._controls.mapAttribution) {
        this.addControl(new maplibre.AttributionControl(this._controls.mapAttribution.config),this._controls.mapAttribution.position);
      }

      /** Whether to display scale */
      if (this._controls?.scale?.enable) {
        const defaultOpt = {
          maxWidth: this._maxWidthScale,
          unit: this._unitScale,
        };
        const opt = this._controls?.scale?.config ?? defaultOpt;
        const scale = new maplibre.ScaleControl(opt);
        this.addControl(scale, this._controls.scale?.position ?? 'bottom-right');
      }

      if(this._controls?.pitchToggle?.enable){
        const conf = this._controls.pitchToggle.config;
        this.addControl(new PitchToggle(conf.bearing, conf.pitch, conf.minpitchzoom), this._controls.pitchToggle?.position ?? 'top-right');
      }

      if(this._controls?.navigationControl?.enable) {
        this.addControl(
          new maplibre.NavigationControl(this._controls.navigationControl.config),
          this._controls.navigationControl?.position ?? 'top-right');
      }
    }
  }

  protected _initMapMoveEvents(): void {
    super._initMapMoveEvents();
    this.getMapProvider().on('mousedown', (e) =>
      this._updateStartLngLat(e)
    );
    this.getMapProvider().on('mouseup', (e) =>
      this._updateEndLngLat(e)
    );

    this.getMapProvider().on('mousemove', (e) =>
      this._updateCurrentLngLat(e)
    );
  }


  addControl(control: IControl, position?: ControlPosition, eventOverride?: { event: string; fn: (e?) => void });
  addControl(control: IControl, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"): this;
  addControl(control: IControl, position?: ControlPosition | "top-right" | "top-left" | "bottom-right" | "bottom-left", eventOverride?: {
    event: string;
    fn: (e?) => void
  }) {
    console.log(control)
    this.getMapProvider().addControl(control, position);
    if(control instanceof  ControlButton && eventOverride){
      control.btn[eventOverride.event] = () => eventOverride.fn();
    }
    return this;
  }

  protected addVisualLayers(): void {

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

  // TODO : should fix any in source
  addVisualisation(visualisation: VisualisationSetConfig, layers: Array<any>, sources: Array<any>): void {
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

    this.setLayersMap(this._mapLayers as MapLayers<TypedStyleLayer>, layers);
    this.reorderLayers();
  }

  disableDragPan(): void {
    this.getMapProvider().dragPan.disable();
  }

  enableDragPan(): void {
    this.getMapProvider().dragPan.enable();
  }

  getBounds(): LngLatBounds {
    return this.getMapProvider().getBounds();
  }

  getColdOrHotLayers() {
    return this.getLayers().map(layer => layer.id)
      .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0);
  }

  getEastBounds(): any {
    return this.getBounds().getEast();
  }

  getLayers(): any {
    return this.getMapProvider().getStyle().layers;
  }

  getMapExtend(): MapExtend {
    const bounds = this.getBounds();
    return  { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.getMapProvider().getZoom() };
  }

  getMapProvider(): maplibre.Map {
    return this._mapProvider
  }

  getMaxBounds(): unknown {
    return this._mapProvider.getMaxBounds();
  }

  getNorthBounds(): number {
    return this.getBounds().getNorth();
  }

  getNorthEastBounds() {
    return this.getBounds().getNorthEast();
  }

  getSouthBounds(): number {
    return this.getBounds().getSouth();
  }

  getSouthWestBounds() {
    return this.getBounds().getSouthWest();
  }

  getWestBounds(): number  {
    return this.getBounds().getEast();
  }

  hasImage(id: string): boolean {
    return  this.getMapProvider().hasImage(id);
  }

  removeImage(id: string): void {
    this.getMapProvider().removeImage(id);
  }

  public initDrawControls(config: DrawControlsOption) {

    if(!(config.draw.control)) {
      console.warn(' Draw control is not instance of MapBoxDraw');
    } else {
      this.addControl(config.draw.control as IControl, (config.draw?.position ?? 'top-right'));
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

  isLayerVisible(layer: any): boolean {
    return layer.layout.visibility === 'visible';
  }

  onLoad(fn: () => void): void {
    this.getMapProvider().on('load', fn);
  }

  public paddedFitBounds(bounds: LngLatBounds, options?: maplibre.FitBoundsOptions) {
    const paddedOptions = Object.assign({}, options);
    paddedOptions.padding = {
      top: this._offset.north + this._fitBoundsPadding,
      bottom: this._offset.south + this._fitBoundsPadding,
      left: this._offset.west + this._fitBoundsPadding,
      right: this._offset.east + this._fitBoundsPadding
    };
    this.fitBounds(bounds, paddedOptions);
  }

  public redrawSource(id: string, data){
    if (this.getSource(id) !== undefined) {
      (this.getSource(id) as mapboxgl.GeoJSONSource).setData({
        'type': 'FeatureCollection',
        'features': data
      });
    }
  }

  resize(eventData?: unknown): this {
    this._mapProvider.resize(eventData);
    return this;
  }

  setCursorStyle(cursor: string): void {
    this.getMapProvider().getCanvas().style.cursor = cursor;
  }

  public setLayersMap(mapLayers: MapLayers<TypedStyleLayer>, layers?: Array<TypedStyleLayer>){
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

  setMaxBounds(lnglatbounds?: maplibre.LngLatBoundsLike): this {
    this._mapProvider.setMaxBounds(lnglatbounds);
    return this;
  }

  public setMinZoom(minZoom?: number): this {
    this._mapProvider.setMinZoom(minZoom);
    return this;
  }
  public setMaxZoom(maxZoom?: number): this {
    this._mapProvider.setMaxZoom(maxZoom);
    return this;
  }
  public project(lngLat: maplibre.LngLat): unknown {
    return this._mapProvider.project(lngLat);
  }
  public unproject(point: maplibre.PointLike): unknown {
    return this._mapProvider.unproject(point);
  }
  public queryRenderedFeatures(pointOrBox?: PointLike | [PointLike, PointLike], options?: { layers?: string[]; filter?: any[]; }): MapGeoJSONFeature[] {
    return this._mapProvider.queryRenderedFeatures(pointOrBox, options as QueryRenderedFeaturesOptions);
  }
  public setStyle(style:StyleSpecification, options?: { diff?: boolean; localIdeographFontFamily?: string; }): this {
    this._mapProvider.setStyle(style, options);
    return this;
  }
  public getStyle(): StyleSpecification {
    return this._mapProvider.getStyle();
  }
  public addSource(id: string, source: SourceSpecification | CanvasSourceSpecification): this {
    this._mapProvider.addSource(id, source);
    return this;
  }
  public removeSource(id: string): this {
    this._mapProvider.removeSource(id);
    return this;
  }
  public getSource(id: string): unknown {
    return this._mapProvider.getSource(id);
  }
  public addImage(name: string, image: HTMLImageElement | ImageBitmap | ImageData | {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
} | StyleImageInterface, options?: { pixelRatio?: number; sdf?: boolean; }): this {
    this._mapProvider.addImage(name, image);
    return this;
  }
  public loadImage(url: string, callback: (error: any, image: any) => void): this {
    this._mapProvider.loadImage(url)
      .then(res => {
        callback( null , res.data);
      })
      .catch(err => {
        callback(err, null);
      });
    return this;
  }
  public addLayer(layer: AddLayerObject, before?: string): this {
    this.getMapProvider().addLayer(layer, before);
    return this;
  }
  public moveLayer(id: string, beforeId?: string): this {
    this.getMapProvider().moveLayer(id, beforeId);
    return this;
  }
  public removeLayer(id: string): this {
    this._mapProvider.removeLayer(id);
    return this;
  }
  public getLayer(id: string): unknown {
    return this.getMapProvider().getStyle().layers;
  }
  public setFilter(layer: string, filter?: boolean | any[], options?: StyleSetterOptions): this {
    this._mapProvider.setFilter(layer, filter as any, options);
    return this;
  }
  public getLight(): unknown {
    return this._mapProvider.getLight();
  }
  public setFeatureState(feature: FeatureIdentifier, state: { [key: string]: any; }): void {
    this._mapProvider.setFeatureState(feature, state);
  }
  public getFeatureState(feature: FeatureIdentifier): { [key: string]: any; } {
    return this._mapProvider.getFeatureState(feature);
  }
  public removeFeatureState(target: FeatureIdentifier, key?: string): void {
    this._mapProvider.removeFeatureState(target, key);
  }
  public getContainer(): HTMLElement {
    return this._mapProvider.getContainer();
  }
  public getCanvasContainer(): HTMLElement {
    return this._mapProvider.getCanvasContainer();
  }
  public getCanvas(): HTMLCanvasElement {
    return this._mapProvider.getCanvas();
  }
  public getCenter():  maplibre.LngLat {
    return this._mapProvider.getCenter();
  }
  public setCenter(center: LngLatLike, eventData?: any): this {
     this._mapProvider.setCenter(center, eventData);
     return this;
  }
  public panTo(lnglat: LngLatLike, options?: AnimationOptions, eventdata?: any): this {
    this._mapProvider.panTo(lnglat, options, eventdata);
    return this;
  }
  public getZoom(): number {
    return this._mapProvider.getZoom();
  }
  public setZoom(zoom: number,  eventdata?: any): this {
    this._mapProvider.setZoom(zoom, eventdata);
    return this;
  }
  public getBearing(): number {
    return this._mapProvider.getBearing();
  }
  public setBearing(bearing: number, eventData?: any): this {
    this._mapProvider.setBearing(bearing, eventData);
    return this;
  }
  public rotateTo(bearing: number, options?: AnimationOptions, eventData?: any): this {
    this._mapProvider.rotateTo(bearing, options, eventData);
    return this;
  }
  public setPitch(pitch: number, eventData?: any): this {
    this._mapProvider.setPitch(pitch, eventData);
    return this;
  }
  public cameraForBounds(bounds: LngLatBounds, options?: CameraForBoundsOptions): unknown {
    return this._mapProvider.cameraForBounds(bounds, options);
  }
  public fitBounds(bounds: LngLatBounds, options?: FitBoundsOptions, eventData?: any): this {
    this._mapProvider.fitBounds(bounds, options, eventData);
    return this;
  }

  public easeTo(options: EaseToOptions, eventData?: any): this {
    this._mapProvider.easeTo(options, eventData);
    return this;;
  }
  public flyTo(options: FlyToOptions, eventData?: any): this {
    this._mapProvider.flyTo(options, eventData);
    return this;
  }
  public on<T extends never>(type: T, layer: string, listener: (ev: unknown) => void): this;
  public on<T extends never>(type: T, listener: (ev: unknown) => void): this;
  public on(type: string, listener: (ev: any) => void): this;
  public on(type, layer, listener?): this {
    this._mapProvider.on(type, layer, listener);
    return this;
  }
  public once<T extends never>(type: T, layer: string, listener: (ev: unknown) => void): this;
  public once<T extends never>(type: T, listener: (ev: unknown) => void): this;
  public once(type: string, listener: (ev: any) => void): this;
  public once(type, layer, listener?): this {
    this._mapProvider.once(type, layer, listener);
    return  this;
  }

}

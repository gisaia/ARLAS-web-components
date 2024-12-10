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

import maplibregl, {
  AddLayerObject,
  AnimationOptions,
  CameraForBoundsOptions,
  CanvasSourceSpecification,
  CenterZoomBearing,
  ControlPosition,
  EaseToOptions,
  FeatureIdentifier,
  FitBoundsOptions,
  FlyToOptions,
  IControl,
  LngLat,
  LngLatBounds,
  LngLatLike,
  MapGeoJSONFeature,
  MapLayerEventType,
  MapOptions,
  Point,
  PointLike,
  QueryRenderedFeaturesOptions,
  SourceSpecification,
  StyleImageInterface,
  StyleSetterOptions,
  StyleSpecification,
  TypedStyleLayer
} from 'maplibre-gl';
import { AbstractArlasMapGL, BindLayerToEvent, MapConfig, MapEventBinds, OnMoveResult } from 'arlas-map';
import { MapLayers } from 'arlas-map';
import { MaplibreControlButton, MaplibrePitchToggle } from './model/controls';
import { ControlButton, DrawControlsOption } from 'arlas-map';
import { VisualisationSetConfig } from 'arlas-map';
import { MapExtent } from 'arlas-map';
import { ArlasMapSource } from 'arlas-map';
import { MaplibreSourceType } from './model/sources';
import bbox from '@turf/bbox';




export interface ArlasMaplibreConfig extends MapConfig<MapOptions> {
  mapLayers: MapLayers<TypedStyleLayer>;
  customEventBind: (map: AbstractArlasMapGL) => BindLayerToEvent<MapLayerEventType>[];
  mapLayersEventBind: {
    onHover: MapEventBinds<keyof MapLayerEventType>[];
    emitOnClick: MapEventBinds<keyof MapLayerEventType>[];
    zoomOnClick: MapEventBinds<keyof MapLayerEventType>[];
  };
}

export class ArlasMaplibreGL extends AbstractArlasMapGL {
  protected _mapLayers: MapLayers<TypedStyleLayer>;
  protected _mapProvider: maplibregl.Map;
  public endlngLat: maplibregl.LngLat;
  public layersMap: Map<string, any>;
  public movelngLat: maplibregl.LngLat;
  public startlngLat: maplibregl.LngLat;

  public constructor(protected config: ArlasMaplibreConfig) {
    super(config);
  }

  protected _initMapProvider(config: ArlasMaplibreConfig) {
    console.log('init map provider');
    this._mapProvider = new maplibregl.Map(
      config.mapProviderOptions
    );
    // Disable map pitch and rotation with keyboard
    this.getMapProvider().keyboard.disableRotation();

    // disable box zoom;
    this.getMapProvider().boxZoom.disable();
  }

  public calcOffsetPoint() {
    return new maplibregl.Point((this._offset.east + this._offset.west) / 2, (this._offset.north + this._offset.south) / 2);
  }

  public paddedBounds(npad: number, spad: number, epad: number, wpad: number, map: maplibregl.Map, SW, NE): LngLat[] {
    const topRight = map.project(NE);
    const bottomLeft = map.project(SW);
    const scale = 1;
    const southWestToPoint = map.project(SW);
    const southWestPoint = new Point(((southWestToPoint.x - bottomLeft.x) * scale) - wpad, ((southWestToPoint.y - topRight.y) * scale) + spad);
    const southWestWorld = new Point(southWestPoint.x / scale + bottomLeft.x, southWestPoint.y / scale + topRight.y);
    const swWorld = map.unproject(southWestWorld);
    const northEastToPoint = map.project(NE);
    const northEastPoint = new Point(((northEastToPoint.x - bottomLeft.x) * scale) + epad, ((northEastToPoint.y - topRight.y) * scale) - npad);
    const northEastWorld = new Point(northEastPoint.x / scale + bottomLeft.x, northEastPoint.y / scale + topRight.y);
    const neWorld = map.unproject(northEastWorld);
    return [swWorld, neWorld];
  }

  protected _getMoveEnd() {
    const offsetPoint = this.calcOffsetPoint();
    const centerOffsetPoint = this.getMapProvider().project(this.getMapProvider().getCenter()).add(offsetPoint);
    const centerOffSetLatLng = this.getMapProvider().unproject(centerOffsetPoint);

    const southWest = this.getSouthWestBounds();
    const northEast = this.getNorthEastBounds();
    const bottomLeft = this.getMapProvider().project(southWest);
    const topRght = this.getMapProvider().project(northEast);
    const height = bottomLeft.y;
    const width = topRght.x;

    const bottomLeftOffset = bottomLeft.add(new maplibregl.Point(this._offset.west, this._offset.south));
    const topRghtOffset = topRght.add(new maplibregl.Point(this._offset.east, this._offset.north));

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
    const extendForLoadLatLng = this.paddedBounds(panLoad, panLoad, panLoad, panLoad, this.getMapProvider(), southWest, northEast);
    const extendForTestdLatLng = this.paddedBounds(panTest, panTest, panTest, panTest, this.getMapProvider(), southWest, northEast);
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
    if (this._controls) {
      if (this._controls.mapAttribution) {
        this.addControl(new maplibregl.AttributionControl(this._controls.mapAttribution.config), this._controls.mapAttribution.position);
      }

      /** Whether to display scale */
      if (this._controls?.scale?.enable) {
        const defaultOpt = {
          maxWidth: this._maxWidthScale,
          unit: this._unitScale,
        };
        const opt = this._controls?.scale?.config ?? defaultOpt;
        const scale = new maplibregl.ScaleControl(opt);
        this.addControl(scale, this._controls.scale?.position ?? 'bottom-right');
      }

      if (this._controls?.pitchToggle?.enable) {
        const conf = this._controls.pitchToggle.config;
        this.addControl(new MaplibrePitchToggle(conf.bearing, conf.pitch, conf.minpitchzoom),
          this._controls.pitchToggle?.position ?? 'top-right');
      }

      if (this._controls?.navigationControl?.enable) {
        this.addControl(
          new maplibregl.NavigationControl(this._controls.navigationControl.config),
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


  public bindLayersToMapEvent(map: ArlasMaplibreGL, layers: string[] | Set<string>, binds: MapEventBinds<keyof MapLayerEventType>[]) {
    layers.forEach(layerId => {
      binds.forEach(el => {
        this.getMapProvider().on(el.event, layerId, (e) => {
          el.fn(e, map);
        });
      });
    });
  }

  public addControl(control: IControl, position?: ControlPosition, eventOverride?: { event: string; fn: (e?) => void; });
  public addControl(control: IControl, position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'): this;
  public addControl(control: IControl, position?: ControlPosition | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left', eventOverride?: {
    event: string;
    fn: (e?) => void;
  }) {
    console.log(control);
    this.getMapProvider().addControl(control, position);
    if (control instanceof ControlButton && eventOverride) {
      control.btn[eventOverride.event] = () => eventOverride.fn();
    }
    return this;
  }



  // TODO : should fix any in source
  public addVisualisation(visualisation: VisualisationSetConfig, layers: Array<any>,
    sources: Array<ArlasMapSource<MaplibreSourceType>>): void {
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
    // TODO : should fix any in source
    this.setLayersMap(this._mapLayers as MapLayers<TypedStyleLayer>, layers);
    this.reorderLayers();
  }

  public disableDragPan(): void {
    this.getMapProvider().dragPan.disable();
  }

  public enableDragPan(): void {
    this.getMapProvider().dragPan.enable();
  }

  public getBounds(): LngLatBounds {
    return this.getMapProvider().getBounds();
  }

  public getColdOrHotLayers() {
    return this.getLayers().map(layer => layer.id)
      .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0);
  }

  public getEastBounds(): any {
    return this.getBounds().getEast();
  }

  public getLayers(): any {
    return this.getMapProvider().getStyle().layers;
  }

  public getMapExtend(): MapExtent {
    const bounds = this.getBounds();
    return { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.getMapProvider().getZoom() };
  }

  public getMapProvider(): maplibregl.Map {
    return this._mapProvider;
  }

  public getMaxBounds(): unknown {
    return this._mapProvider.getMaxBounds();
  }

  public getNorthBounds(): number {
    return this.getBounds().getNorth();
  }

  public getNorthEastBounds() {
    return this.getBounds().getNorthEast();
  }

  public getSouthBounds(): number {
    return this.getBounds().getSouth();
  }

  public getSouthWestBounds() {
    return this.getBounds().getSouthWest();
  }

  public getWestBounds(): number {
    return this.getBounds().getWest();
  }

  public hasImage(id: string): boolean {
    return this.getMapProvider().hasImage(id);
  }


  public initDrawControls(config: DrawControlsOption) {

    if (!(config.draw.control)) {
      console.warn(' Draw control is not instance of MapBoxDraw');
    } else {
      this.addControl(config.draw.control as IControl, (config.draw?.position ?? 'top-right'));
    }

    if (config.addGeoBox.enable) {
      const addGeoBoxButton = new MaplibreControlButton(config.addGeoBox?.name ?? 'addgeobox');
      this.addControl(addGeoBoxButton, config.addGeoBox?.position ?? 'top-right', config.addGeoBox?.overrideEvent);

    }
    if (config.addGeoBox.enable) {
      const removeAoisButton = new MaplibreControlButton('removeaois');
      this.addControl(removeAoisButton, config.removeAois?.position ?? 'top-right', config.removeAois?.overrideEvent);
    }
  }

  public isLayerVisible(layer: any): boolean {
    return layer.layout.visibility === 'visible';
  }

  public onLoad(fn: () => void): void {
    this.getMapProvider().on('load', fn);
  }


  /** Gets bounds of the given geometry */
  public geometryToBound(geometry: any, paddingPercentage?: number): unknown {
    const boundingBox: any = bbox(geometry);
    let west = boundingBox[0];
    let south = boundingBox[1];
    let east = boundingBox[2];
    let north = boundingBox[3];
    if (paddingPercentage !== undefined) {
      let width = east - west;
      let height = north - south;
      /** if there is one hit, then west=east ===> we consider a width of 0.05°*/
      if (width === 0) {
        width = 0.05;
      }
      /** if there is one hit, then north=south ===> we consider a height of 0.05°*/
      if (height === 0) {
        height = 0.05;
      }
      west = west - paddingPercentage * width;
      south = Math.max(-90, south - paddingPercentage * height);
      east = east + paddingPercentage * width;
      north = Math.min(90, north + paddingPercentage * height);
    }
    const maplibreBounds = new LngLatBounds(
      new LngLat(west, south),
      new LngLat(east, north)
    );
    return maplibreBounds;
  }

  public paddedFitBounds(bounds: LngLatBounds, options?: maplibregl.FitBoundsOptions) {
    const paddedOptions = Object.assign({}, options);
    paddedOptions.padding = {
      top: this._offset.north + this._fitBoundsPadding,
      bottom: this._offset.south + this._fitBoundsPadding,
      left: this._offset.west + this._fitBoundsPadding,
      right: this._offset.east + this._fitBoundsPadding
    };
    this.fitBounds(bounds, paddedOptions);
  }

  public redrawSource(id: string, data) {
    if (this.getSource(id) !== undefined) {
      (this.getSource(id) as maplibregl.GeoJSONSource).setData({
        'type': 'FeatureCollection',
        'features': data
      });
    }
  }

  public resize(eventData?: unknown): this {
    this._mapProvider.resize(eventData);
    return this;
  }

  public setCursorStyle(cursor: string): void {
    this.getMapProvider().getCanvas().style.cursor = cursor;
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

  public setMaxBounds(lnglatbounds?: maplibregl.LngLatBoundsLike): this {
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
  public project(lngLat: maplibregl.LngLat): unknown {
    return this._mapProvider.project(lngLat);
  }
  public unproject(point: maplibregl.PointLike): unknown {
    return this._mapProvider.unproject(point);
  }
  public queryRenderedFeatures(pointOrBox?: PointLike | [PointLike, PointLike],
    options?: { layers?: string[]; filter?: any[]; }): MapGeoJSONFeature[] {
    return this._mapProvider.queryRenderedFeatures(pointOrBox, options as QueryRenderedFeaturesOptions);
  }
  public setFilter(layer: string, filter?: boolean | any[], options?: StyleSetterOptions): this {
    this._mapProvider.setFilter(layer, filter as any, options);
    return this;
  }
  public getLight() {
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
  public getCenter(): maplibregl.LngLat {
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
  public setZoom(zoom: number, eventdata?: any): this {
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
  public cameraForBounds(bounds: LngLatBounds, options?: CameraForBoundsOptions): CenterZoomBearing {
    return this._mapProvider.cameraForBounds(bounds, options);
  }
  public fitBounds(bounds: LngLatBounds, options?: FitBoundsOptions, eventData?: any): this {
    this._mapProvider.fitBounds(bounds, options, eventData);
    return this;
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
  public once<T extends never>(type: T, layer: string, listener: (ev: any) => void): this;
  public once<T extends never>(type: T, listener: (ev: any) => void): this;
  public once(type: string, listener: (ev: any) => void): this;
  public once(type, layer, listener?): this {
    this._mapProvider.once(type, layer, listener);
    return this;
  }

}

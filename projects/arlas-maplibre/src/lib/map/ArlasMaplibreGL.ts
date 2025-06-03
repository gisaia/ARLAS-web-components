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
  AbstractArlasMapGL, ArlasLngLat, ArlasLngLatBounds,
  ControlButton, DrawControlsOption, MapConfig, MapExtent, OnMoveResult
} from 'arlas-map';
import maplibregl, {
  ControlPosition,
  Expression,
  FitBoundsOptions,
  IControl,
  LngLat,
  LngLatBounds,
  MapGeoJSONFeature,
  Map as MaplibreMap,
  MapOptions,
  Point,
  PointLike,
  QueryRenderedFeaturesOptions,
  StyleSetterOptions,
} from 'maplibre-gl';
import { MaplibreControlButton, MaplibrePitchToggle } from './model/controls';


// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ArlasMaplibreConfig extends MapConfig<MapOptions> { }

export class ArlasMaplibreGL extends AbstractArlasMapGL {
  public setCenter(lngLat: [number, number]) {
    this._mapProvider.setCenter(lngLat);
    return this;
  }

  public getCanvasContainer() {
    return this._mapProvider.getCanvasContainer();
  }

  public resize(eventData?: unknown): this {
    this._mapProvider.resize(eventData);
    return this;
  }

  protected _mapProvider: maplibregl.Map;
  public endLngLat: maplibregl.LngLat;
  public moveLngLat: maplibregl.LngLat;
  public startLngLat: maplibregl.LngLat;

  public constructor(protected config: ArlasMaplibreConfig) {
    super(config);
  }

  protected _initMapProvider(config: ArlasMaplibreConfig) {
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

  public paddedBounds(npad: number, spad: number, epad: number, wpad: number, map: maplibregl.Map, SW: ArlasLngLat, NE: ArlasLngLat): LngLat[] {
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


  public on(type: string, listener: (ev: any) => void): this {
    this.getMapProvider().on(type, listener);
    return this;
  }

  protected _getMoveEnd(visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  }) {
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
    visualisationsSets.status.forEach((b, vs) => {
      if (b) {
        visualisationsSets.visualisations.get(vs).forEach(l => visibleLayers.add(l));
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

  public addControl(control: IControl, position?: ControlPosition, eventOverride?: { event: string; fn: (e?) => void; });
  public addControl(control: IControl, position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'): this;
  public addControl(control: IControl, position?: ControlPosition | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left', eventOverride?: {
    event: string;
    fn: (e?) => void;
  }) {
    this.getMapProvider().addControl(control, position);
    if (control instanceof ControlButton && eventOverride) {
      control.btn[eventOverride.event] = () => eventOverride.fn();
    }
    return this;
  }


  public setFilter(layer: string, filter?: boolean | any[], options?: StyleSetterOptions): this {
    this._mapProvider.setFilter(layer, filter as any, options);
    return this;
  }

  public setLayerOpacity(layer: string, layerType: string, opacityValue: Expression | number): this {
      this._mapProvider.setPaintProperty(layer, layerType + '-opacity', opacityValue);
      return this;
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

  public getMapProvider(): MaplibreMap {
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

  public getSouthWestBounds(): ArlasLngLat {
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
    if (config.removeAois.enable) {
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


  /**
   * @description Fits to given bounds + padding provided by the map configuration.
   * @param bounds Bounds defined by sw and ne coordinates Or a [west, south, east, north] array.
   */
  public fitToPaddedBounds(bounds: ArlasLngLatBounds | [number, number, number, number]) {
    const boundsOptions: maplibregl.FitBoundsOptions = {};
    boundsOptions.padding = {
      top: this._offset.north + this._fitBoundsPadding,
      bottom: this._offset.south + this._fitBoundsPadding,
      left: this._offset.west + this._fitBoundsPadding,
      right: this._offset.east + this._fitBoundsPadding
    };
    this.fitBounds(bounds, boundsOptions);
  }


  public setMaxBounds(lnglatbounds?: maplibregl.LngLatBoundsLike): this {
    this.getMapProvider().setMaxBounds(lnglatbounds);
    return this;
  }


  public queryRenderedFeatures(pointOrBox?: PointLike | [PointLike, PointLike],
    options?: { layers?: string[]; filter?: any[]; }): MapGeoJSONFeature[] {
    return this._mapProvider.queryRenderedFeatures(pointOrBox, options as QueryRenderedFeaturesOptions);
  }

  public getZoom(): number {
    return this._mapProvider.getZoom();
  }


  public fitBounds(bounds: ArlasLngLatBounds | number[] | LngLatBounds, options?: FitBoundsOptions, eventData?: any): this {
    this._mapProvider.fitBounds(this.toMaplibreBound(bounds), options, eventData);
    return this;
  }

  /**
   * @param bounds Bounds defined by ARLAS
   * @returns Transforms the ArlasLngLatBounds to LngLatBounds as defined by maplibre
   */
  private toMaplibreBound(bounds: ArlasLngLatBounds | number[] | LngLatBounds) {
    if (bounds instanceof ArlasLngLatBounds) {
      return new LngLatBounds(bounds.sw, bounds.ne);
    } else {
      return new LngLatBounds(bounds as [number, number, number, number]);

    }
  }


}

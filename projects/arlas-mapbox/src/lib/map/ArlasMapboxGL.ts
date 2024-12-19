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
  MapConfig,
  OnMoveResult,
} from 'arlas-map';
import mapboxgl, {
  AnyLayer,
  Control,
  IControl,
  LngLat,
  LngLatBounds,
  LngLatBoundsLike,
  MapboxOptions,
  Point
} from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import {
  MapLayers, ControlButton, ControlPosition, DrawControlsOption,
  MapExtent
} from 'arlas-map';
import { ArlasAnyLayer } from './model/layers';
import { MapBoxControlButton, MapBoxPitchToggle } from './model/controls';
import bbox from '@turf/bbox';
import { ArlasLngLat } from 'arlas-map';
import { ArlasLngLatBounds } from 'arlas-map';

export interface ArlasMapboxConfig extends MapConfig<MapboxOptions> {
  mapLayers: MapLayers<AnyLayer>;
}

export class ArlasMapboxGL extends AbstractArlasMapGL {

  protected _mapProvider: mapboxgl.Map;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  public startLngLat: mapboxgl.LngLat;
  public endlngLat: mapboxgl.LngLat;
  public movelngLat: mapboxgl.LngLat;

  public constructor(protected config: ArlasMapboxConfig) {
    super(config);
  }

  public paddedBounds(npad: number, spad: number, epad: number, wpad: number, map: mapboxgl.Map, SW: ArlasLngLat, NE: ArlasLngLat): LngLat[] {
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

  /**
   * Creates a mapboxgl map instance
   * @param config Mapbox configuration at instanciation.
   */
  protected _initMapProvider(config: ArlasMapboxConfig) {
    this._mapProvider = new mapboxgl.Map(
      config.mapProviderOptions
    );
    // Disable map pitch and rotation with keyboard
    this.getMapProvider().keyboard.disableRotation();

    // disable box zoom;
    this.getMapProvider().boxZoom.disable();
  }

  protected _initMapMoveEvents() {
    super._initMapMoveEvents();
    this.getMapProvider().on('mousedown', (e) =>
      this._updatestartLngLat(e)
    );
    this.getMapProvider().on('mouseup', (e) =>
      this._updateEndLngLat(e)
    );

    this.getMapProvider().on('mousemove', (e) =>
      this._updateCurrentLngLat(e)
    );
  }

  public _initControls(): void {
    if (this._controls) {
      if (this._controls.mapAttribution) {
        this.addControl(new mapboxgl.AttributionControl(this._controls.mapAttribution.config), this._controls.mapAttribution.position);
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

      if (this._controls?.pitchToggle?.enable) {
        const conf = this._controls.pitchToggle.config;
        this.addControl(new MapBoxPitchToggle(conf.bearing, conf.pitch, conf.minpitchzoom), this._controls.pitchToggle?.position ?? 'top-right');
      }

      if (this._controls?.navigationControl?.enable) {
        this.addControl(
          new mapboxgl.NavigationControl(this._controls.navigationControl.config),
          this._controls.navigationControl?.position ?? 'top-right');
      }
    }
  }

  public initDrawControls(config: DrawControlsOption) {
    if (!(config.draw.control instanceof MapboxDraw)) {
      console.warn(' Draw control is not instance of MapBoxDraw');
    } else {
    }
    this.addControl(config.draw.control as Control, (config.draw?.position ?? 'top-right'));

    if (config.addGeoBox.enable) {
      const addGeoBoxButton = new MapBoxControlButton(config.addGeoBox?.name ?? 'addgeobox');
      this.addControl(addGeoBoxButton, config.addGeoBox?.position ?? 'top-right', config.addGeoBox?.overrideEvent);

    }
    if (config.addGeoBox.enable) {
      const removeAoisButton = new MapBoxControlButton('removeaois');
      this.addControl(removeAoisButton, config.removeAois?.position ?? 'top-right', config.removeAois?.overrideEvent);
    }
  }

  public getMapExtend(): MapExtent {
    const bounds = this.getBounds();
    return { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.getMapProvider().getZoom() };
  }

  public addControl(control: Control | IControl | ControlButton,
    position?: ControlPosition,
    eventOverride?: {
      event: string; fn: (e?) => void;
    }) {
    this.getMapProvider().addControl(control, position);
    if (control instanceof ControlButton && eventOverride) {
      control.btn[eventOverride.event] = () => eventOverride.fn();
    }
    return this;
  }

  public enableDragPan() {
    this.getMapProvider().dragPan.enable();
  }

  public disableDragPan() {
    this.getMapProvider().dragPan.disable();
  }


  public getMapProvider(): mapboxgl.Map {
    return this._mapProvider;
  }

  public getLayers() {
    return this.getMapProvider().getStyle().layers;
  }

  public onLoad(fn: () => void): void {
    this.getMapProvider().on('load', fn);
  }

  public calcOffsetPoint() {
    return new mapboxgl.Point((this._offset.east + this._offset.west) / 2, (this._offset.north + this._offset.south) / 2);
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


  /** Gets bounds of the given geometry */
  public geometryToBound(geometry: any, paddingPercentage?: number): ArlasLngLatBounds {
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
    const bounds = new ArlasLngLatBounds(
      new ArlasLngLat(west, south),
      new ArlasLngLat(east, north)
    );
    return bounds;
  }

  /**
   * @description Fits to given bounds + padding provided by the map configuration.
   * @param bounds Bounds defined by sw and ne coordinates.
   */
  public fitToPaddedBounds(bounds: ArlasLngLatBounds) {
    const boundsOptions: mapboxgl.FitBoundsOptions = {};
    boundsOptions.padding = {
      top: this._offset.north + this._fitBoundsPadding,
      bottom: this._offset.south + this._fitBoundsPadding,
      left: this._offset.west + this._fitBoundsPadding,
      right: this._offset.east + this._fitBoundsPadding
    };
    this.fitBounds(bounds, boundsOptions);
  }

  public addSourceType(ind: string, protocol: any, cb: (e?) => void) {
    (this.getMapProvider() as any).addSourceType(ind, protocol, cb);
  }

  public getWestBounds() {
    return this.getBounds().getWest();
  }
  public getNorthBounds() {
    return this.getBounds().getNorth();
  }

  public getNorthEastBounds() {
    return this.getBounds().getNorthEast();
  }
  public getSouthBounds() {
    return this.getBounds().getSouth();
  }

  public getSouthWestBounds() {
    return this.getBounds().getSouthWest();
  }
  public getEastBounds() {
    return this.getBounds().getEast();
  }

  public getSource(id: string) {
    return this._mapProvider.getSource(id);
  }

  public fitBounds(bounds: ArlasLngLatBounds, options?: mapboxgl.FitBoundsOptions, eventData?: mapboxgl.EventData) {
    this.getMapProvider().fitBounds(this.toMapboxBound(bounds), options, eventData);
    return this;
  }

  public setCenter(lngLat: [number, number]) {
    this._mapProvider.setCenter(lngLat);
    return this;
  }

  public getZoom() {
    return this._mapProvider.getZoom();
  }

  public getCanvasContainer() {
    return this._mapProvider.getCanvasContainer();
  }

  public queryRenderedFeatures(point) {
    return this._mapProvider.queryRenderedFeatures(point);
  }

  public getMaxBounds(): mapboxgl.LngLatBounds | null {
    return this._mapProvider.getMaxBounds();
  }

  public resize(eventData?: mapboxgl.EventData): this {
    this._mapProvider.resize(eventData);
    return this;
  }

  public setFilter(layer: string, filter?: any[] | boolean | null, options?: mapboxgl.FilterOptions | null): this {
    this._mapProvider.setFilter(layer, filter, options);
    return this;
  }

  public setMaxBounds(lnglatbounds?: mapboxgl.LngLatBoundsLike): this {
    this._mapProvider.setMaxBounds(lnglatbounds);
    return this;
  }

  public setZoom(zoom: number, eventData?: mapboxgl.EventData): this {
    this._mapProvider.setZoom(zoom, eventData);
    return this;
  }

  public getBounds() {
    return this.getMapProvider().getBounds();
  }

   /**
   * 
   * @param bounds Bounds defined by ARLAS
   * @returns Transforms the ArlasLngLatBounds to LngLatBounds as defined by mapbox
   */
   private toMapboxBound(bounds: ArlasLngLatBounds) {
    return new LngLatBounds(bounds.sw, bounds.ne);
  }


}

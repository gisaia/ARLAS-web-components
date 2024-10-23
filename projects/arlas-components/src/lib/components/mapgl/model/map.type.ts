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


/**
 * we wrap maprovider function to hide
 * maprovider implementation from our other interface.
 * to prevent changes from impacting other parts of the application.
 * ex:
 * addLayer(){
 * provider1.addLayerToMap()
 * }
 *
 * addLayer(){
 * provider2.addLayer()
 * }
 *
 * if we change the implementation, as we used addLayer in all our app,
 * the change is transparent.
 */

export interface MapOverride {
  addControl(
    control: unknown,
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
  ): this;

  resize(eventData?: unknown): this;

  getBounds(): unknown;

  getMaxBounds(): unknown | null;

  setMaxBounds(unknown?: unknown): this;

  setMinZoom(minZoom?: number | null): this;

  getMinZoom(): number;

  setMaxZoom(maxZoom?: number | null): this;

  getMaxZoom(): number;

  project(lnglat: unknown): unknown;

  unproject(point: unknown): unknown;

  /**
   * Returns an array of GeoJSON Feature objects representing visible features that satisfy the query parameters.
   *
   * The properties value of each returned feature object contains the properties of
   * its source feature. For GeoJSON sources, only string and numeric property values are supported
   * (i.e. null, Array, and Object values are not supported).
   *
   * Each feature includes top-level layer, source, and sourceLayer properties.
   * The layer property is an object representing the style layer to which the feature belongs.
   * Layout and paint properties in this object contain values which are fully evaluated for the given zoom
   * level and feature.
   *
   * Only features that are currently rendered are included. Some features will not be included, like:
   *
   * - Features from layers whose visibility property is "none".
   * - Features from layers whose zoom range excludes the current zoom level.
   * - Symbol features that have been hidden due to text or icon collision.
   *
   * Features from all other layers are included,
   * including features that may have no visible contribution to the rendered result;
   * for example, because the layer's opacity or color alpha component is set to 0.
   *
   * The topmost rendered feature appears first in the returned array,
   * and subsequent features are sorted by descending z-order.
   * Features that are rendered multiple times (due to wrapping across the antimeridian at low zoom levels)
   * are returned only once (though subject to the following caveat).
   *
   * Because features come from tiled vector data or GeoJSON data that is converted to tiles internally,
   * feature geometries may be split or duplicated across tile boundaries and, as a result,
   * features may appear multiple times in query results. For example, suppose there is
   * a highway running through the bounding rectangle of a query.
   * The results of the query will be those parts of the highway that lie within the map tiles covering the bounding
   * rectangle, even if the highway extends into other tiles, and the portion of the highway within each map tile will
   * be returned as a separate feature. Similarly, a point feature near a tile boundary may appear in multiple tiles
   * due to tile buffering.
   *
   * @param pointOrBox The geometry of the query region: either a single point or
   * southwest and northeast points describing a bounding box. Omitting this parameter
   * (i.e. calling Map#queryRenderedFeatures with zero arguments, or with only a  options argument)
   * is equivalent to passing a bounding box encompassing the entire map viewport.
   * @param options
   */
  queryRenderedFeatures(
    pointOrBox?: unknown,
    options?: { layers?: string[] | undefined; filter?: any[] | undefined; } & unknown,
  ): unknown[];

  setStyle(
    style: unknown,
    options?: { diff?: boolean | undefined; localIdeographFontFamily?: string | undefined; },
  ): this;

  getStyle(): unknown;

  addSource(id: string, source: unknown): this;

  removeSource(id: string): this;

  getSource(id: string): unknown;

  addImage(
    name: string,
    image:
      | HTMLImageElement
      | ArrayBufferView
      | { width: number; height: number; data: Uint8Array | Uint8ClampedArray; }
      | ImageData
      | ImageBitmap,
    options?: { pixelRatio?: number | undefined; sdf?: boolean | undefined; },
  ): this;

  loadImage(url: string, callback: Function): this;


  addLayer(layer: unknown, before?: string): this;

  moveLayer(id: string, beforeId?: string): this;

  removeLayer(id: string): this;

  getLayer(id: string): unknown;

  setFilter(layer: string, filter?: any[] | boolean | null, options?: unknown | null): this;

  setLayoutProperty(layer: string, name: string, value: any, options?: unknown): this;

  getLight(): unknown;

  setFeatureState(
    feature: unknown,
    state: { [key: string]: any; },
  ): void;

  getFeatureState(feature: unknown): { [key: string]: any; };

  removeFeatureState(target: unknown, key?: string): void;

  getContainer(): HTMLElement;

  getCanvasContainer(): HTMLElement;

  getCanvas(): HTMLCanvasElement;

  getCenter(): unknown;

  setCenter(center: unknown, unknown?: unknown): this;

  panTo(lnglat: unknown, options?: unknown, unknown?: unknown): this;

  getZoom(): number;

  setZoom(zoom: number, unknown?: unknown): this;


  getBearing(): number;

  setBearing(bearing: number, unknown?: unknown): this;

  rotateTo(bearing: number, options?: unknown, unknown?: unknown): this;

  getPitch(): number;

  setPitch(pitch: number, unknown?: unknown): this;

  cameraForBounds(bounds: unknown, options?: unknown): unknown | undefined;

  fitBounds(bounds: unknown, options?: unknown, unknown?: unknown): this;

  hasImage(id: string):boolean;
  removeImage(id: string):void;


  easeTo(options: unknown, unknown?: unknown): this;

  flyTo(options: unknown, unknown?: unknown): this;

  on<T extends keyof unknown>(
    type: T,
    layer: string,
    listener: (ev: unknown) => void,
  ): this;
  on<T extends keyof unknown>(type: T, listener: (ev: unknown) => void): this;
  on(type: string, listener: (ev: any) => void): this;

  once<T extends keyof unknown>(
    type: T,
    layer: string,
    listener: (ev: unknown) => void,
  ): this;
  once<T extends keyof unknown>(type: T, listener: (ev: unknown) => void): this;
  once(type: string, listener: (ev: any) => void): this;

}

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

import { Injectable } from '@angular/core';
import { AbstractArlasMapGL, MapConfig } from './map/AbstractArlasMapGL';
import { AbstractDraw } from './draw/AbstractDraw';
import { ArlasLngLat, ArlasLngLatBounds } from './map/model/map';
import { FeatureCollection } from '@turf/helpers';
import { VectorStyle } from './map/model/vector-style';
import { ArlasPoint } from './map/model/geometry';
import { MapLayerMouseEvent } from './map/model/events';

/**
 * This service exposes a list of map interaction methods that are abstract.
 * Theses methods will be implemented by the chosen cartographical framework to use.
 */
@Injectable({
  providedIn: 'root'
})
/** L: a layer class/interface.
 *  S: a source class/interface.
 *  M: a Map configuration class/interface.
 */
export abstract class ArlasMapFrameworkService<L, S, M> {

  public constructor() { }

  public abstract getInitTransformRequest(): Function;

  public abstract createMap(config: MapConfig<M>): AbstractArlasMapGL;

  public abstract createDraw(drawOptions, enabled: boolean, map: AbstractArlasMapGL): AbstractDraw;

  /**
   * @description Gets the bounds from the two given coordinates.
   * @param c1 Coordinates of the first corner.
   * @param c2 Coordinates of the second corner.
   * @returns Bounds formed from the two given coordinates.
   */
  public getLngLatBound(c1: ArlasLngLat, c2: ArlasLngLat): ArlasLngLatBounds {
    return new ArlasLngLatBounds(c1, c2);
  }

  /**
   * Fits the map to its current bounds. To be used when a map container is resized.
   * @param map Map instance.
   */
  public abstract fitMapBounds(map: AbstractArlasMapGL);

  public abstract getBoundsAsString(map: AbstractArlasMapGL): string;

  /**
   * @description Gets the Point (geometry) from mouse click on the screen.
   * @param mouseEvent Click mouse event.
   * @param container Map container.
   * @returns a Point instance.
   */
  public abstract getPointFromScreen(mouseEvent: MouseEvent, container: HTMLElement): ArlasPoint;

  /**
   * @description Sets `data` to a Geojson `source` of the map
   * @param source A Geojson source
   * @param data A feature collection object.
   */
  public abstract setDataToGeojsonSource(source: S | string, data: FeatureCollection<GeoJSON.Geometry>);


  /**
   * Returns the canvas element of the map
   * @param map Map instance.
   */
  public abstract getCanvas(map: AbstractArlasMapGL): HTMLCanvasElement;

  public abstract addImage(name: string, url: string, map: AbstractArlasMapGL, errorMessage: string, opt?: any);

  /**
   * @description Adds a layer to the map instance.
   * @param map Map instance.
   * @param layer A layer. It could be a layer identifier OR a layer object (it will depend on the framwork implementation).
   * @param beforeId Identifier of an already added layer. The 'layer' is added under this 'beforeId' layer.
   */
  public abstract addLayer(map: AbstractArlasMapGL, layer: L, beforeId?: L | string);

  public abstract getLayersFromPattern(map: AbstractArlasMapGL, layersIdPattern: string): L[];
  public abstract getAllLayers(map: AbstractArlasMapGL): L[];

  public abstract hasLayer(map: AbstractArlasMapGL, layer: L | string);
  public abstract hasLayersFromPattern(map: AbstractArlasMapGL, layersIdPattern: string);
  public abstract moveLayer(map: AbstractArlasMapGL, layer: L | string, beforeId?: string);
  public abstract onLayerEvent(eventName: string, map: AbstractArlasMapGL, layer: any, fn: (e) => void);
  public abstract removeLayer(map: AbstractArlasMapGL, layer: L | string);
  public abstract removeLayers(map: AbstractArlasMapGL, layers: L[] | string[]);
  public abstract removeLayersFromPattern(map: AbstractArlasMapGL, layersIdPattern: string);
  public abstract setLayerVisibility(layer: L | string, isVisible: boolean, map: AbstractArlasMapGL);
  public abstract isLayerVisible(layer: L | string): boolean;
  public abstract getLayer(map: AbstractArlasMapGL, layerId: string): L;


  public abstract queryFeatures(mouseEvent: MapLayerMouseEvent, map: AbstractArlasMapGL, layersIdPattern: string, options?: any);
  public abstract hasSource(map: AbstractArlasMapGL, source: L | AbstractArlasMapGL | string);
  public abstract getSource(sourceId: string, options: L | AbstractArlasMapGL | string): S;
  public abstract getAllSources(options:  L | AbstractArlasMapGL | string): S[];
  public abstract setSource(sourceId: string, source: S, options: L | AbstractArlasMapGL | string);
  public abstract removeSource(map: AbstractArlasMapGL, source: S | string);

  public abstract addPopup(map: AbstractArlasMapGL, popup: any);
  public abstract createPopup(lng: number, lat: number, message: string);
  public abstract removePopup(map: AbstractArlasMapGL, popup: any);

  public abstract onMapEvent(eventName: any, map: AbstractArlasMapGL, fn: (e) => void);
  public abstract setMapCursor(map: AbstractArlasMapGL, cursor: string): void;
  public abstract flyTo(lat: number, lng: number, zoom: number, map: AbstractArlasMapGL);

  public abstract addIconLayer(map: AbstractArlasMapGL, layerId: string, iconName: string,
    iconSize: number, data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>);
  public abstract addRasterLayer(map: AbstractArlasMapGL, layerId: string, url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number, beforeId?: string): void;

  public abstract addGeojsonLayer(map: AbstractArlasMapGL, layerId: string, style: VectorStyle,
    data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>
  ): void;


  public abstract filterGeojsonData(map: AbstractArlasMapGL, layer: L | string, filter: any);

  public abstract createGeojsonSource(data: GeoJSON.GeoJSON): S;
  public abstract createRasterSource(url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number): S;

}

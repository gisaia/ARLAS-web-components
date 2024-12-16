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
import { LngLat } from './map/model/map';
import { FeatureCollection } from '@turf/helpers';
import { VectorStyle } from './map/model/vector-style';


/**
 * This service exposes a list of map interaction methods that are abstract.
 * Theses methods will be implemented by the chosen cartographical framework to use.
 */
@Injectable({
  providedIn: 'root'
})
export abstract class ArlasMapFrameworkService {

  public constructor() { }

  public abstract getInitTransformRequest(): Function;

  public abstract createMap(config: MapConfig<unknown>): AbstractArlasMapGL;

  public abstract createDraw(drawOptions, enabled: boolean, map: AbstractArlasMapGL): AbstractDraw;

  public abstract getLngLatBound(c1: LngLat, c2: LngLat): any;

  public abstract boundsToString(bounds: any): string;

  public abstract getPointFromScreen(e, container: HTMLElement);

  /** Sets `data` to a Geojson `source` of the map
   * @param source A Geojson source
   * @param data A feature collection object.
   */
  public abstract setDataToGeojsonSource(source: any, data: FeatureCollection<GeoJSON.Geometry>);

  public abstract addImage(name: string, url: string, map: AbstractArlasMapGL, errorMessage: string, opt?: any);

  /**
   * Checks if the given layer is already added to the map instance
   * @param map Map instance
   * @param layer layer identifier
   */
  public abstract addLayer(map: AbstractArlasMapGL, layer: any, beforeId?: string);
  public abstract addArlasDataLayer(map: AbstractArlasMapGL, layer: any, layersMap: Map<string, any>, beforeId?: string);
  public abstract getLayersFromPattern(map: AbstractArlasMapGL, layersIdPattern: string): any[];
  public abstract getAllLayers(map: AbstractArlasMapGL): any[];

  public abstract hasLayer(map: AbstractArlasMapGL, layer: any);
  public abstract hasLayersFromPattern(map: AbstractArlasMapGL, layersIdPattern: string);
  public abstract moveLayer(map: AbstractArlasMapGL, layer: any, beforeId?: string);
  public abstract moveArlasDataLayer(map: AbstractArlasMapGL, layer: any, layersMap: Map<string, any>, beforeId?: string);
  public abstract onLayerEvent(eventName: any, map: AbstractArlasMapGL, layer: any, fn: (e) => void);
  public abstract removeLayer(map: AbstractArlasMapGL, layer: any);
  public abstract removeLayers(map: AbstractArlasMapGL, layers: any);
  public abstract removeLayersFromPattern(map: AbstractArlasMapGL, layersIdPattern: string);
  public abstract setLayerVisibility(layer: any, isVisible: boolean, map: AbstractArlasMapGL);
  public abstract isLayerVisible(layer: any): boolean;
  public abstract getLayer(map: AbstractArlasMapGL, layerId: string): any;


  public abstract queryFeatures(e: any, map: AbstractArlasMapGL, layersIdPattern: string, options?: any);
  public abstract hasSource(map: AbstractArlasMapGL, source: any);
  public abstract getSource(sourceId: string, options: any): any;
  public abstract getAllSources(options: any): any;
  public abstract setSource(sourceId: string, source: any, options: any);
  public abstract removeSource(map: AbstractArlasMapGL, source: any);

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


  public abstract filterGeojsonData(map: AbstractArlasMapGL, layer: any, filter: any);

  public abstract createGeojsonSource(data: GeoJSON.GeoJSON): any;
  public abstract createRasterSource(url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number): any;

}
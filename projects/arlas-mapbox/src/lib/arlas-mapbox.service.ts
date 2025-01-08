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
import {
  ARLAS_ID, ArlasMapFrameworkService, FILLSTROKE_LAYER_PREFIX,
  SCROLLABLE_ARLAS_ID
} from 'arlas-map';
import {
  AnyLayer, AnySourceData, GeoJSONSource,
  GeoJSONSourceRaw, LngLatBounds, MapboxOptions, Point, Popup, RasterLayer, RasterSource, SymbolLayer
} from 'mapbox-gl';
import { ArlasMapboxConfig, ArlasMapboxGL } from './map/ArlasMapboxGL';
import { ArlasDraw } from './draw/ArlasDraw';
import { ArlasAnyLayer } from './map/model/layers';
import { FeatureCollection } from '@turf/helpers';
import { MapboxVectorStyle } from './map/model/vector-style';
import { AbstractArlasMapGL } from 'arlas-map';
import { MapboxSourceType } from './map/model/sources';
import { ArlasLngLatBounds } from 'arlas-map';

@Injectable()
export class ArlasMapboxService extends ArlasMapFrameworkService<ArlasAnyLayer, MapboxSourceType
  | GeoJSONSource | GeoJSONSourceRaw, MapboxOptions> {

  public constructor() {
    super();
  }

  public getInitTransformRequest(): Function {
    return (url: string, resourceType: mapboxgl.ResourceType) => ({
      url,
    });
  }

  public createMap(config: ArlasMapboxConfig): ArlasMapboxGL {
    return new ArlasMapboxGL(config);
  }

  public createDraw(drawOptions: any, enabled: boolean, map: ArlasMapboxGL): any {
    return (new ArlasDraw(drawOptions, enabled, map));
  }

  /**
   * Gets the Point (geometry) from mouse click on the screen.
   * @param mouseEvent Click mouse event.
   * @param container Map container.
   * @returns a Point instance.
   */
  public getPointFromScreen(mouseEvent: MouseEvent, container: HTMLElement): Point {
    const rect = container.getBoundingClientRect();
    return new Point(
      mouseEvent.clientX - rect.left - container.clientLeft,
      mouseEvent.clientY - rect.top - container.clientTop
    );
  };


  public getBoundsAsString(map: ArlasMapboxGL): string {
    const bounds = map.getBounds();
    return bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
  }


  /**
  * Fits the map to its current bounds. To be used when a map container is resized.
  * @param map Map instance.
  */
  public fitMapBounds(map: ArlasMapboxGL) {
    map.getMapProvider().fitBounds(map.getMapProvider().getBounds());
  };

  public setDataToGeojsonSource(source: GeoJSONSource, data: FeatureCollection<GeoJSON.Geometry>) {
    if (!!source) {
      source.setData(data);
    }
  }

  /**
   * @override Add an Image to the map.
   * @param name Name of the image.
   * @param url URL to fetch the image.
   * @param map Mapbox map instance.
   * @param errorMessage Error message shown as a warning if the image is not loaded.
   * @param opt Options of image visualisation.
   */
  public addImage(name: string, url: string, map: ArlasMapboxGL, errorMessage: string, opt?: any) {
    const mapboxMap = map.getMapProvider();
    mapboxMap.loadImage(
      url,
      (error, image) => {
        if (error) {
          console.warn(errorMessage);
        }
        if (!mapboxMap.hasImage(name)) {
          mapboxMap.addImage(name, image, opt);
        }
      });
  }

  /**
   * @override Mapbox implementation.
   * Checks if the given layer is already added to the map instance
   * @param map Map instance
   * @param layer layer identifier
   */
  public hasLayer(map: ArlasMapboxGL, layer: string): boolean {
    return !!map.getMapProvider().getLayer(layer);
  };

  /**
   * Checks if the given source is already added to the map instance
   * @param sourceId source identifier
   * @param map Map instance
   */
  public hasSource(map: ArlasMapboxGL, sourceId: string): boolean {
    return !!map.getMapProvider().getSource(sourceId);
  }
  /**
   * Creates and returns a Geojson source instance.
   * @param data Geojson data to add to the source.
   * @returns returns a Geojson source instance
   */
  public createGeojsonSource(data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>): GeoJSONSourceRaw {
    return {
      type: 'geojson',
      data
    };
  };

  /**
   * @override Mapbox implementation.
   * Adds the given source to the map instance
   * @param sourceId Source identifier
   * @param source Source instance
   * @param map Map
   */
  public setSource(sourceId: string, source: AnySourceData, map: ArlasMapboxGL) {
    if (!this.hasSource(map, sourceId)) {
      map.getMapProvider().addSource(sourceId, source);
    } else {
      console.warn(`The source ${sourceId} is already added to the map`);
    }
  };

  /**
   * @override Mapbox implementation.
   * Adds the given layer to the map instance, optionnaly before a layer. Otherwise it's added to the top.
   * @param map Map
   * @param layer Layer to add to the map
   * @param before Identifier of an already added layer. The given Layer (second param) is added under this 'before' layer.
   */
  public addLayer(map: ArlasMapboxGL, layer: AnyLayer, before?: string) {
    if (!this.hasLayer(map, layer.id)) {
      map.getMapProvider().addLayer(layer, before);
    } else {
      console.warn(`The layer ${layer.id} is already added to the map`);
    }
  }


  /**
   * Executes the 'fn' function on 'eventName' triggered from the given 'layer' of the 'map' instance.
   * @param eventName Event name.
   * @param map Map instance.
   * @param layer Layer identifier.
   * @param fn Function to execute on event of the given layer.
   */
  public onLayerEvent(eventName: 'click' | 'mousemove' | 'mouseleave', map: ArlasMapboxGL, layer: string, fn: (e) => void): void {
    map.getMapProvider().on(eventName, layer, fn);
  }

  /**
   * @override Mapbox implementation.
   * Executes the 'fn' function on 'eventName' triggered from the 'map' instance.
   * @param eventName Event.
   * @param map Map instance.
   * @param fn Function to execute on given event on the map.
   */
  public onMapEvent(eventName: 'load' | 'moveend' | 'zoomend', map: ArlasMapboxGL, fn: (e) => void) {
    map.getMapProvider().on(eventName, fn);
  }

  /**
   * @override Mapbox implementation.
   * Removes the given layer from the map. If the source of this layer is still on the map, it is also removed.
   * @param map Map instance.
   * @param layer layer to remove.
   */
  public removeLayer(map: ArlasMapboxGL, layer: string): void {
    if (this.hasLayer(map, layer)) {
      const sourceId = this.getLayer(map, layer)?.source as string;
      map.getMapProvider().removeLayer(layer);
      this.removeSource(map, sourceId);
    }
  };

  /**
   * Returns the layer object of the given layer id.
   * @param map Map instance.
   * @param layer Layer identifier
   * @returns the layer object.
   */
  public getLayer(map: ArlasMapboxGL, layer: string): ArlasAnyLayer {
    return map.getMapProvider().getLayer(layer) as ArlasAnyLayer;
  }

  /**
   * @override Mapbox implementation.
   * @param layerId Layer identifier.
   * @param isVisible If true, the layer is made visible, otherwise, it is hidden.
   * @param map Map instance.
   */
  public setLayerVisibility(layerId: string, isVisible: boolean, map: ArlasMapboxGL): void {
    if (this.hasLayer(map, layerId)) {
      map.getMapProvider().setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
      const layer = this.getLayer(map, layerId);
      if (layer.type === 'fill') {
        const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
        if (this.hasLayer(map, strokeId)) {
          map.getMapProvider().setLayoutProperty(strokeId, 'visibility', isVisible ? 'visible' : 'none');
        }
      }
      const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
      if (!layer.id.startsWith(SCROLLABLE_ARLAS_ID) && this.hasLayer(map, scrollableId)) {
        map.getMapProvider().setLayoutProperty(scrollableId, 'visibility', isVisible ? 'visible' : 'none');
      }
    }
  }


  /**
   * @override Mapbox implementation.
   * Removes the source from the map instance
   * @param map Map instance
   * @param source Source identifier.
   */
  public removeSource(map: ArlasMapboxGL, source: string) {
    if (!!source && this.hasSource(map, source)) {
      map.getMapProvider().removeSource(source);
    }
  };

  /**
   * @override Mapbox implementation.
   * Creates a popup at lng,lat with the given message. The popup is not yet added to the map.
   * @param lng Longitude.
   * @param lat Latitude.
   * @param message The popup message.
   * @returns The popup instance.
   */
  public createPopup(lng: number, lat: number, message: string): Popup {
    const popup = new Popup({
      closeButton: false,
      closeOnClick: false
    });
    return popup.setLngLat([lat, lng])
      .setHTML(message);
  }

  /**
   * @override Mapbox implementation.
   * Adds the given popup to the map.
   * @param map Map instance.
   * @param popup Popup instance.
   */
  public addPopup(map: ArlasMapboxGL, popup: Popup): void {
    popup.addTo(map.getMapProvider());
  }

  /**
   * @override Mapbox implementation.
   * Removes the given popup from the map.
   * @param map Map instance.
   * @param popup Popup instance.
   */
  public removePopup(map: ArlasMapboxGL, popup: Popup): void {
    popup.remove();
  }

  /**
   * @override Mapbox implementation.
   * Removes all the given layers (and their sources) from the map.
   * @param map Map instance.
   * @param layers Identifiers of layers to remove.
   */
  public removeLayers(map: ArlasMapboxGL, layers: string[]): void {
    layers.forEach(l => this.removeLayer(map, l));
  }

  /**
   * @override Mapbox implementation.
   * Removes all layers which identifier includes the given id pattern.
   * @param map Map instance.
   * @param layersIdPattern Identifiers pattern to remove from the map.
   */
  public removeLayersFromPattern(map: ArlasMapboxGL, layersIdPattern: string) {
    map.getMapProvider().getStyle().layers.filter(l => l.id.includes(layersIdPattern)).forEach(l => this.removeLayer(map, l.id));
  }

  /**
   * @override Mapbox implementation.
   * Checks if there are any layers respecting the given id pattern
    * @param map Map instance.
   * @param layersIdPattern Identifiers pattern.
   * @returns true if any layer's id includes the given id pattern.
   */
  public hasLayersFromPattern(map: ArlasMapboxGL, layersIdPattern: string): boolean {
    return map.getMapProvider().getStyle().layers.filter(l => l.id.includes(layersIdPattern)).length > 0;
  }

  /**
   * @override Mapbox implementation.
   * Set the mouse cursor when it's over the map
   * @param map Map instance.
   * @param cursor cursor type (https://developer.mozilla.org/fr/docs/Web/CSS/cursor)
   */
  public setMapCursor(map: ArlasMapboxGL, cursor: string): void {
    map.getMapProvider().getCanvas().style.cursor = cursor;
  }

  /**
   * @override Mapbox implementation.
   * Creates and returns a raster source instance.
   * @param url Url to the raster source.
   * @param bounds Bounds of the image [west, south, east, north].
   * @param maxZoom Maximal zoom to display the raster.
   * @param minZoom Minimal zoom to display the raster.
   * @param tileSize Size of the tiles fetched to display the raster (in pixels). Default to 256.
   * @returns a raster source instance.
   */
  public createRasterSource(url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number = 256): RasterSource {
    return {
      type: 'raster',
      tiles: [url],
      bounds: bounds as [number, number, number, number],
      maxzoom: maxZoom,
      minzoom: minZoom,
      tileSize: tileSize
    };
  }

  /**
  * @override Mapbox implementation.
  * Creates a new Raster layer and adds it to the map.
  * @param map Map instance
  * @param url Url to the raster source.
  * @param bounds Bounds of the image [west, south, east, north].
  * @param maxZoom Maximal zoom to display the raster.
  * @param minZoom Minimal zoom to display the raster.
  * @param tileSize Size of the tiles fetched to display the raster (in pixels). Default to 256.
  * @param beforeId Identifier of an already added layer. The raster Layer is added under this 'beforeId' layer.
  */

  public addRasterLayer(map: ArlasMapboxGL, layerId: string, url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number, beforeId?: string): void {
    const rasterSource: RasterSource = this.createRasterSource(url, bounds, maxZoom, minZoom, tileSize);
    const sourceId = layerId;
    this.setSource(sourceId, rasterSource, map);
    const iconLayer: RasterLayer = {
      id: layerId,
      source: sourceId,
      type: 'raster',
      layout: {
        visibility: 'visible'
      }
    };
    this.addLayer(map, iconLayer, beforeId);
  }

  /**
   * @override Mapbox implementation.
   * Creates a new Icon layer and adds to the map
   * @param map Map instance
   * @param layerId The identifier of the new icon layer
   * @param iconName The icon name
   * @param iconSize The icon size
   * @param data Geojson data which features will be represented with the given icon.
   */
  public addIconLayer(map: ArlasMapboxGL, layerId: string, iconName: string, iconSize: number,
    data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>) {
    const iconSource: GeoJSONSourceRaw = this.createGeojsonSource(data);
    const sourceId = layerId;
    this.setSource(sourceId, iconSource, map);
    const iconLayer: SymbolLayer = {
      id: layerId,
      source: sourceId,
      type: 'symbol',
      layout: {
        'icon-image': iconName,
        'icon-size': iconSize,
        'visibility': 'visible'
      }
    };
    this.addLayer(map, iconLayer);
  };

  /**
   * @override Mapbox implementation.
   * Creates a new geojsob layer and adds to the map
   * @param map Map instance
   * @param layerId The identifier of the new icon layer
   * @param style Vector style to apply to the geojson
   * @param data Geojson data which features will be styled with the given style.
   */
  public addGeojsonLayer(map: ArlasMapboxGL, layerId: string, style: MapboxVectorStyle,
    data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>): void {
    const source: GeoJSONSourceRaw = this.createGeojsonSource(data);
    const sourceId = layerId;
    this.setSource(sourceId, source, map);
    const geojsonLayer: ArlasAnyLayer = {
      id: layerId,
      source: sourceId,
      type: style.type,
      layout: {
        'visibility': 'visible'
      },
    };
    style.applyStyle(geojsonLayer);
    this.addLayer(map, geojsonLayer);
  }


  public flyTo(lat: number, lng: number, zoom: number, map: ArlasMapboxGL) {
    map.getMapProvider().flyTo({ center: [lng, lat], zoom });
  }

  public filterGeojsonData(map: ArlasMapboxGL, layerId: string, filter: any) {
    map.getMapProvider().setFilter(layerId, filter);
  }

  public queryFeatures(e: any, map: ArlasMapboxGL, layersIdPattern: string, options: any) {
    map.getMapProvider().queryRenderedFeatures(e.point, options).filter(f => !!f.layer && !!f.layer.id && f.layer.id.includes(layersIdPattern));
  };


  public isLayerVisible(layer: ArlasAnyLayer): boolean {
    return layer.layout.visibility === 'visible';
  }

  public getSource(sourceId: string, map: ArlasMapboxGL) {
    return map.getMapProvider().getSource(sourceId);
  }

  /**
   * @override Mapbox implementation.
   * Returns a list of layers whose ids include the the given id pattern.
    * @param map Map instance.
   * @param layersIdPattern Identifiers pattern.
   * @returns a list of layers whose ids include the the given id pattern.
   */
  public getLayersFromPattern(map: ArlasMapboxGL, layersIdPattern: string): ArlasAnyLayer[] {
    return map.getMapProvider().getStyle().layers.filter(l => l.id.includes(layersIdPattern)) as ArlasAnyLayer[];
  }

  public getAllLayers(map: ArlasMapboxGL): ArlasAnyLayer[] {
    return map.getMapProvider().getStyle().layers as ArlasAnyLayer[];
  }

  /**
   * @override Mapbox implementation.
   * Moves the given layer to the top in map instance OR optionnaly before a layer.
   * @param map Map instance.
   * @param layer Layer to add to the map.
   * @param before Identifier of an already added layer. The given Layer (second param) is moved under this 'before' layer.
   */
  public moveLayer(map: ArlasMapboxGL, layer: string, before?: string) {
    if (this.hasLayer(map, layer)) {
      map.getMapProvider().moveLayer(layer, before);
    } else {
      console.warn(`The layer ${layer} is not added to the map`);
    }
  }

  public getAllSources(map: ArlasMapboxGL) {
    return (map as AbstractArlasMapGL).getMapProvider().getStyle().sources;
  }
}

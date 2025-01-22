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
import { FeatureCollection } from '@turf/helpers';
import {
  AbstractArlasMapGL,
  ARLAS_ID, ArlasMapFrameworkService,
  ExternalEvent,
  FILLSTROKE_LAYER_PREFIX, SCROLLABLE_ARLAS_ID,
  VectorStyle
} from 'arlas-map';
import {
  AddLayerObject, CanvasSourceSpecification, GeoJSONSource,
  GeoJSONSourceSpecification, LayerSpecification, MapOptions, Point, Popup,
  RasterLayerSpecification, RasterSourceSpecification, ResourceType,
  SourceSpecification, SymbolLayerSpecification, TypedStyleLayer
} from 'maplibre-gl';
import { from } from 'rxjs';
import { ArlasDraw } from './draw/ArlasDraw';
import { ArlasMaplibreConfig, ArlasMaplibreGL } from './map/ArlasMaplibreGL';
import { MaplibreSourceType } from './map/model/sources';

/** Maplibre implementation of ArlasMapFrameworkService */
@Injectable()
export class ArlasMaplibreService extends ArlasMapFrameworkService<TypedStyleLayer | AddLayerObject,
  MaplibreSourceType | GeoJSONSource | RasterSourceSpecification | SourceSpecification | CanvasSourceSpecification, MapOptions> {

  public constructor() {
    super();
  }

  /**
     * Returns the canvas element of the map
     * @param map Map instance.
     */
  public getCanvas(map: ArlasMaplibreGL): HTMLCanvasElement {
    return map.getMapProvider().getCanvas();
  }

  public getInitTransformRequest(): Function {
    return (url: string, resourceType: ResourceType) => ({
      url,
    });
  }

  /**
    * Fits the map to its current bounds. To be used when a map container is resized.
    * @param map Map instance.
    */
  public fitMapBounds(map: ArlasMaplibreGL) {
    map.getMapProvider().fitBounds(map.getMapProvider().getBounds());
  };


  public createMap(config: ArlasMaplibreConfig): ArlasMaplibreGL {
    return new ArlasMaplibreGL(config);
  }

  public createDraw(drawOptions: any, enabled: boolean, map: ArlasMaplibreGL): ArlasDraw {
    return new ArlasDraw(drawOptions, enabled, map);
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

  public getBoundsAsString(map: ArlasMaplibreGL): string {
    const bounds = map.getBounds();
    return bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
  }

  public setDataToGeojsonSource(source: GeoJSONSource, data: FeatureCollection<GeoJSON.Geometry>) {
    if (source) {
      source.setData(data);
    }
  };

  /**
   * @override Add an Image to the map.
   * @param name Name of the image.
   * @param url URL to fetch the image.
   * @param map Maplibre map instance.
   * @param errorMessage Error message shown as a warning if the image is not loaded.
   * @param opt Options of image visualisation.
   */
  public addImage(name: string, url: string, map: ArlasMaplibreGL, errorMessage: string, opt?: any) {
    const maplibreMap = map.getMapProvider();
    from(maplibreMap.loadImage(url)).subscribe({
      next: (r) => {
        if (!maplibreMap.hasImage(name)) {
          maplibreMap.addImage(name, r.data, opt);
        }
      },
      error: (err) => {
        console.warn(errorMessage);
      }
    });
  }

  /**
   * @override Maplibre implementation.
   * Checks if the given layer is already added to the map instance
   * @param map Map instance
   * @param layer layer identifier
   */
  public hasLayer(map: ArlasMaplibreGL, layer: string): boolean {
    return layer && !!map.getMapProvider().getLayer(layer);
  };

  /**
   * Checks if the given source is already added to the map instance
   * @param sourceId source identifier
   * @param map Map instance
   */
  public hasSource(map: ArlasMaplibreGL, sourceId: string): boolean {
    return !!map.getMapProvider().getSource(sourceId);
  }
  /**
   * Creates and returns a Geojson source instance.
   * @param data Geojson data to add to the source.
   * @returns returns a Geojson source instance
   */
  public createGeojsonSource(data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>): GeoJSONSourceSpecification {
    return {
      type: 'geojson',
      data
    };
  };

  /**
   * @override Maplibre implementation.
   * Adds the given source to the map instance
   * @param sourceId Source identifier
   * @param source Source instance
   * @param map Map
   */
  public setSource(sourceId: string, source: SourceSpecification | CanvasSourceSpecification, map: ArlasMaplibreGL) {
    if (!this.hasSource(map, sourceId)) {
      map.getMapProvider().addSource(sourceId, source);
    } else {
      console.warn(`The source ${sourceId} is already added to the map`);
    }
  };


  public getAllSources(map: ArlasMaplibreGL) {
    return (map as AbstractArlasMapGL).getMapProvider().getStyle().sources;
  }

  /**
   * @override Maplibre implementation.
   * Adds the given layer to the map instance, optionnaly before a layer. Otherwise it's added to the top.
   * @param map Map
   * @param layer Layer to add to the map
   * @param before Identifier of an already added layer. The given Layer (second param) is added under this 'before' layer.
   */
  public addLayer(map: ArlasMaplibreGL, layer: AddLayerObject, before?: string) {
    if (!this.hasLayer(map, layer.id)) {
      map.getMapProvider().addLayer(layer, before);
    } else {
      console.warn(`The layer ${layer.id} is already added to the map`);
    }
  }

  public addArlasDataLayer(map: ArlasMaplibreGL, layer: AddLayerObject, arlasDataLayers: Map<string, AddLayerObject>, before?: string) {
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollableLayer = arlasDataLayers.get(scrollableId);
    if (scrollableLayer) {
      this.addLayer(map, scrollableLayer, before);
    }
    this.addLayer(map, layer, before);
    /** add stroke layer if the layer is a fill */
    if (layer.type === 'fill') {
      const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
      const strokeLayer = arlasDataLayers.get(strokeId);
      if (strokeLayer) {
        this.addLayer(map, strokeLayer, before);
      }
    }
  }

  /**
   * @override Maplibre implementation.
   * Moves the given layer to the top in map instance OR optionnaly before a layer.
   * @param map Map
   * @param layer Layer to add to the map
   * @param before Identifier of an already added layer. The given Layer (second param) is moved under this 'before' layer.
   */
  public moveLayer(map: ArlasMaplibreGL, layer: string, before?: string) {
    if (this.hasLayer(map, layer)) {
      map.getMapProvider().moveLayer(layer, before);
    } else {
      console.warn(`The layer ${layer} is not added to the map`);
    }
  }

  /**
   * @override Maplibre implementation.
   * @description Moves the given layer to the top in map instance OR optionnaly before a layer.
   * This method handles any specific treatment when adding ARLAS data.
   * For instance, in Maplibre implementation, moving a fill layer needs to move systematically the stroke layer.
   * @param map Map instance.
   * @param layer A layer. It could be a layer identifier OR a layer object (it will depend on the framwork implementation).
   * @param arlasDataLayers Map of ARLAS data layers and their ids (the ids being the key of the map).
   * @param beforeId Identifier of an already added layer. The layers of layersMap are added under this 'beforeId' layer.
   */
  public moveArlasDataLayer(map: ArlasMaplibreGL, layerId: string, arlasDataLayers: Map<string, AddLayerObject>, before?: string) {
    const layer = arlasDataLayers.get(layerId);
    const scrollableId = layer.id.replace(ARLAS_ID, SCROLLABLE_ARLAS_ID);
    const scrollableLayer = arlasDataLayers.get(scrollableId);
    if (!!scrollableLayer && this.hasLayer(map, scrollableId)) {
      this.moveLayer(map, scrollableId);
    }
    if (this.hasLayer(map, layerId)) {
      this.moveLayer(map, layerId);
      if (layer.type === 'fill') {
        const strokeId = layer.id.replace(ARLAS_ID, FILLSTROKE_LAYER_PREFIX);
        const strokeLayer = arlasDataLayers.get(strokeId);
        if (!!strokeLayer && this.hasLayer(map, strokeId)) {
          this.moveLayer(map, strokeId);
        }
        if (!!strokeLayer && !!strokeLayer.id) {
          const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + strokeLayer.id;
          const selectLayer = arlasDataLayers.get(selectId);
          if (!!selectLayer && this.hasLayer(map, selectId)) {
            this.moveLayer(map, selectId);
          }
          const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + strokeLayer.id;
          const hoverLayer = arlasDataLayers.get(hoverId);
          if (!!hoverLayer && this.hasLayer(map, hoverId)) {
            this.moveLayer(map, hoverId);
          }
        }
      }
    }
    const selectId = 'arlas-' + ExternalEvent.select.toString() + '-' + layer.id;
    const selectLayer = arlasDataLayers.get(selectId);
    if (!!selectLayer && this.hasLayer(map, selectId)) {
      this.moveLayer(map, selectId);
    }
    const hoverId = 'arlas-' + ExternalEvent.hover.toString() + '-' + layer.id;
    const hoverLayer = arlasDataLayers.get(hoverId);
    if (!!hoverLayer && this.hasLayer(map, hoverId)) {
      this.moveLayer(map, hoverId);
    }


  }


  /**
   * @override Maplibre implementation.
   * Executes the 'fn' function on 'eventName' triggered from the given 'layer' of the 'map' instance.
   * @param eventName
   * @param map
   * @param layer
   * @param fn
   */
  public onLayerEvent(eventName: 'click' | 'mousemove' | 'mouseleave' | 'mouseenter',
    map: ArlasMaplibreGL, layer: string, fn: (e) => void): void {
    map.getMapProvider().on(eventName, layer, fn);
  }

  /**
  * @override Maplibre implementation.
  * Executes the 'fn' function on 'eventName' triggered from the 'map' instance.
  * @param eventName event.
  * @param map Map instance.
  * @param fn  Function to execute on map event.
  */
  public onMapEvent(eventName: 'load' | 'moveend' | 'zoomend', map: ArlasMaplibreGL, fn: (e) => void) {
    map.getMapProvider().on(eventName, fn);
  }


  /**
   * @override Maplibre implementation.
   * Removes the given layer from the map. If the source of this layer is still on the map, it is also removed.
   * @param map Map instance.
   * @param layer layer to remove.
   */
  public removeLayer(map: ArlasMaplibreGL, layer: string): void {
    if (this.hasLayer(map, layer)) {
      const sourceId = this.getLayer(map, layer).source;
      map.getMapProvider().removeLayer(layer);
      this.removeSource(map, sourceId);
    }
  };



  /**
   * @overload
   * Returns the layer object of the given layer id.
   * @param map Map instance.
   * @param layer Layer identifier
   * @returns the layer object.
   */
  public getLayer(map: ArlasMaplibreGL, layer: string): TypedStyleLayer {
    return map.getMapProvider().getLayer(layer) as TypedStyleLayer;
  }

  public getAllLayers(map: ArlasMaplibreGL): TypedStyleLayer[] {
    return map.getMapProvider().getStyle().layers as TypedStyleLayer[];
  }

  /**
   * @override Maplibre implementation.
   * @param layer Layer identifier.
   * @param isVisible If true, the layer is made visible, otherwise, it is hidden.
   * @param map Map instance.
   */
  public setLayerVisibility(layerId: string, isVisible: boolean, map: ArlasMaplibreGL): void {
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
      if (this.hasLayer(map, scrollableId)) {
        map.getMapProvider().setLayoutProperty(scrollableId, 'visibility', isVisible ? 'visible' : 'none');
      }
    }
  }



  /**
   * @override Maplibre implementation.
   * Removes the source from the map instance
   * @param map Map Instance.
   * @param source Source identifier.
   */
  public removeSource(map: ArlasMaplibreGL, source: string) {
    if (!!source && this.hasSource(map, source)) {
      map.getMapProvider().removeSource(source);
    }
  };

  /**
   * @override Maplibre implementation.
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
   * @override Maplibre implementation.
   * Adds the given popup to the map.
   * @param map Map instance.
   * @param popup Popup instance.
   */
  public addPopup(map: ArlasMaplibreGL, popup: Popup): void {
    popup.addTo(map.getMapProvider());
  }

  /**
   * @override Maplibre implementation.
   * Removes the given popup from the map.
   * @param map Map instance.
   * @param popup Popup instance.
   */
  public removePopup(map: ArlasMaplibreGL, popup: Popup): void {
    popup.remove();
  }

  /**
   * @override Maplibre implementation.
   * Removes all the given layers (and their sources) from the map.
   * @param map Map instance.
   * @param layers Identifiers of layers to remove.
   */
  public removeLayers(map: ArlasMaplibreGL, layers: string[]): void {
    layers.forEach(l => this.removeLayer(map, l));
  }

  /**
   * @override Maplibre implementation.
   * Removes all layers which identifier includes the given id pattern.
   * @param map Map instance.
   * @param layersIdPattern Identifiers pattern to remove from the map.
   */
  public removeLayersFromPattern(map: ArlasMaplibreGL, layersIdPattern: string) {
    map.getMapProvider().getStyle().layers.filter(l => l.id.includes(layersIdPattern)).forEach(l => this.removeLayer(map, l.id));
  }

  /**
   * @override Maplibre implementation.
   * Checks if there are any layers respecting the given id pattern.
    * @param map Map instance.
   * @param layersIdPattern Identifiers pattern.
   * @returns
   */
  public hasLayersFromPattern(map: ArlasMaplibreGL, layersIdPattern: string) {
    return map.getMapProvider().getStyle().layers.filter(l => l.id.includes(layersIdPattern)).length > 0;
  }

  /**
   * @override Maplibre implementation.
   * Return any layer respecting the given id pattern
    * @param map Map instance.
   * @param layersIdPattern Identifiers pattern.
   * @returns a list of layers respecting the given id pattern
   */
  public getLayersFromPattern(map: ArlasMaplibreGL, layersIdPattern: string): AddLayerObject[] {
    return map.getMapProvider().getStyle().layers.filter(l => l.id.includes(layersIdPattern));
  }

  /**
  * @override Maplibre implementation.
  * Set the mouse cursor when it's over the map
  * @param map Map instance.
  * @param cursor cursor type (https://developer.mozilla.org/fr/docs/Web/CSS/cursor)
  */
  public setMapCursor(map: ArlasMaplibreGL, cursor: string): void {
    map.getMapProvider().getCanvas().style.cursor = cursor;
  }

  /**
   * @override Maplibre implementation.
   * Creates and returns a raster source instance.
   * @param url Url to the raster source.
   * @param bounds Bounds of the image [west, south, east, north].
   * @param maxZoom Maximal zoom to display the raster.
   * @param minZoom Minimal zoom to display the raster.
   * @param tileSize Size of the tiles fetched to display the raster (in pixels). Default to 256.
   * @returns a raster source instance.
   */
  public createRasterSource(url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number = 256): RasterSourceSpecification {
    return {
      type: 'raster',
      tiles: [url],
      bounds: bounds as [number, number, number, number],
      maxzoom: maxZoom,
      tileSize: tileSize
    };
  }

  /**
  * @override Maplibre implementation.
  * Creates a new Raster layer and adds it to the map.
  * @param map Map instance
  * @param url Url to the raster source.
  * @param bounds Bounds of the image [west, south, east, north].
  * @param maxZoom Maximal zoom to display the raster.
  * @param minZoom Minimal zoom to display the raster.
  * @param tileSize Size of the tiles fetched to display the raster (in pixels). Default to 256.
  * @param beforeId Identifier of an already added layer. The raster Layer is added under this 'beforeId' layer.
  */
  public addRasterLayer(map: ArlasMaplibreGL, layerId: string, url: string, bounds: number[],
    maxZoom: number, minZoom: number, tileSize: number, beforeId?: string): void {
    const rasterSource: RasterSourceSpecification = this.createRasterSource(url, bounds, maxZoom, minZoom, tileSize);
    const sourceId = layerId;
    this.setSource(sourceId, rasterSource, map);
    const iconLayer: RasterLayerSpecification = {
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
  * @override Maplibre implementation.
  * Creates a new geojsob layer and adds to the map
  * @param map Map instance
  * @param layerId The identifier of the new icon layer
  * @param style Vector style to apply to the geojson
  * @param data Geojson data which features will be styled with the given style.
  */
  public addGeojsonLayer(map: ArlasMaplibreGL, layerId: string, style: VectorStyle,
    data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>): void {
    const source: GeoJSONSourceSpecification = this.createGeojsonSource(data);
    const sourceId = layerId;
    this.setSource(sourceId, source, map);
    const geojsonLayer: LayerSpecification = {
      id: layerId,
      source: sourceId,
      type: style.type,
      paint: style.style,
      layout: {
        'visibility': 'visible'
      },
    };
    this.addLayer(map, geojsonLayer);
  }

  /**
   * @override Maplibre implementation.
   * Creates a new Icon layer and adds to the map
   * @param map Map instance
   * @param layerId The identifier of the new icon layer
   * @param iconName The icon name
   * @param iconSize The icon size
   * @param data Geojson data which features will be represented with the given icon.
   */
  public addIconLayer(map: ArlasMaplibreGL, layerId: string, iconName: string,
    iconSize: number, data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>) {
    const iconSource: GeoJSONSourceSpecification = this.createGeojsonSource(data);
    const sourceId = layerId;
    this.setSource(sourceId, iconSource, map);
    const iconLayer: SymbolLayerSpecification = {
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

  public flyTo(lat: number, lng: number, zoom: number, map: ArlasMaplibreGL) {
    map.getMapProvider().flyTo({ center: [lng, lat], zoom });
  }

  public filterGeojsonData(map: ArlasMaplibreGL, layerId: string, filter: any) {
    map.getMapProvider().setFilter(layerId, filter);
  }

  public queryFeatures(e: any, map: ArlasMaplibreGL, layersIdPattern: string, options: any) {
    map.getMapProvider().queryRenderedFeatures(e.point, options)
      .filter(f => !!f.layer && !!f.layer.id && f.layer.id.includes(layersIdPattern));
  };


  public isLayerVisible(layer: LayerSpecification): boolean {
    return layer.layout.visibility === 'visible';
  }

  public getSource(sourceId: string, map: ArlasMaplibreGL) {
    return (map as AbstractArlasMapGL).getMapProvider().getSource(sourceId);
  }






}

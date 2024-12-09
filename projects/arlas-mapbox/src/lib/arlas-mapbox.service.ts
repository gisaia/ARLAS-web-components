import { Injectable } from '@angular/core';
import { ArlasMapService, CROSS_LAYER_PREFIX, LngLat } from 'arlas-map';
import { AnyLayer, AnySourceData, GeoJSONSource, GeoJSONSourceOptions, GeoJSONSourceRaw, LngLatBounds, Point, Popup, RasterLayer, RasterSource, Source, SymbolLayer } from 'mapbox-gl';
import { ArlasMapboxConfig, ArlasMapboxGL } from './map/ArlasMapboxGL';
import { ArlasDraw } from './draw/ArlasDraw';
import { ArlasAnyLayer } from './map/model/layers';
import { FeatureCollection } from '@turf/helpers';
import { MapboxVectorStyle } from './map/model/vector-style';

@Injectable()
export class ArlasMapboxService extends ArlasMapService {


  constructor() {
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

  public getPointFromScreen(e, container: HTMLElement): Point {
    const rect = container.getBoundingClientRect();
    return new Point(
      e.clientX - rect.left - container.clientLeft,
      e.clientY - rect.top - container.clientTop
    );
  };

  public getLngLatBound(c1: LngLat, c2: LngLat): LngLatBounds {
    return new LngLatBounds(c1, c2);
  }
  public boundsToString(bounds: LngLatBounds): string {
    return bounds.getWest() + ',' + bounds.getSouth() + ',' + bounds.getEast() + ',' + bounds.getNorth();
  }

  public updateMapStyle(map: ArlasMapboxGL, l: any, ids: Array<string | number>, sourceName: string): void {
    const layer = map.getLayer(l) as ArlasAnyLayer;
    if (!!layer && typeof (layer.source) === 'string' && layer.source.indexOf(sourceName) >= 0) {
      if (ids && ids.length > 0) {
        // Tests value in camel and kebab case due to an unknown issue on other projects
        if (layer.metadata.isScrollableLayer || layer.metadata['is-scrollable-layer']) {
          map.setFilter(l, this.getVisibleIdsFilter(map, l, ids));
          const strokeLayerId = l.replace('_id:', '-fill_stroke-');
          const strokeLayer = map.getLayer(strokeLayerId);
          if (!!strokeLayer) {
            map.setFilter(strokeLayerId, this.getVisibleIdsFilter(map, strokeLayerId, ids));
          }
        }
      } else {
        map.setFilter(l, map.layersMap.get(l).filter);
        const strokeLayerId = l.replace('_id:', '-fill_stroke-');
        const strokeLayer = map.getLayer(strokeLayerId);
        if (!!strokeLayer) {
          map.setFilter(strokeLayerId,
            map.layersMap.get(strokeLayerId).filter);
        }
      }
    }
  }

  public setDataToGeojsonSource(source: GeoJSONSource, data: FeatureCollection<GeoJSON.Geometry>) {
    source.setData(data);
  };

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
        console.log('adding the imahe')
        if (!mapboxMap.hasImage(name)) {
          console.log(image)
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
  private hasSource(sourceId: string, map: ArlasMapboxGL): boolean {
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
    }
  };

  /**
   * @override Mapbox implementation.
   * Adds the given source to the map instance
   * @param sourceId Source identifier
   * @param source Source instance
   * @param map Map
   */
  public setSource(sourceId: string, source: AnySourceData, map: ArlasMapboxGL) {
    if (!this.hasSource(sourceId, map)) {
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
   * @param eventName 
   * @param map 
   * @param layer 
   * @param fn 
   */
  public onLayerEvent(eventName: 'click' | 'mousemove' | 'mouseleave', map: ArlasMapboxGL, layer: string, fn: () => void): void {
    map.getMapProvider().on(eventName, layer,  fn);
  }

  /**
   * @override Mapbox implementation.
   * Executes the 'fn' function on 'eventName' triggered from the 'map' instance.
   * @param eventName 
   * @param map 
   * @param fn 
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
  private getLayer(map: ArlasMapboxGL, layer: string): ArlasAnyLayer {
    return map.getMapProvider().getLayer(layer) as ArlasAnyLayer;
  }


  /**
   * @override Mapbox implementation.
   * Removes the source from the map instance
   * @param map 
   * @param source 
   */
  public removeSource(map: ArlasMapboxGL, source: string) {
    if (!!source && this.hasSource(source, map)) {
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
      .setHTML(message)
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
   * Checks if there are any layers respecting the given id patters
    * @param map Map instance.
   * @param layersIdPattern Identifiers pattern.
   * @returns 
   */
  public hasLayersFromPattern(map: ArlasMapboxGL, layersIdPattern: string) {
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
   * @returns 
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
    }
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
    }
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
  public addIconLayer(map: ArlasMapboxGL, layerId: string, iconName: string, iconSize: number, data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>) {
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
    }
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
    }
    style.applyStyle(geojsonLayer);
    this.addLayer(map, geojsonLayer);
  }

}

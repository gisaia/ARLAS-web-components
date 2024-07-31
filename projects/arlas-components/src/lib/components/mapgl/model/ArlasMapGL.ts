import { BaseMapGL, BaseMapGlConfig } from "./BaseMapGL";
import * as mapboxgl from "mapbox-gl";
import mapboxgl, { MapboxOptions } from "mapbox-gl";
import { FeatureCollection } from "@turf/helpers";
import { MapSource } from "./mapSource";
import { config } from "rxjs";
import { MapExtend } from "../mapgl.component.util";

interface ArlasMapGlConfig extends BaseMapGlConfig<MapboxOptions> {

}

export class ArlasMapGl extends BaseMapGL {
  mapProvider: mapboxgl.Map;
  emptyData: FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  };
  // points which xy coordinates are in screen referential
  start: mapboxgl.Point;
  current: mapboxgl.Point;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  startlngLat: mapboxgl.LngLat;
  endlngLat: mapboxgl.LngLat;
  movelngLat: mapboxgl.LngLat;


  init(config: ArlasMapGlConfig): void {
    this.mapProvider = new mapboxgl.Map(
      config.mapProviderOptions
      );
    // Disable map pitch and rotation with keyboard
    this.mapProvider.keyboard.disableRotation();
  }

  initControls(): void {
    this.mapProvider.addControl(new mapboxgl.AttributionControl(), this.config.mapAttributionPosition);

    /** Whether to display scale */
    if (this.config.displayScale) {
      const scale = new mapboxgl.ScaleControl({
        maxWidth: this.config.maxWidthScale,
        unit: this.config.unitScale,
      });
      this.mapProvider.addControl(scale, 'bottom-right');
    }
  }

  addSourcesToMap(sources: Array<MapSource>): void {
  }

  getMap(): mapboxgl.Map {
    return this.mapProvider;
  }

  getMapExtend(): MapExtend {
    const bounds = this.mapProvider.getBounds();
    return  { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.mapProvider.getZoom() };
  }



}

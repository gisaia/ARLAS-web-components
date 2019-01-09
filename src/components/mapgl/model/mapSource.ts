export class MapSource {
  public id: string;
  public source: string | mapboxgl.VectorSource | mapboxgl.RasterSource | mapboxgl.GeoJSONSource | mapboxgl.GeoJSONSourceRaw |
    mapboxgl.CanvasSource | mapboxgl.ImageSource | mapboxgl.VideoSource;
}

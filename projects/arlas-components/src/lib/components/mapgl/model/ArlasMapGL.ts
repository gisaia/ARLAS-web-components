import { BaseMapGL, BaseMapGlConfig, ControlPosition, DrawControlsOption } from "./BaseMapGL";
import mapboxgl, { AnySourceData, Control, IControl, MapboxOptions } from "mapbox-gl";
import { MapSource } from "./mapSource";
import { MapExtend } from "../mapgl.component.util";
import { ControlButton, DrawControl, PitchToggle } from "../mapgl.component.control";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { ArlasDrawGL } from "./ArlasDrawGL";
import { GEOJSON_SOURCE_TYPE } from "../mapgl.component";
import { FeatureCollection } from "@turf/helpers";

interface ArlasMapGlConfig extends BaseMapGlConfig<MapboxOptions> {

}

export class ArlasMapGl extends BaseMapGL {
  mapProvider: mapboxgl.Map;
  drawProvider;
  // points which xy coordinates are in screen referential
  start: mapboxgl.Point;
  current: mapboxgl.Point;
  // Lat/lng on mousedown (start); mouseup (end) and mousemove (between start and end)
  startlngLat: mapboxgl.LngLat;
  endlngLat: mapboxgl.LngLat;
  movelngLat: mapboxgl.LngLat;
  private emptyData: FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  };

  init(config: ArlasMapGlConfig): void {
    this.mapProvider = new mapboxgl.Map(
      config.mapProviderOptions
      );
    // Disable map pitch and rotation with keyboard
    this.mapProvider.keyboard.disableRotation();

    // disable box zoom;
    this.mapProvider.boxZoom.disable();

    this.initControls();
    this.initImages();
    this.initOnLoad();
  }

  initOnLoad(){
    this.onLoad(() => {
      this.loadIcons();
      this.initDataSources();
    })
  }

  initControls(): void {
    if(this.config.controls) {
      const controls = this.config.controls;
      if(controls.mapAttribution) {
        this.addControl(new mapboxgl.AttributionControl(controls.mapAttribution.config),controls.mapAttribution.position);
      }

      /** Whether to display scale */
      if (controls?.scale?.enable) {
        const defaultOpt = {
          maxWidth: this.config.maxWidthScale,
          unit: this.config.unitScale,
        };
        const opt = controls?.scale?.config ?? defaultOpt;
        const scale = new mapboxgl.ScaleControl(opt);
        this.addControl(scale, controls.scale?.position ?? 'bottom-right');
      }

      if(controls?.pitchToggle?.enable){
        const conf = controls.pitchToggle.config;
        this.addControl(new PitchToggle(conf.bearing, conf.pitch, conf.minpitchzoom), controls.pitchToggle?.position ?? 'top-right');
      }

      if(controls?.navigationControl?.enable) {
        this.addControl(new mapboxgl.NavigationControl(controls.navigationControl.config), controls.navigationControl?.position ?? 'top-right');
      }
    }
  }

  initDataSources(){
    if(this.config.dataSources){
      this.config.dataSources.forEach(id => {
        this.addSources(id, {type: GEOJSON_SOURCE_TYPE, data: this.emptyData })
      });
    }
  }

  setDrawProvider(mapboxDraw: MapboxDraw){
    this.drawProvider = new ArlasDrawGL(mapboxDraw);
  }

  initDrawControls(config: DrawControlsOption) {
    if(!this.drawProvider){
      console.warn('no draw provider defined');
      return;
    }

    this.addControl(config.draw.control, (config.draw?.position ?? 'top-right'));

    if(config.addGeoBox.enable){
      const addGeoBoxButton = new ControlButton(config.addGeoBox?.name ?? 'addgeobox');
      this.addControl(addGeoBoxButton, config.addGeoBox?.position ?? 'top-right', config.addGeoBox?.overrideEvent);

    }

    const removeAoisButton = new ControlButton('removeaois');
    this.addControl(removeAoisButton, config.removeAois?.position ?? 'top-right', config.removeAois?.overrideEvent);
  }

  public setCursorStyle(cursor: string){
    this.mapProvider.getCanvas().style.cursor = cursor;
  }

  addSources(sourceId: string, source: AnySourceData) {
    this.mapProvider.addSource(sourceId, source);
  }

  addSourcesToMap(sources: Array<MapSource>): void {
  }

  getMap(): mapboxgl.Map {
    return this.mapProvider;
  }

  getDraw(): MapboxDraw {
    return this.drawProvider;
  }

  getMapExtend(): MapExtend {
    const bounds = this.mapProvider.getBounds();
    return  { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.mapProvider.getZoom() };
  }

  initImages(){
    this.loadImage('assets/rotate/01.png', 'rotate');
    this.loadImage('assets/resize/01.png', 'resize');
  }

  loadImage(filePath: string, name: string, errorMessage?:string,  opt?: any){
    this.mapProvider.loadImage(filePath, (error, image) => {
      if (error) {
        console.warn(errorMessage);
      } else {
        if(opt){
          this.mapProvider.addImage(name, image, opt);
        } else {
          this.mapProvider.addImage(name, image);
        }
      }
    });
  }

  loadIcons(){
    if (this.config.icons) {
      this.config.icons.forEach(icon => {
        this.loadImage(
          this.ICONS_BASE_PATH + icon.path,
          icon.path.split('.')[0],
          'The icon "' + this.ICONS_BASE_PATH + icon.path + '" is not found',
          { 'sdf': icon.recolorable }
        );
      });
    }
  }


  public addControl(control: ControlButton, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left",  eventOverrid?: {
    event: string, fn: () => void});
  public addControl(control: Control | IControl, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left");
  public addControl(control: Control | IControl | ControlButton, position?: "top-right" | "top-left" | "bottom-right" | "bottom-left", eventOverrid?: {
    event: string, fn: () => void
  }){
    this.mapProvider.addControl(control, position);

    if(control instanceof  ControlButton && eventOverrid){
      control.btn[eventOverrid.event] = () => eventOverrid.fn();
    }
  }

  getBounds(){
    return this.mapProvider.getBounds();
  }

  getWestBounds(){
    return this.mapProvider.getBounds().getWest();
  }
  getNorthBounds(){
    return this.mapProvider.getBounds().getNorth();
  }
  getSouthBounds(){
    return this.mapProvider.getBounds().getSouth();
  }
  getEstBounds(){
    return this.getBounds().getEast();
  }

  getZoom(){
    return this.mapProvider.getZoom()
  }

  public getLayers(){
    return this.mapProvider.getStyle().layers
  }

  public getColdOrHotLayers(){
    return this.getLayers().map(layer => layer.id)
      .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0);
  }

  public onLoad(fn: () => void): void {
    this.mapProvider.on('load', fn);
  }

  public changeDrawStatic(){
  this.drawProvider.changeMode('static');
  }



}

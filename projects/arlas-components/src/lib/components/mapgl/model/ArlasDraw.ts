import { AbstractDraw } from "./AbstractDraw";
import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Feature } from "geojson";

export type DrawEvents = 'draw.create' | 'draw.delete' | 'draw.combine' | 'draw.uncombine' |
  'draw.update' | 'draw.selectionchange' | 'draw.modechange' | 'draw.render' | 'draw.actionable' |
  'draw.edit.saveInitialFeature' | 'draw.onClick' | 'draw.onStart' | 'draw.onStop'
  | 'draw.invalidGeometry'

export type DrawModes = 'SIMPLE_SELECT' | 'DRAW_CIRCLE' | 'DIRECT_SELECT' |
  'DRAW_LINE_STRING' | 'DRAW_POLYGON' | 'DRAW_POINT' | 'DRAW_RADIUS_CIRCLE' |
  'DRAW_STRIP' | 'DIRECT_STRIP'

export class ArlasDraw extends AbstractDraw {
  public drawProvider: MapboxDraw;
  public mapProvider: mapboxgl.Map;
  public enabled: boolean;
  public constructor(config: any, enabled: boolean, map: mapboxgl.Map) {
    super();
    console.log('init draw')
    const modes = MapboxDraw.modes;
    config.modes = Object.assign(
      modes,
      ...config.modes
    )
    this.config = config
    console.log('then')
    this.drawProvider = new MapboxDraw(this.config);
    console.log('then')
    this.mapProvider = map;
    this.enabled = enabled;
  }

  public onAdd(map) {
    const controlContainer = this.drawProvider.onAdd(map);
    if (!this.enabled) {
      controlContainer.className += ' draw-control-disabled';
    }
    return controlContainer;
  }

  public onRemove(map) {
    return this.drawProvider.onRemove(map);
  }

  public setMode(drawModes: DrawModes, replaceMode: any){
    this.drawProvider.modes[drawModes] = replaceMode;
  }

  getAllFeatures() {
    return this.getAll().features;
  }


  onDrawCreate(fn: (e) => void): void {
    this.on('draw.create', (e) => {
      fn(e);
    })
  }

  onDrawDelete(fn: (e) => void): void {
    this.on('draw.delete', (e) => {
      fn(e);
    })
  }

  onDrawEditSaveInitialFeature(fn: (e) => void): void {
    this.on('draw.edit.saveInitialFeature', (e) => {
      fn(e);
    })
  }

  onDrawInvalidGeometry(fn: (e) => void): void {
    this.on('draw.invalidGeometry', (e) => {
      fn(e);
    })
  }

  onDrawModeChange(fn: (e) => void): void {
    this.on('draw.modechange', (e) => {
      fn(e);
    })
  }

  onDrawOnClick(fn: (e) => void): void {
    this.on('draw.onClick', (e) => {
      fn(e);
    })
  }

  onDrawOnStart(fn: (e) => void): void {
    this.on('draw.onStart', (e) => {
      fn(e);
    })
  }

  onDrawOnStop(fn: (e) => void): void {
    this.on('draw.onStop', (e) => {
      fn(e);
    })
  }

  onDrawSelectionchange(fn: (e) => void): void {
    this.on('draw.selectionchange', (e) => {
      fn(e);
    });
  }

  onDrawUpdate(fn: (e) => void): void {
    this.on('draw.update', (e) => {
      fn(e);
    })
  }

  getMode(modes: DrawModes){
    console.log(this.drawProvider.modes)
    return this.drawProvider.modes[modes];
  }

  /**
   * class wrapper
   */

  on(event: DrawEvents, func: (e) => void): void {
    this.mapProvider.on(event, func);
  }


  add(features: any){
    this.drawProvider.add(features);
  }

  get(featureId: string): Feature | undefined {
   return this.drawProvider.get(featureId);
  }


  delete(ids: string | Array<string>): ArlasDraw {
    this.drawProvider.delete(ids);
    return  this;
  }
  deleteAll(): ArlasDraw {
    this.drawProvider.deleteAll();
    return this;
  }

  set(featureCollection: any): Array<string> {
    return  this.drawProvider.set(featureCollection);
  }

  trash(): ArlasDraw {
    this.drawProvider.trash();
    return this;
  }

  combineFeatures(): ArlasDraw {
    this.drawProvider.combineFeatures();
    return this;
  }
  uncombineFeatures(): ArlasDraw {
    this.drawProvider.uncombineFeatures();
    return this;
  }

  getCurrentMode(): string {
    return this.drawProvider.getMode();
  }

  getFeatureIdsAt(point: { x: number, y: number }): Array<string> {
    return this.drawProvider.getFeatureIdsAt(point);
  }

  getSelectedIds(): Array<string>{
    return this.drawProvider.getSelectedIds();
  }

  getSelected() {
    return this.drawProvider.getSelected();
  }

  getAll(){
    return this.drawProvider.getAll();
  }

  getSelectedFeatures(){
    return this.getSelected().features;
  }

  setFeatureProperty(featureId: string, property: string, value: any): ArlasDraw {
    this.drawProvider.setFeatureProperty(featureId, property, value);
    return  this;
  }

  changeMode(mode: string, opt?: any): ArlasDraw {
    this.drawProvider.changeMode(mode,opt);
    return this;
  }

}

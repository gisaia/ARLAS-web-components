import { AbstractDraw } from './AbstractDraw';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Feature } from 'geojson';

export type DrawEvents = 'draw.create' | 'draw.delete' | 'draw.combine' | 'draw.uncombine' |
  'draw.update' | 'draw.selectionchange' | 'draw.modechange' | 'draw.render' | 'draw.actionable' |
  'draw.edit.saveInitialFeature' | 'draw.onClick' | 'draw.onStart' | 'draw.onStop'
  | 'draw.invalidGeometry';

export type DrawModes = 'SIMPLE_SELECT' | 'DRAW_CIRCLE' | 'DIRECT_SELECT' |
  'DRAW_LINE_STRING' | 'DRAW_POLYGON' | 'DRAW_POINT' | 'DRAW_RADIUS_CIRCLE' |
  'DRAW_STRIP' | 'DIRECT_STRIP';

export class ArlasDraw extends AbstractDraw {
  public drawProvider: MapboxDraw;
  public mapProvider: mapboxgl.Map;
  public enabled: boolean;
  public constructor(config: any, enabled: boolean, map: mapboxgl.Map) {
    super();
    console.log('init draw');
    const modes = MapboxDraw.modes;
    this.config = JSON.parse(JSON.stringify(config));
    this.config.modes = Object.assign(modes, config.modes);
    console.log('Draw config',  this.config);
    this.drawProvider = new MapboxDraw(this.config);
    console.log('then');
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
    console.log(drawModes);
    this.drawProvider.modes[drawModes] = replaceMode;
  }

  public getAllFeatures() {
    return this.getAll().features;
  }

  public onDrawCreate(fn: (e) => void): void {
    this.on('draw.create', (e) => {
      fn(e);
    });
  }

  public onDrawDelete(fn: (e) => void): void {
    this.on('draw.delete', (e) => {
      fn(e);
    });
  }

  public onDrawEditSaveInitialFeature(fn: (e) => void): void {
    this.on('draw.edit.saveInitialFeature', (e) => {
      fn(e);
    });
  }

  public onDrawInvalidGeometry(fn: (e) => void): void {
    this.on('draw.invalidGeometry', (e) => {
      fn(e);
    });
  }

  public onDrawModeChange(fn: (e) => void): void {
    this.on('draw.modechange', (e) => {
      fn(e);
    });
  }

  public onDrawOnClick(fn: (e) => void): void {
    this.on('draw.onClick', (e) => {
      fn(e);
    });
  }

  public onDrawOnStart(fn: (e) => void): void {
    this.on('draw.onStart', (e) => {
      fn(e);
    });
  }

  public onDrawOnStop(fn: (e) => void): void {
    this.on('draw.onStop', (e) => {
      fn(e);
    });
  }

  public onDrawSelectionchange(fn: (e) => void): void {
    this.on('draw.selectionchange', (e) => {
      fn(e);
    });
  }

  public onDrawUpdate(fn: (e) => void): void {
    this.on('draw.update', (e) => {
      fn(e);
    });
  }

  public getMode(modes: DrawModes){
    console.log(modes);
    console.log(this.drawProvider.modes);
    return this.drawProvider.modes[modes];
  }

  /**
   * class wrapper
   */

  public on(event: DrawEvents, func: (e) => void): void {
    this.mapProvider.on(event, func);
  }


  public add(features: any){
    this.drawProvider.add(features);
  }

  public get(featureId: string): Feature | undefined {
   return this.drawProvider.get(featureId);
  }


  public delete(ids: string | Array<string>): ArlasDraw {
    this.drawProvider.delete(ids);
    return  this;
  }
  public deleteAll(): ArlasDraw {
    this.drawProvider.deleteAll();
    return this;
  }

  public set(featureCollection: any): Array<string> {
    return  this.drawProvider.set(featureCollection);
  }

  public trash(): ArlasDraw {
    this.drawProvider.trash();
    return this;
  }

  public combineFeatures(): ArlasDraw {
    this.drawProvider.combineFeatures();
    return this;
  }
  public uncombineFeatures(): ArlasDraw {
    this.drawProvider.uncombineFeatures();
    return this;
  }

  public getCurrentMode(): string {
    return this.drawProvider.getMode();
  }

  public getFeatureIdsAt(point: { x: number; y: number; }): Array<string> {
    return this.drawProvider.getFeatureIdsAt(point);
  }

  public getSelectedIds(): Array<string>{
    return this.drawProvider.getSelectedIds();
  }

  public getSelected() {
    return this.drawProvider.getSelected();
  }

  public getAll(){
    return this.drawProvider.getAll();
  }

  public getSelectedFeatures(){
    return this.getSelected().features;
  }

  public setFeatureProperty(featureId: string, property: string, value: any): ArlasDraw {
    this.drawProvider.setFeatureProperty(featureId, property, value);
    return  this;
  }

  public changeMode(mode: string, opt?: any): ArlasDraw {
    this.drawProvider.changeMode(mode,opt);
    return this;
  }

}

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

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Feature } from 'geojson';
import { AbstractArlasMapGL } from '../map/AbstractArlasMapGL';

export type DrawEvents = 'draw.create' | 'draw.delete' | 'draw.combine' | 'draw.uncombine' |
  'draw.update' | 'draw.selectionchange' | 'draw.modechange' | 'draw.render' | 'draw.actionable' |
  'draw.edit.saveInitialFeature' | 'draw.onClick' | 'draw.onStart' | 'draw.onStop'
  | 'draw.invalidGeometry';

export type DrawModes = 'SIMPLE_SELECT' | 'DRAW_CIRCLE' | 'DIRECT_SELECT' |
  'DRAW_LINE_STRING' | 'DRAW_POLYGON' | 'DRAW_POINT' | 'DRAW_RADIUS_CIRCLE' |
  'DRAW_STRIP' | 'DIRECT_STRIP';

export interface DrawEventsInterface {
  onDrawCreate: (...args) => void;
  onDrawUpdate: (...args) => void;
  onDrawDelete: (...args) => void;
  onDrawOnClick: (...args) => void;
  onDrawOnStart: (...args) => void;
  onDrawOnStop: (...args) => void;
  onDrawInvalidGeometry: (...args) => void;
  onDrawEditSaveInitialFeature: (...args) => void;
  onDrawSelectionchange: (...args) => void;
  onDrawModeChange: (...args) => void;
}

export class AbstractDraw implements DrawEventsInterface {
  protected config;
  public arlasMap: AbstractArlasMapGL;
  public enabled: boolean;
  public drawProvider: MapboxDraw;
  public constructor(config: any, enabled: boolean, map: AbstractArlasMapGL) {
    console.log('init draw');
    const modes = MapboxDraw.modes;
    this.config = JSON.parse(JSON.stringify(config));
    this.config.modes = Object.assign(modes, config.modes);
    console.log('Draw config', this.config);
    this.drawProvider = new MapboxDraw(this.config);
    console.log('then');
    this.arlasMap = map;
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

  public setMode(drawModes: DrawModes, replaceMode: any) {
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

  public getMode(modes: DrawModes) {
    console.log(modes);
    console.log(this.drawProvider.modes);
    return this.drawProvider.modes[modes];
  }

  /**
   * class wrapper
   */

  public on(event: DrawEvents, func: (e) => void): void {
    this.arlasMap.on(event, func);
  }


  public add(features: any) {
    this.drawProvider.add(features);
  }

  public get(featureId: string): Feature | undefined {
    return this.drawProvider.get(featureId);
  }


  public delete(ids: string | Array<string>): AbstractDraw {
    this.drawProvider.delete(ids);
    return this;
  }
  public deleteAll(): AbstractDraw {
    this.drawProvider.deleteAll();
    return this;
  }

  public set(featureCollection: any): Array<string> {
    return this.drawProvider.set(featureCollection);
  }

  public trash(): AbstractDraw {
    this.drawProvider.trash();
    return this;
  }

  public combineFeatures(): AbstractDraw {
    this.drawProvider.combineFeatures();
    return this;
  }
  public uncombineFeatures(): AbstractDraw {
    this.drawProvider.uncombineFeatures();
    return this;
  }

  public getCurrentMode(): string {
    return this.drawProvider.getMode();
  }

  public getFeatureIdsAt(point: { x: number; y: number; }): Array<string> {
    return this.drawProvider.getFeatureIdsAt(point);
  }

  public getSelectedIds(): Array<string> {
    return this.drawProvider.getSelectedIds();
  }

  public getSelected() {
    return this.drawProvider.getSelected();
  }

  public getAll() {
    return this.drawProvider.getAll();
  }

  public getSelectedFeatures() {
    return this.getSelected().features;
  }

  public setFeatureProperty(featureId: string, property: string, value: any): AbstractDraw {
    this.drawProvider.setFeatureProperty(featureId, property, value);
    return this;
  }

  public changeMode(mode: string, opt?: any): AbstractDraw {
    this.drawProvider.changeMode(mode, opt);
    return this;
  }



}

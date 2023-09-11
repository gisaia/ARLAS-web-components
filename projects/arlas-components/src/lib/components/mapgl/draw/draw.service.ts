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
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import area from '@turf/area';
import { Feature, FeatureCollection, lineString } from '@turf/helpers';
import bbox from '@turf/bbox';
import length from '@turf/length';
import { Subject } from 'rxjs';
import { AoiEdition } from './draw.models';

@Injectable()
export class MapboxAoiDrawService {
  private map: mapboxgl.Map;
  private mapDraw: MapboxDraw;
  private editionId: string;
  private registeringMode: boolean;
  private ids: Set<string> = new Set();
  private editAoiSource = new Subject<AoiEdition>();
  public editAoi$ = this.editAoiSource.asObservable();


  public constructor() { }

  public setMap(map: mapboxgl.Map) {
    this.map = map;
    this.onSelectionChange();
    this.onRender();
    this.onDelete();
    this.onStop();
  }

  public setMapboxDraw(mapboxDraw: mapboxgl.Map) {
    this.mapDraw = mapboxDraw;
  }

  public addFeatures(fc: FeatureCollection, deleteOld = false) {
    if (deleteOld) {
      this.mapDraw.deleteAll();
    }
    this.registeringMode = true;
    this.mapDraw.add(fc);
  }

  public deleteAll() {
    this.registeringMode = true;
    this.mapDraw.deleteAll();
  }

  public calculateArea(feature: Feature): number {
    let a = 0;
    if (this.isArea(feature)) {
      a = area(feature);
    }
    return a;
  }

  public calculateEnveloppeDimension(feature: Feature): [number, number] {
    const [minX, minY, maxX, maxY] = bbox(feature);
    const verticalLine = lineString([[minX, minY], [minX, maxY]]);
    const horizontalLine = lineString([[minX, minY], [maxX, minY]]);
    return [length(horizontalLine), length(verticalLine)];

  }

  public hideAoiEdition() {
    this.editAoiSource.next({
      area: 0,
      widthHeightBBox: [0, 0],
      show: true
    });
  }

  /** on selection of a drawn polygon, we get its corresponding id. */
  private onSelectionChange() {
    this.map.on('draw.selectionchange', (e) => {
      const features = e.features;
      if (this.hasSelection(features)) {
        this.editionId = features[0].id;
      } else {
        this.editionId = undefined;
        this.editAoiSource.next({
          area: 0,
          widthHeightBBox: [0, 0],
          show: false
        });
      }
    });
  }

  private onDelete() {
    this.map.on('draw.delete', (e) => {
      e.features.forEach(f => this.unregister(f.id));
    });
  }
  private hasSelection(features: any[]) {
    return !!features && features.length > 0;
  }

  private onStop() {
    this.map.on('draw.onStop', (e) => {
      this.editionId = undefined;
    });
  }

  private onRender() {
    this.map.on('draw.render', (e) => {
      if (this.mapDraw) {
        this.register();
        const unregisteredFeatures = this.getUnregistredFeatures();
        if (unregisteredFeatures && unregisteredFeatures.length === 1) {
          this.editionId = unregisteredFeatures[0].id + '';
        }
        if (this.editionId) {
          const feature = this.getFeature(this.editionId, this.mapDraw);
          const a = this.calculateArea(feature);
          const wh = this.calculateEnveloppeDimension(feature);
          this.editAoiSource.next({
            area: a,
            widthHeightBBox: wh,
            show: true
          });
        }
      }
    });
  }

  public emitAoiEdit(feature: Feature) {
    const a = this.calculateArea(feature);
    const wh = this.calculateEnveloppeDimension(feature);
    this.editAoiSource.next({
      area: a,
      widthHeightBBox: wh,
      show: true
    });
  }

  /** Mapbox lacks a method to get the identifier of a new feature that is being drawn and not yet created
   * this method detects this feature on 'draw.render' event.
  */
  private getUnregistredFeatures(): Feature[] {
    return this.mapDraw.getAll().features.filter(f => !this.ids.has(f.id));
  }

  /** registers the identifiers of each drawn polygon in this service. */
  private register() {
    if (this.registeringMode) {
      this.ids.clear();
      const fc = this.mapDraw.getAll();
      if (!!fc && !!fc.features) {
        this.ids = new Set(fc.features.map(f => f.id));
      }
      this.registeringMode = false;
    }
  }

  private unregister(id: string) {
    this.ids.delete(id);
  }

  private getFeature(featureId: string, mapDraw: MapboxDraw): Feature {
    return mapDraw.get(featureId);
  }

  private isArea(feature) {
    const isGeometryDefined = !!feature && !!feature.geometry;
    const areCoordinatesDefined = isGeometryDefined && !!feature.geometry.coordinates;
    if (areCoordinatesDefined) {
      const coordinates = feature.geometry.coordinates;
      const isArea = coordinates.length === 1 && coordinates[0].length > 3;
      return isArea;
    }
    return false;
  }
}

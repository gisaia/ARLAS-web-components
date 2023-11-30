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
import { AoiDimensions, BboxDrawCommand, Corner, EditionState } from './draw.models';

@Injectable()
export class MapboxAoiDrawService {
  private map: mapboxgl.Map;
  private mapDraw: MapboxDraw;
  private editionId: string;
  private registeringMode: boolean;
  private ids: Set<string> = new Set();

  private editAoiSource = new Subject<AoiDimensions>();
  public editAoi$ = this.editAoiSource.asObservable();

  private drawBboxSource = new Subject<BboxDrawCommand>();
  public drawBbox$ = this.drawBboxSource.asObservable();

  public bboxEditionState: EditionState;
  public polygonEditionState: EditionState;

  public constructor() {
    this.bboxEditionState = {
      enabled: false,
      isDrawing: false,
      isEditing: false
    };
    this.polygonEditionState = {
      enabled: false,
      isDrawing: false,
      isEditing: false
    };
  }

  public drawBbox(fCorner: Corner, sCorner: Corner) {
    const west = Math.min(fCorner.lng, sCorner.lng);
    const east = Math.max(fCorner.lng, sCorner.lng);
    const south = Math.min(fCorner.lat, sCorner.lat);
    const north = Math.max(fCorner.lat, sCorner.lat);
    this.drawBboxSource.next({
      west,
      east,
      south,
      north
    });
  }

  public enableBboxEdition() {
    this.bboxEditionState.enabled = true;
    this.bboxEditionState.isDrawing = false;
    this.bboxEditionState.isEditing = false;
  }

  public startBboxDrawing() {
    if (this.bboxEditionState.enabled) {
      this.bboxEditionState.isDrawing = true;
      this.bboxEditionState.isEditing = false;
    }
  }

  public stopBboxDrawing() {
    if (this.bboxEditionState.enabled) {
      this.bboxEditionState.isDrawing = false;
      this.bboxEditionState.isEditing = false;
    }
  }

  public disableBboxEdition() {
    this.bboxEditionState.enabled = false;
    this.bboxEditionState.isDrawing = false;
    this.bboxEditionState.isEditing = false;
  }

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

  /**
   * Add new features to the mapboxdraw object.
   * @param fc Featurecollection to be added to mapboxdraw object.
   * @param deleteOld if true, the mapboxdraw object is purged first, before adding the new given feature collection.
   */
  public addFeatures(fc: FeatureCollection, deleteOld = false) {
    if (deleteOld) {
      this.mapDraw.deleteAll();
    }
    this.registeringMode = true;
    this.mapDraw.add(fc);
  }

  /** Deletes all the features from Mapboxdraw object */
  public deleteAll() {
    this.registeringMode = true;
    this.mapDraw.deleteAll();
  }

  /** Returns the area of the given feature */
  public calculateArea(feature: Feature): number {
    if (this.isArea(feature)) {
      return area(feature);
    }
    return 0;
  }

  /** Returns the width x height of the given feature's envelope */
  public calculateEnvelopeDimension(feature: Feature): [number, number] {
    if (this.isLine(feature)) {
      const [minX, minY, maxX, maxY] = bbox(feature);
      const verticalLine = lineString([[minX, minY], [minX, maxY]]);
      const horizontalLine = lineString([[minX, minY], [maxX, minY]]);
      return [length(horizontalLine), length(verticalLine)];
    }
    return [0, 0];
  }

  /** on selection of a drawn polygon, we get its corresponding id. */
  private onSelectionChange() {
    this.map.on('draw.selectionchange', (e) => {
      const features = e.features;
      if (this.hasFeatures(features)) {
        this.editionId = features[0].id;
      } else {
        this.editionId = undefined;
        this.disableBboxEdition();
        this.endDimensionsEmission();
      }
    });
  }

  private hasFeatures(features: any[]) {
    return !!features && features.length > 0;
  }

  /** Triggered on deletion of feature(s).
   * - Removes the deleted feature(s) from this service's register.
   * - Stops emitting Aoi dimension info.
   * */
  private onDelete() {
    this.map.on('draw.delete', (e) => {
      e.features.forEach(f => this.unregister(f.id));
      this.editionId = undefined;
      this.endDimensionsEmission();
    });
  }


  private onStop() {
    this.map.on('draw.onStop', (e) => {
      this.register(this.editionId);
      this.editionId = undefined;
      this.endDimensionsEmission();
    });
  }

  /**
   * This event is triggered :
   * - after draw.update
   * - after draw.delete
   * - on adding/deleting features from mapboxdraw object.
   */
  private onRender() {
    this.map.on('draw.render', (e) => {
      if (this.mapDraw) {
        this.registerAll();
        const unregisteredFeatures = this.getUnregistredFeatures();
        if (unregisteredFeatures && unregisteredFeatures.length === 1) {
          this.editionId = unregisteredFeatures[0].id + '';
        }
        if (this.editionId) {
          const feature = this.getFeature(this.editionId, this.mapDraw);
          this.emitDimensions(feature);
        }
      }
    });
  }

  /** Emits dimension info of the given feature.*/
  public emitDimensions(feature: Feature) {
    const a = this.calculateArea(feature);
    const wh = this.calculateEnvelopeDimension(feature);
    this.editAoiSource.next({
      area: a,
      areaMessage: a > 0 ? '': 'Draw at least 2 points.',
      envelope: {
        width: wh[0],
        height: wh[1]
      },
      show: true
    });
  }

  /** Stops emitting Aoi dimension info */
  public endDimensionsEmission() {
    this.editAoiSource.next({
      area: 0,
      envelope: {
        width: 0,
        height: 0
      },
      show: false
    });
  }

  /** Mapbox lacks a method to get the identifier of a new feature that is being drawn and not yet created
   * this method detects this feature on 'draw.render' event.
  */
  private getUnregistredFeatures(): Feature[] {
    return this.mapDraw.getAll().features.filter(f => !this.ids.has(f.id));
  }

  /** registers the identifiers of each drawn polygon in this service. */
  private registerAll() {
    if (this.registeringMode) {
      this.ids.clear();
      const fc = this.mapDraw.getAll();
      if (!!fc && !!fc.features) {
        this.ids = new Set(fc.features.map(f => f.id));
      }
      this.registeringMode = false;
    }
  }

  /** Unregisters the given feature id in this service. */
  private unregister(id: string) {
    this.ids.delete(id);
  }

  /** Registers the given feature id in this service. */
  private register(id: string) {
    this.ids.add(id);
  }

  /** Gets the given feature from MapboxDraw object. */
  private getFeature(featureId: string, mapDraw: MapboxDraw): Feature {
    return mapDraw.get(featureId);
  }

  /** Checks if the given feature has enough coordinates to represent an area (polygon) */
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

  /** Checks if the given feature has enough coordinates to represent a line */
  private isLine(feature) {
    const isGeometryDefined = !!feature && !!feature.geometry;
    const areCoordinatesDefined = isGeometryDefined && !!feature.geometry.coordinates;
    if (areCoordinatesDefined) {
      const coordinates = feature.geometry.coordinates;
      const isLine = coordinates.length === 1 && coordinates[0].length > 1;
      return isLine;
    }
    return false;
  }
}

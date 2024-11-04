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
import area from '@turf/area';
import { Feature, FeatureCollection, lineString } from '@turf/helpers';
import bbox from '@turf/bbox';
import length from '@turf/length';
import { Subject } from 'rxjs';
import { AoiDimensions, BboxDrawCommand, Corner, EditionState } from './draw.models';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { AbstractDraw } from './AbstractDraw';

@Injectable()
export class MapboxAoiDrawService {
  private mapDraw: AbstractDraw;
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
    this.emitStartBBox();
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

  public setMapboxDraw(mapboxDraw: AbstractDraw) {
    this.mapDraw = mapboxDraw;
    this.onSelectionChange();
    this.onRender();
    this.onDelete();
    this.onStop();
  }

  /**
   * Add new features to the mapboxdraw object.
   * @param fc Featurecollection to be added to mapboxdraw object.
   * @param deleteOld if true, the mapboxdraw object is purged first, before adding the new given feature collection.
   */
  public addFeatures(fc: FeatureCollection<GeoJSON.Geometry>, deleteOld = false) {
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
    this.mapDraw.on('draw.selectionchange', (e) => {
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
    this.mapDraw.on('draw.delete', (e) => {
      e.features.forEach(f => this.unregister(f.id));
      this.editionId = undefined;
      this.endDimensionsEmission();
    });
  }


  private onStop() {
    this.mapDraw.on('draw.onStop', (e) => {
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
    this.mapDraw.on('draw.render', (e) => {
      if (this.mapDraw) {
        this.registerAll();
        const unregisteredFeatures = this.getUnregistredFeatures();
        if (unregisteredFeatures && (unregisteredFeatures.length === 1 || unregisteredFeatures.length === 2)) {
          const index = unregisteredFeatures.length - 1;
          this.editionId = unregisteredFeatures[index].id + '';
        }
        if (this.editionId) {
          const feature = this.getFeature(this.editionId, this.mapDraw);
          this.emitDimensions(feature);
        }
      }
    });
  }

  public emitStartBBox() {
    this.editAoiSource.next({
      area: 0,
      areaMessage: marker('Start draging to draw a bbox.'),
      envelope: {
        width: 0,
        height: 0
      },
      show: true
    });
  }

  /** Emits dimension info of the given feature.*/
  public emitDimensions(feature: Feature) {
    const a = this.calculateArea(feature);
    const wh = this.calculateEnvelopeDimension(feature);
    this.editAoiSource.next({
      area: a,
      areaMessage: a > 0 ? '' : marker('Draw at least 2 points.'),
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
    return (this.mapDraw.getAllFeatures() as Feature[]).filter(f => !this.ids.has(f.id.toString()));
  }

  /** registers the identifiers of each drawn polygon in this service. */
  private registerAll() {
    if (this.registeringMode) {
      this.ids.clear();
      const fc = this.mapDraw.getAll();
      if (!!fc && !!fc.features) {
        this.ids = new Set(fc.features.map(f => f.id.toString()));
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
  private getFeature(featureId: string, mapDraw: AbstractDraw): Feature {
    return mapDraw.get(featureId) as Feature;
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

  /**
   * Chck if its a valid circle
   * @param feature
   */
  public isValidCircle(feature): boolean {
    const coordinates = feature.geometry.coordinates;
    return this.isCircle(feature) && coordinates && coordinates[0] !== null && feature.properties.center;
  }

  public isValidPolygon(feature): boolean {
    const coordinates = feature.geometry.coordinates;
    return this.isPolygon(feature) && coordinates && coordinates[0] !== null && coordinates[0][0] !== null;
  }

  public isPolygon(feature): boolean {
    return feature.geometry.type === 'Polygon' && !this.isCircle(feature);
  }

  public isCircle(feature): boolean {
    return feature.properties?.isCircle;
  }
}

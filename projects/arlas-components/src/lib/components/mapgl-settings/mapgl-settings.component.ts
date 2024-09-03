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

import { Component, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { Subject, takeUntil } from 'rxjs';
import { ArlasColorService } from '../../services/color.generator.service';
import { SelectFormControl } from '../componentsUtils';

export interface GeometrySelectModel {
  path: string;
  selected?: boolean;
}
export interface OperationSelectModel {
  operation: GeoQueryOperator;
  selected?: boolean;
}
export interface GeoQuery {
  operation: string;
  geometry_path: string;
}

export enum GeoQueryOperator {
  WITHIN = 'within',
  NOT_WITHIN = 'notwithin',
  INTERSECTS = 'intersects',
  NOT_INTERSECTS = 'notintersects'
}

export interface MapSettingsService {
  getGeoQueries(): Map<string, [Array<GeometrySelectModel>, Array<OperationSelectModel>, string]>;
}

@Component({
  selector: 'arlas-mapgl-settings-dialog',
  templateUrl: './mapgl-settings-dialog.component.html',
  styleUrls: ['./mapgl-settings-dialog.component.scss']
})
export class MapglSettingsDialogComponent implements OnInit {
  /**
   * @Output : Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output() public geoQueryEmitter = new Subject<Map<string, GeoQuery>>();
  public emittedGeoQueries = new Map<string, GeoQuery>();
  /** Constants */
  public GEO_QUERIES_DESCRIPTION = marker('Draw a bbox or a polygon that');

  public geoQueriesFormGroups = new Array<UntypedFormGroup>();
  public collectionsColors = new Array<string>();
  public selectionsSnapshot = new Map<string, string>();

  private _onDestroy$ = new Subject<boolean>();

  public constructor(
    private dialogRef: MatDialogRef<MapglSettingsComponent>,
    private colorGeneratorLoader: ArlasColorService) { }

  public ngOnInit() { }

  public ngOnDestroy() {
    this._onDestroy$.next(true);
    this._onDestroy$.complete();
  }

  /** Emits the geo-query to apply */
  public emitGeoFilter() {
    this.geoQueryEmitter.next(this.emittedGeoQueries);
  }

  /** Closes the dialog */
  public onClose() {
    this.dialogRef.close();
  }

  public createGeoQueryForm(collectionName: string, displayCollectionName: string,
      filterGeometries: Array<GeometrySelectModel>, operationsSelectModel: Array<OperationSelectModel>): void {
    /** geometry */
    const geometryPaths = filterGeometries.map(fg => fg.path);
    const selectedGeometry = filterGeometries.find(fg => fg.selected);
    const selectedGeometryPath = !!selectedGeometry ? selectedGeometry.path : '';
    /** operation */
    const operations = operationsSelectModel.map(osm => osm.operation);
    const selectedOperationSelectModel = operationsSelectModel.find(osm => osm.selected);
    const selectedOperation = !!selectedOperationSelectModel ?  selectedOperationSelectModel.operation : GeoQueryOperator.INTERSECTS;
    const geoQueryControls = {
      a_operation: new SelectFormControl(selectedOperation, operations),
      b_geometryPath: new SelectFormControl(selectedGeometryPath, geometryPaths),
      c_collection: new UntypedFormControl(collectionName),
      d_displayCollectionName: new UntypedFormControl(displayCollectionName),
    };
    const geoQueryForm = new UntypedFormGroup(geoQueryControls);
    /** snapshot defaultselections */
    this.emittedGeoQueries.clear();
    this.selectionsSnapshot.clear();
    this.selectionsSnapshot.set(collectionName, selectedGeometry + selectedOperation);
    geoQueryForm.valueChanges
      .pipe(takeUntil(this._onDestroy$))
      .subscribe(vc => {
      const selectionSnapShot = vc.b_geometryPath + vc.a_operation;
      /** ignore selection changes if the user go back to initial state of a control */
      const ignoreChange = selectionSnapShot === this.selectionsSnapshot.get(vc.c_collection);
      if (ignoreChange) {
        this.emittedGeoQueries.delete(vc.c_collection);
      } else {
        this.emittedGeoQueries.set(vc.c_collection, {
          geometry_path: vc.b_geometryPath,
          operation: vc.a_operation
        });
      }
    });
    this.collectionsColors.push((this.colorGeneratorLoader.getColor(collectionName)));
    this.geoQueriesFormGroups.push(geoQueryForm);
  }
}

@Component({
  selector: 'arlas-mapgl-settings',
  templateUrl: './mapgl-settings.component.html',
  styleUrls: ['./mapgl-settings.component.scss']
})
export class MapglSettingsComponent implements OnInit {

  /**
   * @Output : Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output() public geoQueryEmitter = new Subject<Map<string, GeoQuery>>();

  public dialogRef: MatDialogRef<MapglSettingsDialogComponent>;

  public constructor(public dialog: MatDialog) { }

  public ngOnInit() { }

  public openDialog(mapSettingsService: MapSettingsService) {
    this.dialogRef = this.dialog.open(MapglSettingsDialogComponent, { data: null, panelClass: 'map-settings-dialog' });
    const mapGeoQueries = mapSettingsService.getGeoQueries();
    if (!!mapGeoQueries) {
      mapGeoQueries.forEach((geoQueries, collection) => {
        this.dialogRef.componentInstance.createGeoQueryForm(collection, geoQueries[2], geoQueries[0], geoQueries[1]);
      });
    }
    this.dialogRef.componentInstance.geoQueryEmitter = this.geoQueryEmitter;
  }
}

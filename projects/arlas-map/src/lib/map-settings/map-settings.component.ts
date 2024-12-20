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

import { Component, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Subject, takeUntil } from 'rxjs';
import { ArlasColorService } from 'arlas-web-components';

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

export class SelectFormControl extends UntypedFormControl {

  // used only for autocomplete: list of filtered options
  public filteredOptions: Array<string>;
  public syncOptions: Array<string> = [];

  public constructor(
    formState: any,
    label: string,
    options: Array<string>) {

    super(formState, Validators.required);
    this.setValue(formState);
    this.setSyncOptions(options);

  }

  public setSyncOptions(newOptions: Array<string>) {
    this.syncOptions = newOptions;
    this.filteredOptions = newOptions;
  }
}

export interface MapSettingsService {
  getGeoQueries(): Map<string, [Array<GeometrySelectModel>, Array<OperationSelectModel>, string]>;
}

@Component({
  selector: 'arlas-map-settings-dialog',
  templateUrl: './map-settings-dialog.component.html',
  styleUrls: ['./map-settings-dialog.component.scss']
})
export class MapSettingsDialogComponent {
  /**
   * @Output : Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output() public geoQueryEmitter: Subject<Map<string, GeoQuery>> = new Subject<Map<string, GeoQuery>>();
  public emittedGeoQueries: Map<string, GeoQuery> = new Map();
  /** Constants */
  public GEO_QUERIES_DESCRIPTION = marker('Draw a bbox or a polygon that');

  public geoQueriesFormGroups = new Array<UntypedFormGroup>();
  public collectionsColors = new Array<string>();
  public selectionsSnapshot = new Map<string, string>();

  private readonly _onDestroy$ = new Subject<boolean>();

  public constructor(
    private readonly dialogRef: MatDialogRef<MapSettingsComponent>,
    private readonly colorGeneratorLoader: ArlasColorService) { }

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
      a_operation: new SelectFormControl(selectedOperation, '', operations),
      b_geometryPath: new SelectFormControl(selectedGeometryPath, '', geometryPaths),
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
  selector: 'arlas-map-settings',
  templateUrl: './map-settings.component.html',
  styleUrls: ['./map-settings.component.scss']
})
export class MapSettingsComponent {

  /**
   * @Output : Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output() public geoQueryEmitter = new Subject<Map<string, GeoQuery>>();

  public dialogRef: MatDialogRef<MapSettingsDialogComponent>;

  public constructor(public dialog: MatDialog) { }

  public openDialog(mapSettingsService: MapSettingsService) {
    this.dialogRef = this.dialog.open(MapSettingsDialogComponent, { data: null, panelClass: 'map-settings-dialog' });
    const mapGeoQueries = mapSettingsService.getGeoQueries();
    if (!!mapGeoQueries) {
      mapGeoQueries.forEach((geoQueries, collection) => {
        this.dialogRef.componentInstance.createGeoQueryForm(collection, geoQueries[2], geoQueries[0], geoQueries[1]);
      });
    }
    this.dialogRef.componentInstance.geoQueryEmitter = this.geoQueryEmitter;
  }
}

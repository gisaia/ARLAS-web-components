import { Component, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { SelectFormControl, ColorGeneratorLoader } from '../componentsUtils';
import { ArlasColorService } from '../../services/color.generator.service';

export interface GeometrySelectModel {
  path: string;
  selected?: boolean;
}
export interface OperationSelectModel {
  operation: string;
  selected?: boolean;
}
export interface GeoQuery {
  operation: string;
  geometry_path: string;
}

export interface MapSettingsService {

  getGeoQueries(): Map<string, [Array<GeometrySelectModel>, Array<OperationSelectModel>]>;
}

@Component({
  selector: 'arlas-mapgl-settings-dialog',
  templateUrl: './mapgl-settings-dialog.component.html',
  styleUrls: ['./mapgl-settings-dialog.component.css']
})
export class MapglSettingsDialogComponent implements OnInit {
  /**
   * @Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output()
  public geoQueryEmitter: Subject<Map<string, GeoQuery>> = new Subject<Map<string, GeoQuery>>();
  public emittedGeoQueries: Map<string, GeoQuery> = new Map();
  /** Constants */
  public GEO_QUERIES_DESCRIPTION = 'Draw a bbox or a polygon that';
  public GEO_QUERIES_GEOMETRY_DESCRIPTION = 'the following geometry';
  public OP_CONSTANTS = {
    WITHIN: 'within',
    NOTWITHIN: 'notwithin',
    INTERSECTS: 'intersects',
    NOTINTERSECTS: 'notintersects'
  };
  public geoQueriesFormGroups: FormGroup[] = [];
  public collectionsColors: string[] = [];
  public selectionsSnapshot: Map<string, string> = new Map();

  constructor(private dialogRef: MatDialogRef<MapglSettingsComponent>, private colorGeneratorLoader: ArlasColorService    ) { }

  public ngOnInit() { }

  /** Emits the geo-query to apply */
  public emitGeoFilter() {
    this.geoQueryEmitter.next(this.emittedGeoQueries);
  }

  /** closes the dialog */
  public onClose() {
    this.dialogRef.close();
  }

  public createGeoQueryForm(collectionName: string, filterGeometries: Array<GeometrySelectModel>,
    operationsSelectModel: Array<OperationSelectModel>): void {
    /** geometry */
    const geometryPaths = filterGeometries.map(fg => fg.path);
    const selectedGeometry = filterGeometries.find(fg => fg.selected);
    const selectedGeometryPath = !!selectedGeometry ? selectedGeometry.path : '';
    /** operation */
    const operations = operationsSelectModel.map(osm => osm.operation);
    const selectedOperationSelectModel = operationsSelectModel.find(osm => osm.selected);
    const selectedOperation = !!selectedOperationSelectModel ?  selectedOperationSelectModel.operation : this.OP_CONSTANTS.INTERSECTS;
    const geoQueryControls = {
      a_operation: new SelectFormControl(selectedOperation, '', operations),
      b_geometryPath: new SelectFormControl(selectedGeometryPath, '', geometryPaths),
      c_collection: new FormControl(collectionName),
    };
    const geoQueryForm = new FormGroup(geoQueryControls);
    /** snapshot defaultselections */
    this.emittedGeoQueries.clear();
    this.selectionsSnapshot.clear();
    this.selectionsSnapshot.set(collectionName, selectedGeometry + selectedOperation);
    geoQueryForm.valueChanges.subscribe(vc => {
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
  styleUrls: ['./mapgl-settings.component.css']
})
export class MapglSettingsComponent implements OnInit {

  /**
   * @Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output()
  public geoQueryEmitter: Subject<Map<string, GeoQuery>> = new Subject<Map<string, GeoQuery>>();

  public dialogRef: MatDialogRef<MapglSettingsDialogComponent>;

  constructor(public dialog: MatDialog) { }

  public ngOnInit() { }

  public openDialog(mapSettingsService: MapSettingsService) {
    this.dialogRef = this.dialog.open(MapglSettingsDialogComponent, { data: null, panelClass: 'map-settings-dialog' });
    const mapGeoQueries = mapSettingsService.getGeoQueries();
    if (!!mapGeoQueries) {
      mapGeoQueries.forEach((geoQueries, collection) => {
        this.dialogRef.componentInstance.createGeoQueryForm(collection, geoQueries[0], geoQueries[1]);
      });
    }
    this.dialogRef.componentInstance.geoQueryEmitter = this.geoQueryEmitter;
  }
}

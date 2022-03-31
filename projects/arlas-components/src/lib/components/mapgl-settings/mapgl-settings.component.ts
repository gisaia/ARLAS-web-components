import { Component, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

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
  getFilterGeometries(): Array<GeometrySelectModel>;
  getOperations(): Array<OperationSelectModel>;
}

@Component({
  selector: 'arlas-mapgl-settings-dialog',
  templateUrl: './mapgl-settings-dialog.component.html',
  styleUrls: ['./mapgl-settings-dialog.component.css']
})
export class MapglSettingsDialogComponent implements OnInit {
  /**
   * @Angular
   * List of styles groups to display.
   * For cluster mode, a StyleGroup named "cluster" is needed ("StyleGroup.id":"cluster").
   * For feature mode, a StyleGroup should be created for each geometry ("StyleGroup.id": "{geometry_path}")
   */

  /**
   * @Angular
   * Emits the geo-query to apply. A geo-query is defined by
   * - the operation ("within", "intersects", "notwithin", "notintersects")
   * - the geometry field to query
   */
  @Output()
  public geoQueryEmitter: Subject<GeoQuery> = new Subject<GeoQuery>();

  /** Constants */
  public GEO_QUERIES_DESCRIPTION = 'Draw a bbox or a polygon that';
  public GEO_QUERIES_GEOMETRY_DESCRIPTION = 'the following geometry';
  public CONSTANTS = {
    WITHIN: 'within',
    NOTWITHIN: 'notwithin',
    INTERSECTS: 'intersects',
    NOTINTERSECTS: 'notintersects'
  };

  /** Rendered geometries form controls */
  public clusterGeoControl: FormControl = new FormControl('cluster_displayed_geo', Validators.required);
  public featuresGeoControl: FormControl = new FormControl('features_displayed_geo', Validators.required);
  public topologyGeoControl: FormControl = new FormControl('topology_displayed_geo', Validators.required);

  /** Geo-filter geometry form control */
  public geoFilterControl: FormControl = new FormControl('geo_filter_geometry', Validators.required);

  /** Variables binded with HTML, set from the parent component of this dialog*/
  public filterGeometries: Array<GeometrySelectModel>;
  public operations: Array<OperationSelectModel>;
  /** Variables binded with HTML, set inside this dialog */

  public selectedOperation: string;
  public selectedGeoFilterGeometry: GeometrySelectModel;

  constructor(private dialogRef: MatDialogRef<MapglSettingsComponent>) { }

  public ngOnInit() {
    /** Populate the filters geometries to query */
    if (this.filterGeometries) {
      this.geoFilterControl.setValue(this.filterGeometries);
      this.selectedGeoFilterGeometry = this.filterGeometries.filter(g => g.selected)[0];
      if (!this.selectedGeoFilterGeometry) {
        this.logSelectedGeometryError(this.filterGeometries);
      }
    }

    if (this.operations) {
      this.selectedOperation = this.operations.find(o => o.selected).operation;
    }
  }

  /** Emits the geo-query to apply */
  public emitGeoFilter() {
    this.geoQueryEmitter.next({
      operation: this.selectedOperation,
      geometry_path: this.geoFilterControl.value.path
    });
  }

  /** closes the dialog */
  public onClose() {
    this.dialogRef.close();
  }

  /** input function for mat-select */
  public compareGeometries = (o: GeometrySelectModel, s: GeometrySelectModel) => s.path === o.path;

  /** Logs an error if there are no selected geometry to apply queries*/
  private logSelectedGeometryError(gemetriesSelection: Array<GeometrySelectModel>): void {
    let NO_SELECTED_GEOMETRY = 'No geometry is selected to apply queries. There are ' + gemetriesSelection.length +
      'available geometries : ';
    gemetriesSelection.forEach(cg => NO_SELECTED_GEOMETRY += cg.path + ', ');
    console.error(NO_SELECTED_GEOMETRY);
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
  public geoQueryEmitter: Subject<GeoQuery> = new Subject<GeoQuery>();

  public dialogRef: MatDialogRef<MapglSettingsDialogComponent>;

  constructor(public dialog: MatDialog) { }

  public ngOnInit() { }

  public openDialog(mapSettingsService: MapSettingsService) {
    this.dialogRef = this.dialog.open(MapglSettingsDialogComponent, { data: null, panelClass: 'map-settings-dialog' });
    this.dialogRef.componentInstance.filterGeometries = mapSettingsService.getFilterGeometries();
    this.dialogRef.componentInstance.operations = mapSettingsService.getOperations();
    this.dialogRef.componentInstance.geoQueryEmitter = this.geoQueryEmitter;
  }
}

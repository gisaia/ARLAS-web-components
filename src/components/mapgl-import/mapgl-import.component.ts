import { Component, Input, ViewChild, ElementRef, Output } from '@angular/core';
import * as shp from 'shpjs/dist/shp';
import * as extent from 'turf-extent';
import * as helpers from '@turf/helpers';
import * as centroid from '@turf/centroid';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MapglComponent } from '../mapgl/mapgl.component';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './mapgl-import-dialog.component.html',
  selector: 'arlas-mapgl-import-dialog',
  styleUrls: ['./mapgl-import-dialog.component.css']
})

export class MapglImportDialogComponent {
  @Output() public imported = new Subject<any>();
  @Output() public error = new Subject<any>();

  @ViewChild('fileInput') public fileInput: ElementRef;

  public currentFile: File;
  public mapComponent: MapglComponent;
  public fitResult = false;
  public displayError = false;
  public errorMessage: string;
  public isRunning = false;
  public maxFeatures = 100000;

  private SOURCE_NAME_POLYGON_IMPORTED = 'polygon_imported';
  private SOURCE_NAME_POLYGON_LABEL = 'polygon_label';
  private emptyData = {
    'type': 'FeatureCollection',
    'features': []
  };

  constructor(private dialogRef: MatDialogRef<MapglImportDialogComponent>) {
    this.error.subscribe(message => this.errorMessage = message);
  }

  public onChange(files: FileList) {
    this.currentFile = files.item(0);
    this.displayError = false;
  }

  public onCancel() {
    this.dialogRef.close();
  }

  public import() {
    this.isRunning = true;
    const reader: FileReader = new FileReader();
    reader.onload = (() => {
      return (evt) => {
        this.clearPolygons();

        shp(evt.target.result).then(geojson => {
          const centroides = new Array<any>();
          const importedGeojson = {
            type: 'FeatureCollection',
            features: []
          };

          let index = 0;
          geojson.features.filter(feature => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
            .forEach((feature) => {
              if (feature.geometry.type === 'MultiPolygon') {
                // Create a new Polygon feature for each polygon in the MultiPolygon
                // All properties of the MultiPolygon are copied in each feature created
                feature.geometry.coordinates.forEach(geom => {
                  const newFeature = {
                    type: 'Feature',
                    geometry: {
                      bbox: feature.geometry.bbox,
                      coordinates: geom,
                      type: 'Polygon'
                    },
                    properties: feature.properties
                  };
                  newFeature.properties.arlas_id = ++index;
                  const cent = this.calcCentroid(newFeature);
                  centroides.push(cent);
                  importedGeojson.features.push(newFeature);
                });
              } else {
                feature.properties.arlas_id = ++index;
                const cent = this.calcCentroid(feature);
                centroides.push(cent);
                importedGeojson.features.push(feature);
              }
            });

          if (importedGeojson.features.length > this.maxFeatures) {
            this.throwError('Too much features (Max: ' + this.maxFeatures + ' - Currently: ' + importedGeojson.features.length + ')');
          } else {
            if (importedGeojson.features.length > 0) {
              this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_IMPORTED).setData(importedGeojson);
              this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_LABEL).setData({
                type: 'FeatureCollection',
                features: centroides
              });

              if (this.fitResult) {
                this.mapComponent.map.fitBounds(extent(importedGeojson));
              }
              this.imported.next(importedGeojson);
              this.isRunning = false;
              this.dialogRef.close();
            } else {
              this.throwError('No polygon to display in "' + this.currentFile.name + '"');
            }
          }
        });
      };
    })();

    reader.readAsArrayBuffer(this.currentFile);
  }

  public clearPolygons() {
    // Clean source of imported polygons
    const importSource = this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_IMPORTED);
    const labelSource = this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_LABEL);
    if (importSource !== undefined) {
      importSource.setData(this.emptyData);
    }
    if (labelSource !== undefined) {
      labelSource.setData(this.emptyData);
    }
  }

  public calcCentroid(feature) {
    const poly = helpers.polygon(feature.geometry.coordinates);
    const cent = centroid.default(poly);
    cent.properties.arlas_id = feature.properties.arlas_id;
    return cent;
  }

  private throwError(errorMessage: string) {
    this.error.next(errorMessage);
    this.displayError = true;
    this.isRunning = false;
    this.fileInput.nativeElement.value = '';
    this.currentFile = null;
  }
}


@Component({
  templateUrl: './mapgl-import.component.html',
  selector: 'arlas-mapgl-import',
  styleUrls: ['./mapgl-import.component.css']
})

export class MapglImportComponent {
  @Input() public icon = 'get_app';
  @Input() public mapComponent: MapglComponent;
  @Input() public maxFeatures?: number;
  @Output() public imported = new Subject<any>();
  @Output() public error = new Subject<any>();

  public dialogRef: MatDialogRef<MapglImportDialogComponent>;
  constructor(
    public dialog: MatDialog
  ) { }

  public openDialog() {
    this.dialogRef = this.dialog.open(MapglImportDialogComponent, { data: null });
    this.dialogRef.componentInstance.mapComponent = this.mapComponent;
    if (this.maxFeatures) {
      this.dialogRef.componentInstance.maxFeatures = this.maxFeatures;
    }

    this.dialogRef.componentInstance.imported.subscribe(imp => {
      this.imported.next(imp);
    });
    this.dialogRef.componentInstance.error.subscribe(error => {
      this.error.next(error);
    });

  }

}

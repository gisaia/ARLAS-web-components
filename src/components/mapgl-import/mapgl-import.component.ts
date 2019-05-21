import { Component, Input, ViewChild, ElementRef, Output } from '@angular/core';
import * as shp from 'shpjs/dist/shp';
import * as extent from 'turf-extent';
import * as helpers from '@turf/helpers';
import * as centroid from '@turf/centroid';
import * as JSZip from 'jszip';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MapglComponent } from '../mapgl/mapgl.component';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './mapgl-import-dialog.component.html',
  selector: 'arlas-mapgl-import-dialog',
  styleUrls: ['./mapgl-import-dialog.component.css']
})

export class MapglImportDialogComponent {
  public displayError = false;
  public isRunning = false;
  public fitResult = false;
  public errorMessage: string;
  public currentFile: File;

  @Output() public file = new Subject<File>();
  @Output() public importRun = new Subject<any>();
  @ViewChild('fileInput') public fileInput: ElementRef;

  constructor(private dialogRef: MatDialogRef<MapglImportDialogComponent>) { }

  public onChange(files: FileList) {
    this.file.next(files.item(0));
    this.currentFile = files.item(0);
    this.displayError = false;
  }

  public import() {
    this.importRun.next({ fitResult: this.fitResult });
  }

  public onCancel() {
    this.dialogRef.close();
  }
}


@Component({
  templateUrl: './mapgl-import.component.html',
  selector: 'arlas-mapgl-import',
  styleUrls: ['./mapgl-import.component.css']
})

export class MapglImportComponent {

  @Input() public mapComponent: MapglComponent;
  @Input() public maxFeatures?: number;
  @Input() public maxFileSize?: number;
  @Output() public imported = new Subject<any>();
  @Output() public error = new Subject<any>();
  @ViewChild('importDialog') public importDialog: MapglImportDialogComponent;

  public currentFile: File;
  public dialogRef: MatDialogRef<MapglImportDialogComponent>;

  private fitResult = false;
  private jszip: JSZip;
  private SOURCE_NAME_POLYGON_IMPORTED = 'polygon_imported';
  private SOURCE_NAME_POLYGON_LABEL = 'polygon_label';
  private emptyData = {
    'type': 'FeatureCollection',
    'features': []
  };

  constructor(
    public dialog: MatDialog
  ) {
  }

  public openDialog() {
    this.dialogRef = this.dialog.open(MapglImportDialogComponent, { data: null });
    this.dialogRef.componentInstance.file.subscribe((file: File) => {
      this.currentFile = file;
    });
    this.dialogRef.componentInstance.importRun.subscribe(importOptions => {
      this.fitResult = importOptions.fitResult;
      this.import();
    });
  }

  public import() {
    this.dialogRef.componentInstance.isRunning = true;
    const reader: FileReader = new FileReader();
    this.jszip = new JSZip();
    reader.onload = (() => {
      return (evt) => {
        this.jszip.loadAsync(evt.target.result).then( zip => {
          this.clearPolygons();

          if (!(Object.keys(zip.files)
            .map(fileName => fileName.split('.').pop().toLowerCase())
            .filter(elem => elem === 'shp' || elem === 'shx' || elem === 'dbf').length >= 3)
          ) {
            this.throwError('Zip file must contain at least a `.shp`, `.shx` and `.dbf`');

          } else {
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

              if (this.maxFeatures && importedGeojson.features.length > this.maxFeatures) {
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
                  this.imported.next(importedGeojson.features);
                  this.dialogRef.componentInstance.isRunning = false;
                  this.dialogRef.close();
                } else {
                  this.throwError('No polygon to display in "' + this.currentFile.name + '"');
                }
              }
            });
          }

        });


      };
    })();

    if (this.maxFileSize && this.currentFile.size > this.maxFileSize) {
      this.throwError('"' + this.currentFile.name +
        '" is too large (Max: ' + this.formatBytes(this.maxFileSize) + ' - Currently ' + this.formatBytes(this.currentFile.size) + ')');
    } else {
      if (this.currentFile.name.split('.').pop().toLowerCase() !== 'zip') {
        this.throwError('Only "zip" file is allowed');
      } else {
        reader.readAsArrayBuffer(this.currentFile);
      }
    }
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
    this.dialogRef.componentInstance.displayError = true;
    this.dialogRef.componentInstance.isRunning = false;
    this.dialogRef.componentInstance.errorMessage = errorMessage;
    this.dialogRef.componentInstance.fileInput.nativeElement.value = '';
    this.dialogRef.componentInstance.currentFile = null;
    this.currentFile = null;
  }

  private formatBytes(bytes, decimals = 2) {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

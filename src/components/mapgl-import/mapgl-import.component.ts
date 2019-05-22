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
  @Input() public maxVertexByPolygon: number;
  @Input() public maxFeatures?: number;
  @Input() public maxFileSize?: number;
  @Input() public maxLoadingTime = 20000;
  @Output() public imported = new Subject<any>();
  @Output() public error = new Subject<any>();
  @ViewChild('importDialog') public importDialog: MapglImportDialogComponent;

  public currentFile: File;
  public dialogRef: MatDialogRef<MapglImportDialogComponent>;
  public reader: FileReader;

  private tooManyVertex = false;
  private timeoutReached = false;
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

  public promiseTimeout(ms, promise) {

    // Create a promise that rejects in <ms> milliseconds
    const timeout = new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error('Timeout'));
      }, ms);
    });

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      promise,
      timeout
    ]);
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
    this.jszip = new JSZip();
    this.promiseTimeout(this.maxLoadingTime, this.processAll()).catch(error => {
      this.reader.abort();
      this.throwError(error);
    });

  }

  public readFile() {
    return new Promise((resolve, reject) => {
      this.reader = new FileReader();
      const reader = this.reader;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reader.abort();
        reject(new Error('Problem parsing input file.'));
      };
      reader.onprogress = () => {
        if (this.timeoutReached) {
          reader.abort();
        }
      };

      if (this.maxFileSize && this.currentFile.size > this.maxFileSize) {
        reject(new Error('"' + this.currentFile.name +
          '" is too large (Max: ' + this.formatBytes(this.maxFileSize) + ' - Currently ' + this.formatBytes(this.currentFile.size) + ')'));
      } else {
        if (this.currentFile.name.split('.').pop().toLowerCase() !== 'zip') {
          reject(new Error('Only "zip" file is allowed'));
        } else {
          reader.readAsArrayBuffer(this.currentFile);
        }
      }
    });
  }


  public processAll() {
    const fileReaderPromise = this.readFile();

    const zipLoaderPromise = fileReaderPromise.then(result => {
      return this.jszip.loadAsync(result);
    });

    const shapeParserPromise = fileReaderPromise
      .then(buffer => {
        return shp(buffer);
      });

    const geojsonParserPromise = shapeParserPromise.then(geojson => {
      return new Promise((resolve, reject) => {

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
        resolve([importedGeojson, centroides]);
      });
    });

    return Promise.all([fileReaderPromise, zipLoaderPromise, shapeParserPromise, geojsonParserPromise])
      .then(([a, b, c, geojsonReult]) => {
        this.clearPolygons();
        const testArray = Object.keys(b.files).map(fileName => fileName.split('.').pop().toLowerCase());
        if (
          !(testArray.filter(elem => elem === 'shp' || elem === 'shx' || elem === 'dbf').length >= 3) &&
          !(testArray.filter(elem => elem === 'json').length === 1)
        ) {
          throw new Error('Zip file must contain at least a `*.shp`, `*.shx` and `*.dbf` or a `*.json`');
        }


        if (this.tooManyVertex) {
          throw new Error('Too many vertices in a polygon');
        } else if (this.maxFeatures && geojsonReult[0].features.length > this.maxFeatures) {
          throw new Error('Too much features (Max: ' + this.maxFeatures + ' - Currently: ' + geojsonReult[0].features.length + ')');
        } else {
          if (geojsonReult[0].features.length > 0) {
            this.dialogRef.componentInstance.isRunning = false;
            this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_IMPORTED).setData(geojsonReult[0]);
            this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_LABEL).setData({
              type: 'FeatureCollection',
              features: geojsonReult[1]
            });

            if (this.fitResult) {
              this.mapComponent.map.fitBounds(extent(geojsonReult[0]));
            }
            this.imported.next(geojsonReult[0].features);
            this.dialogRef.close();

          } else {
            throw new Error('No polygon to display in "' + this.currentFile.name + '"');
          }
        }
      });
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
    if (this.maxVertexByPolygon && feature.geometry.coordinates[0].length > this.maxVertexByPolygon) {
      this.tooManyVertex = true;
    }
    const poly = helpers.polygon(feature.geometry.coordinates);
    const cent = centroid.default(poly);
    cent.properties.arlas_id = feature.properties.arlas_id;
    return cent;
  }


  private throwError(error: Error) {
    this.dialogRef.componentInstance.displayError = true;
    this.dialogRef.componentInstance.isRunning = false;
    this.dialogRef.componentInstance.errorMessage = error.message;
    this.dialogRef.componentInstance.fileInput.nativeElement.value = '';
    this.dialogRef.componentInstance.currentFile = null;
    this.error.next(error.message);
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

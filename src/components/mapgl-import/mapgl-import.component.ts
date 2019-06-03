import { Component, Input, ViewChild, ElementRef, Output } from '@angular/core';
import * as shp from 'shpjs/dist/shp';
import * as extent from 'turf-extent';
import * as helpers from '@turf/helpers';
import * as centroid from '@turf/centroid';
import * as JSZip from 'jszip';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MapglComponent } from '../mapgl/mapgl.component';
import { Subject } from 'rxjs';
import * as toGeoJSON from '@mapbox/togeojson';

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
  public errorThreshold: string;
  public currentFile: File;

  public importType = 'shp';

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
    this.importRun.next({ type: this.importType, fitResult: this.fitResult });
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

  public currentFile: File;
  public dialogRef: MatDialogRef<MapglImportDialogComponent>;
  public reader: FileReader;

  private tooManyVertex = false;
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
  ) { }

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
      this.import(importOptions.type);
    });
  }

  public import(importType: string) {
    this.dialogRef.componentInstance.isRunning = true;
    this.tooManyVertex = false;
    this.jszip = new JSZip();
    if (importType === 'shp') {
      this.promiseTimeout(this.maxLoadingTime, this.processAllShape()).catch(error => {
        this.reader.abort();
        this.throwError(error);
      });
    } else {
      this.promiseTimeout(this.maxLoadingTime, this.processAllKml()).catch(error => {
        this.reader.abort();
        this.throwError(error);
      });
    }
  }

  /***************/
  /***** KML *****/
  /***************/
  public readKmlFile() {
    return new Promise<string | ArrayBuffer>((resolve, reject) => {
      this.reader = new FileReader();
      const reader = this.reader;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reader.abort();
        reject(new Error('Problem parsing input file'));
      };

      if (this.maxFileSize && this.currentFile.size > this.maxFileSize) {
        reject(new Error('File is too large'));
      } else {
        if (this.currentFile.name.split('.').pop().toLowerCase() === 'kml') {
          reader.readAsText(this.currentFile);
        } else if (this.currentFile.name.split('.').pop().toLowerCase() === 'kmz') {
          reader.readAsArrayBuffer(this.currentFile);
        } else {
          reject(new Error('Only `kml` or `zip` file is allowed'));
        }
      }
    });
  }

  public processAllKml() {
    const readKmlFile = this.readKmlFile();

    let readKmzFile = readKmlFile;
    if (this.currentFile.name.split('.').pop().toLowerCase() === 'kmz') {
      readKmzFile = readKmlFile.then(result => {
        return new Promise<string>((resolve, reject) => {
          this.jszip.loadAsync(result).then(kmzContent => {
            const kmlFile = Object.keys(kmzContent.files).filter(file => file.split('.').pop().toLowerCase() === 'kml')[0];
            this.jszip.file(kmlFile).async('string').then(function (data) {
              resolve(data);
            });
          });
        });
      });
    }

    const parseKml = readKmzFile.then((file: string) => {
      return new Promise((resolve, reject) => {
        const geojson = toGeoJSON.kml((new DOMParser()).parseFromString(file, 'text/xml'));
        resolve(geojson);
      });
    });

    const geojsonParserPromise = parseKml.then((geojson: any) => {
      return new Promise<{ geojson: any, centroides: any }>((resolve, reject) => {
        const centroides = new Array<any>();
        const importedGeojson = {
          type: 'FeatureCollection',
          features: []
        };
        let index = 0;
        geojson.features.filter(feature => feature.geometry.type === 'Polygon'
          || feature.geometry.type === 'GeometryCollection'
          || feature.geometry.type === 'MultiGeometry')
          .forEach((feature) => {
            if (feature.geometry.type === 'GeometryCollection' || feature.geometry.type === 'MultiGeometry') {
              // Create a new Polygon feature for each polygon in the MultiPolygon
              // All properties of the MultiPolygon are copied in each feature created
              feature.geometry.geometries.filter(geom => geom.type === 'Polygon').forEach(geom => {
                const newFeature = {
                  type: 'Feature',
                  geometry: {
                    coordinates: geom.coordinates,
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
        resolve({ geojson: importedGeojson, centroides: centroides });
      });
    });

    return Promise.all<string | ArrayBuffer, any, { geojson: any, centroides: any }>([readKmzFile, parseKml, geojsonParserPromise])
      .then(([file, geojson, importedResult]) => {
        this.clearPolygons();
        if (this.tooManyVertex) {
          throw new Error('Too many vertices in a polygon');
        } else if (this.maxFeatures && importedResult.geojson.features.length > this.maxFeatures) {
          throw new Error('Too much features');
        } else {
          if (importedResult.geojson.features.length > 0) {
            this.dialogRef.componentInstance.isRunning = false;
            this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_IMPORTED).setData(importedResult.geojson);
            this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_LABEL).setData({
              type: 'FeatureCollection',
              features: importedResult.centroides
            });

            if (this.fitResult) {
              this.mapComponent.map.fitBounds(extent(importedResult.geojson));
            }
            this.imported.next(importedResult.geojson.features);
            this.dialogRef.close();
          } else {
            throw new Error('No polygon to display in this file');
          }
        }
      });
  }

  /***************/
  /**** SHAPE ****/
  /***************/
  public readZipFile() {
    return new Promise((resolve, reject) => {
      this.reader = new FileReader();
      const reader = this.reader;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reader.abort();
        reject(new Error('Problem parsing input file'));
      };

      if (this.maxFileSize && this.currentFile.size > this.maxFileSize) {
        reject(new Error('File is too large'));
      } else {
        if (this.currentFile.name.split('.').pop().toLowerCase() !== 'zip') {
          reject(new Error('Only `zip` file is allowed'));
        } else {
          reader.readAsArrayBuffer(this.currentFile);
        }
      }
    });
  }

  public processAllShape() {
    const fileReaderPromise = this.readZipFile();

    const zipLoaderPromise = fileReaderPromise.then(result => {
      return this.jszip.loadAsync(result);
    });

    const shapeParserPromise = fileReaderPromise
      .then(buffer => {
        return shp(buffer);
      });

    const geojsonParserPromise = shapeParserPromise.then(geojson => {
      return new Promise<{ geojson: any, centroides: any }>((resolve, reject) => {

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
        resolve({ geojson: importedGeojson, centroides: centroides });
      });
    });

    return Promise.all([fileReaderPromise, zipLoaderPromise, shapeParserPromise, geojsonParserPromise])
      .then(([a, zipResult, c, importedResult]) => {
        this.clearPolygons();
        const testArray = Object.keys(zipResult.files).map(fileName => fileName.split('.').pop().toLowerCase());
        if (
          !(testArray.filter(elem => elem === 'shp' || elem === 'shx' || elem === 'dbf').length >= 3) &&
          !(testArray.filter(elem => elem === 'json').length === 1)
        ) {
          throw new Error('Zip file must contain at least a `*.shp`, `*.shx` and `*.dbf` or a `*.json`');
        }

        if (this.tooManyVertex) {
          throw new Error('Too many vertices in a polygon');
        } else if (this.maxFeatures && importedResult.geojson.features.length > this.maxFeatures) {
          throw new Error('Too much features');
        } else {
          if (importedResult.geojson.features.length > 0) {
            this.dialogRef.componentInstance.isRunning = false;
            this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_IMPORTED).setData(importedResult.geojson);
            this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_LABEL).setData({
              type: 'FeatureCollection',
              features: importedResult.centroides
            });

            if (this.fitResult) {
              this.mapComponent.map.fitBounds(extent(importedResult.geojson));
            }
            this.imported.next(importedResult.geojson.features);
            this.dialogRef.close();
          } else {
            throw new Error('No polygon to display in this file');
          }
        }
      });
  }


  /***************/
  /**** TOOLS ****/
  /***************/
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
    if (this.maxVertexByPolygon && feature.geometry.coordinates[0].length - 1 > this.maxVertexByPolygon) {
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
    switch (this.dialogRef.componentInstance.errorMessage) {
      case 'Too much features':
        this.dialogRef.componentInstance.errorThreshold = this.maxFeatures.toString();
        break;
      case 'Too many vertices in a polygon':
        this.dialogRef.componentInstance.errorThreshold = this.maxVertexByPolygon.toString();
        break;
      case 'File is too large':
        this.dialogRef.componentInstance.errorThreshold = this.formatBytes(this.maxFileSize);
        break;
      case 'Timeout':
        this.dialogRef.componentInstance.errorThreshold = this.maxLoadingTime + ' ms';
        break;
      default:
        this.dialogRef.componentInstance.errorThreshold = '';
    }
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

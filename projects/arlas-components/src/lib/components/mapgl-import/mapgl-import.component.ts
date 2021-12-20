import { Component, ElementRef, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as toGeoJSON from '@mapbox/togeojson';
import centroid from '@turf/centroid';
import JSZip from 'jszip';
import { MapglComponent } from '../mapgl/mapgl.component';
import { FeatureCollection, polygon} from '@turf/helpers';
import { Subject } from 'rxjs';
import * as shp_ from 'shpjs/dist/shp';
import * as extent_ from 'turf-extent';
import { parse } from 'wellknown';
import { valid } from 'geojson-validation';
import * as gpsi_ from 'geojson-polygon-self-intersections';
const gpsi = gpsi_;
const extent = extent_;
const shp = shp_;

@Component({
  templateUrl: './mapgl-import-dialog.component.html',
  selector: 'arlas-mapgl-import-dialog',
  styleUrls: ['./mapgl-import-dialog.component.css']
})
export class MapglImportDialogComponent implements OnInit {
  public displayError = false;
  public isRunning = false;
  public fitResult = false;
  public errorMessage: string;
  public errorThreshold: string;
  public currentFile: File;

  public importType: string;
  public allowedFileExtension: string;
  public allowedImportType: string[];
  public wktContent = '';

  public SHP = 'shp';
  public KML = 'kml';
  public WKT = 'wkt';
  public GEOJSON = 'geojson';

  @Output() public file = new Subject<File>();
  @Output() public importRun = new Subject<any>();
  @ViewChild('fileInput', { static: false }) public fileInput: ElementRef;

  constructor(private dialogRef: MatDialogRef<MapglImportDialogComponent>) { }

  public ngOnInit(): void {
    if (this.allowedImportType.indexOf(this.SHP) > -1) {
      this.importType = this.SHP;
    } else if (this.allowedImportType.indexOf(this.KML) > -1) {
      this.importType = this.KML;
    } else if (this.allowedImportType.indexOf(this.WKT) > -1) {
      this.importType = this.WKT;
    } else {
      this.importType = this.GEOJSON;
    }
    this.changeType();
  }

  public onFileChange(files: FileList) {
    this.file.next(files.item(0));
    this.currentFile = files.item(0);
    this.displayError = false;
  }

  public import() {
    this.importRun.next({ type: this.importType, fitResult: this.fitResult, wktContent: this.wktContent });
  }

  public onTextChange() {

  }

  public changeType() {
    if (this.importType === this.SHP) {
      this.allowedFileExtension = '.zip';
    } else if (this.importType === this.KML) {
      this.allowedFileExtension = '.kml,.kmz';
    } else if (this.importType === this.GEOJSON) {
      this.allowedFileExtension = '.json';
    }
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

  public SHP = 'shp';
  public KML = 'kml';
  public WKT = 'wkt';
  public GEOJSON = 'geojson';

  public currentFile: File;
  public dialogRef: MatDialogRef<MapglImportDialogComponent>;
  public reader: FileReader;

  private tooManyVertex = false;
  private fitResult = false;
  private jszip: JSZip;
  private SOURCE_NAME_POLYGON_LABEL = 'polygon_label';
  private emptyData = {
    'type': 'FeatureCollection',
    'features': []
  };
  private featureIndex = 0;

  @Input() public mapComponent: MapglComponent;
  @Input() public maxVertexByPolygon: number;
  @Input() public maxFeatures?: number;
  @Input() public maxFileSize?: number;
  @Input() public maxLoadingTime = 20000;
  @Input() public allowedImportType = [this.SHP, this.KML, this.WKT, this.GEOJSON];
  @Output() public imported = new Subject<any>();
  @Output() public error = new Subject<any>();

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
    this.dialogRef.componentInstance.allowedImportType = this.allowedImportType;
    this.dialogRef.componentInstance.file.subscribe((file: File) => {
      this.currentFile = file;
    });
    this.dialogRef.componentInstance.importRun.subscribe(importOptions => {
      this.fitResult = importOptions.fitResult;
      this.import(importOptions.type, importOptions.wktContent);
    });
  }

  public import(importType: string, content?: string) {
    this.dialogRef.componentInstance.isRunning = true;
    this.tooManyVertex = false;
    this.jszip = new JSZip();
    let processPromise: Promise<void>;
    if (importType === this.SHP) {
      processPromise = this.processAllShape();
    } else if (importType === this.KML) {
      processPromise = this.processAllKml();
    } else if (importType === this.WKT) {
      processPromise = this.processWKT(content);
    } else if (importType === this.GEOJSON) {
      processPromise = this.processJson();
    }
    this.promiseTimeout(this.maxLoadingTime, processPromise).catch(error => {
      if (importType !== this.WKT) {
        this.reader.abort();
      }
      this.throwError(error);
    });
  }

  /** *************/
  /** *** KML *****/
  /** *************/
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
        if (this.currentFile.name.split('.').pop().toLowerCase() === this.KML) {
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
      readKmzFile = readKmlFile.then(result => new Promise<string>((resolve, reject) => {
        this.jszip.loadAsync(result).then(kmzContent => {
          const kmlFile = Object.keys(kmzContent.files).filter(file => file.split('.').pop().toLowerCase() === this.KML)[0];
          this.jszip.file(kmlFile).async('text').then(function (data) {
            resolve(data);
          });
        });
      }));
    }

    const parseKml = readKmzFile.then((file: string) => new Promise((resolve, reject) => {
      const geojson = toGeoJSON.kml((new DOMParser()).parseFromString(file, 'text/xml'));
      resolve(geojson);
    }));

    const geojsonParserPromise = parseKml.then((geojson: any) => new Promise<{ geojson: any; centroides: any; }>((resolve, reject) => {
      if (valid(geojson)) {
        const centroides = new Array<any>();
        const importedGeojson = {
          type: 'FeatureCollection',
          features: []
        };
        geojson.features.filter(feature => feature.geometry.type === 'Polygon'
            || feature.geometry.type === 'GeometryCollection'
            || feature.geometry.type === 'MultiGeometry'
            || feature.geometry.type === 'MultiPolygon')
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
                if (gpsi(newFeature).geometry.coordinates.length === 0) {
                  this.addFeature(newFeature, centroides, importedGeojson, ++this.featureIndex);
                } else {
                  reject(new Error('Geometry is not valid due to self-intersection'));
                }
              });
            } else if (feature.geometry.type === 'MultiPolygon') {
              feature.geometry.coordinates.forEach(geom => {
                const newFeature = {
                  type: 'Feature',
                  geometry: {
                    coordinates: geom,
                    type: 'Polygon'
                  },
                  properties: feature.properties
                };
                if (gpsi(newFeature).geometry.coordinates.length === 0) {
                  this.addFeature(newFeature, centroides, importedGeojson, ++this.featureIndex);
                } else {
                  reject(new Error('Geometry is not valid due to self-intersection'));
                }
              });
            } else {
              if (gpsi(feature).geometry.coordinates.length === 0) {
                this.addFeature(feature, centroides, importedGeojson, ++this.featureIndex);
              } else {
                reject(new Error('Geometry is not valid due to self-intersection'));
              }

            }
          });
        resolve({ geojson: importedGeojson, centroides: centroides });
      } else {
        reject(new Error('Geometry is not valid'));
      }
    }));

    return Promise.all<string | ArrayBuffer, any, { geojson: any; centroides: any; }>([readKmzFile, parseKml, geojsonParserPromise])
      .then(([file, geojson, importedResult]) => {
        this.setImportedData(importedResult);
      });
  }
  /** *************/
  /** * GEOJSON ***/
  /** *************/
  public readJsonFile() {
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
        const extension = this.currentFile.name.split('.').pop().toLowerCase();
        if (extension === 'json' || extension === 'geojson') {
          reader.readAsText(this.currentFile);
        } else {
          reject(new Error('Only `json` or `geojson` file is allowed'));
        }
      }
    });
  }

  public processJson() {
    const readJsonFile = this.readJsonFile();

    const parseJson = readJsonFile.then((fileContent: string) => new Promise<{ geojson: any; centroides: any; }>((resolve, reject) => {
      const feature = JSON.parse(fileContent);
      if (valid(feature)) {
        const centroides = new Array<any>();
        const importedGeojson = {
          type: 'FeatureCollection',
          features: []
        };
        if (feature.geometry && feature.geometry.type === 'Polygon') {
          if (gpsi(feature).geometry.coordinates.length === 0) {
            this.addFeature(feature, centroides, importedGeojson, ++this.featureIndex);
          } else {
            reject(new Error('Geometry is not valid due to self-intersection'));
          }
        } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(geom => {
            const newFeature = {
              type: 'Feature',
              geometry: {
                coordinates: geom,
                type: 'Polygon'
              },
              properties: feature.properties
            };
            if (gpsi(newFeature).geometry.coordinates.length === 0) {
              this.addFeature(newFeature, centroides, importedGeojson, ++this.featureIndex);
            } else {
              reject(new Error('Geometry is not valid due to self-intersection'));
            }
          });

        } else if (feature.type && feature.type === 'FeatureCollection') {
          feature.features.filter(feature => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
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
                  if (gpsi(newFeature).geometry.coordinates.length === 0) {
                    this.addFeature(newFeature, centroides, importedGeojson, ++this.featureIndex);
                  } else {
                    reject(new Error('Geometry is not valid due to self-intersection'));
                  }
                });
              } else {
                if (gpsi(feature).geometry.coordinates.length === 0) {
                  this.addFeature(feature, centroides, importedGeojson, ++this.featureIndex);
                } else {
                  reject(new Error('Geometry is not valid due to self-intersection'));
                }
              }
            });
        }
        resolve({ geojson: importedGeojson, centroides: centroides });
      } else {
        reject(new Error('Geometry is not valid'));
      }
    }));

    return Promise.all<string | ArrayBuffer, { geojson: any; centroides: any; }>([readJsonFile, parseJson])
      .then(([fileContent, importedResult]) => {
        this.setImportedData(importedResult);
      });
  }

  /** *************/
  /** ** SHAPE ****/
  /** *************/
  public readZipFile() {
    return new Promise((resolve, reject) => {
      this.reader = new FileReader();
      const reader = this.reader;
      reader.onload = () => {
        const resultToArray = new Uint8Array(<ArrayBuffer>reader.result);
        if (resultToArray.length === 0) {
          reader.abort();
          reject(new Error('File is empty'));
        } else {
          resolve(reader.result);
        }
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

    const zipLoaderPromise = fileReaderPromise.then((buffer: ArrayBuffer) => new Promise<any>((resolve, reject) => {
      this.jszip.loadAsync(buffer).then(zipResult => {
        const testArray = Object.keys(zipResult.files).map(fileName => fileName.split('.').pop().toLowerCase());
        if (
          !(testArray.filter(elem => elem === this.SHP || elem === 'shx' || elem === 'dbf').length >= 3) &&
            !(testArray.filter(elem => elem === 'json').length === 1)
        ) {
          reject(new Error('Zip file must contain at least a `*.shp`, `*.shx` and `*.dbf` or a `*.json`'));
        } else {
          resolve(buffer);
        }
      });
    }));

    const shapeParserPromise = zipLoaderPromise
      .then(buffer => shp(buffer));

    const geojsonParserPromise = shapeParserPromise.then(geojson => new Promise<{ geojson: any; centroides: any; }>((resolve, reject) => {

      const centroides = new Array<any>();
      const importedGeojson = {
        type: 'FeatureCollection',
        features: []
      };
      if (valid(geojson)) {
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
                if (gpsi(newFeature).geometry.coordinates.length === 0) {
                  this.addFeature(newFeature, centroides, importedGeojson, ++this.featureIndex);
                } else {
                  reject(new Error('Geometry is not valid due to self-intersection'));
                }
              });
            } else {
              if (gpsi(feature).geometry.coordinates.length === 0) {
                this.addFeature(feature, centroides, importedGeojson, ++this.featureIndex);
              } else {
                reject(new Error('Geometry is not valid due to self-intersection'));
              }
            }

          });
        resolve({ geojson: importedGeojson, centroides: centroides });
      } else {
        reject(new Error('Geometry is not valid'));
      }
    }));

    return Promise.all([fileReaderPromise, zipLoaderPromise, shapeParserPromise, geojsonParserPromise])
      .then(([a, b, c, importedResult]) => {
        this.setImportedData(importedResult);
      });
  }

  /** *************/
  /** **  WKT  ****/
  /** *************/
  public processWKT(wkt: string) {
    const wktParserPromise = new Promise<{ geojson: any; centroides: any; }>((resolve, reject) => {
      const geojsonWKT = parse(wkt);

      const centroides = new Array<any>();
      const importedGeojson = {
        type: 'FeatureCollection',
        features: []
      };
      if (geojsonWKT && valid(geojsonWKT)) {
        const feature = {
          type: 'Feature',
          geometry: geojsonWKT,
          properties: { arlas_id: null }
        };

        if (feature.geometry.type === 'Polygon') {
          if (gpsi(feature).geometry.coordinates.length === 0) {
            this.addFeature(feature, centroides, importedGeojson, ++this.featureIndex);
          } else {
            reject(new Error('Geometry is not valid due to self-intersection'));
          }
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(geom => {
            const newFeature = {
              type: 'Feature',
              geometry: {
                coordinates: geom,
                type: 'Polygon'
              },
              properties: feature.properties
            };
            if (gpsi(newFeature).geometry.coordinates.length === 0) {
              this.addFeature(newFeature, centroides, importedGeojson, ++this.featureIndex);
            } else {
              reject(new Error('Geometry is not valid due to self-intersection'));
            }
          });
        } else if (feature.geometry.type === 'GeometryCollection') {
          feature.geometry.geometries.filter(geom => geom.type === 'Polygon').forEach(geom => {
            const newFeature = {
              type: 'Feature',
              geometry: geom,
              properties: feature.properties
            };
            if (gpsi(newFeature).geometry.coordinates.length === 0) {
              this.addFeature(newFeature, centroides, importedGeojson, ++this.featureIndex);
            } else {
              reject(new Error('Geometry is not valid due to self-intersection'));
            }
          });
        }

        resolve({ geojson: importedGeojson, centroides: centroides });
      } else {
        reject(new Error('Geometry is not valid'));
      }
    });

    return Promise.all([wktParserPromise]).then(([importedResult]) => {
      this.setImportedData(importedResult);
    });
  }

  /** *************/
  /** ** TOOLS ****/
  /** *************/
  public clearPolygons() {
    // Clean source of imported polygons
    const labelSource = this.mapComponent.map.getSource(this.SOURCE_NAME_POLYGON_LABEL);
    this.featureIndex = 0;
    this.mapComponent.onAoiChanged.next(<FeatureCollection>this.emptyData);
    if (labelSource !== undefined) {
      labelSource.setData(this.emptyData);
    }
  }

  public addFeature(feature: any, centroides: Array<any>,
    importedGeojson: { type: string; features: Array<any>; }, index: number) {
    feature.properties.arlas_id = index;
    const cent = this.calcCentroid(feature);
    centroides.push(cent);
    importedGeojson.features.push(feature);
  }

  public setImportedData(importedResult) {
    if (this.tooManyVertex) {
      throw new Error('Too many vertices in a polygon');
    } else if (this.maxFeatures && importedResult.geojson.features.length > this.maxFeatures) {
      throw new Error('Too much features');
    } else {
      if (importedResult.geojson.features.length > 0) {
        this.dialogRef.componentInstance.isRunning = false;
        if (this.fitResult) {
          this.mapComponent.map.fitBounds(extent(importedResult.geojson));
        }
        if (this.mapComponent.drawData.features.length > 0) {
          this.mapComponent.drawData.features.forEach(df => importedResult.geojson.features.push(df));
        }
        this.imported.next(importedResult.geojson.features);
        this.mapComponent.onAoiChanged.next(importedResult.geojson);
        this.dialogRef.close();
      } else {
        throw new Error('No polygon to display in this file');
      }
    }
  }

  public calcCentroid(feature) {
    if (!this.maxVertexByPolygon) {
      this.maxVertexByPolygon = 100;
    }
    if (this.maxVertexByPolygon && feature.geometry.coordinates[0].length - 1 > this.maxVertexByPolygon) {
      this.tooManyVertex = true;
    }
    const poly = polygon(feature.geometry.coordinates);
    const cent = centroid(poly);
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
    if (this.dialogRef.componentInstance.fileInput) {
      this.dialogRef.componentInstance.fileInput.nativeElement.value = '';
    }
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

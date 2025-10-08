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

import { Component, ElementRef, inject, Inject, Input, Output, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import * as toGeoJSON from '@tmcw/togeojson';
import centroid from '@turf/centroid';
import { FeatureCollection, polygon } from '@turf/helpers';
import { Feature } from 'geojson';
import * as gpsi_ from 'geojson-polygon-self-intersections';
import { valid } from 'geojson-validation';
import JSZip from 'jszip';
import { Subject } from 'rxjs';
import * as shp_ from 'shpjs/dist/shp';
import { parse } from 'wellknown';
import { ArlasMapFrameworkService } from '../arlas-map-framework.service';
import { ArlasMapComponent } from '../arlas-map.component';


const gpsi = gpsi_.default;
const shp = shp_.default;


@Component({
  templateUrl: './map-import-dialog.component.html',
  selector: 'arlas-map-import-dialog',
  styleUrls: ['./map-import-dialog.component.scss']
})
export class MapImportDialogComponent {
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

  public SHP: string = marker('shp');
  public KML: string = marker('kml');
  public WKT: string = marker('wkt');
  public GEOJSON: string = marker('geojson');

  @Output() public file = new Subject<File>();
  @Output() public importRun = new Subject<any>();
  @ViewChild('fileInput', { static: false }) public fileInput: ElementRef;

  public constructor(
    private dialogRef: MatDialogRef<MapImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { allowedImportType: Array<string>; defaultFitResult?: boolean; }
  ) {
    this.fitResult = data.defaultFitResult ?? false;
    this.allowedImportType = this.data.allowedImportType.filter(t => [this.SHP, this.KML, this.WKT, this.GEOJSON].includes(t));

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

  public onTextChange() { }

  public changeType() {
    if (this.importType === this.SHP) {
      this.allowedFileExtension = '.zip';
    } else if (this.importType === this.KML) {
      this.allowedFileExtension = '.kml,.kmz';
    } else if (this.importType === this.GEOJSON) {
      this.allowedFileExtension = '.json,.geojson';
    }
  }

  public onCancel() {
    this.dialogRef.close();
  }
}

export type AllowedImportGeometry = 'Polygon' | 'Point';
const SIMPLE_GEOMETRY_OBJECT = ['Polygon', 'Point', 'LineString'];
@Component({
  selector: 'arlas-map-import',
  templateUrl: './map-import.component.html',
  styleUrls: ['./map-import.component.scss']
})
/** L: a layer class/interface.
 *  S: a source class/interface.
 *  M: a Map configuration class/interface.
 */
export class MapImportComponent<L, S, M> {

  public SHP = 'shp';
  public KML = 'kml';
  public WKT = 'wkt';
  public GEOJSON = 'geojson';

  public SELF_INTERSECT = marker('Geometry is not valid due to self-intersection');
  public PARSING_ISSUE = marker('Problem parsing input file');
  public FILE_TOO_LARGE = marker('File is too large');
  public GEOMETRY_INVALID = marker('Geometry is not valid');
  public TOO_MANY_VERTICES = marker('Too many vertices in a polygon');
  public TOO_MANY_FEATURES = marker('Too many features');
  public TIMEOUT = marker('Timeout');

  public currentFile: File;
  public dialogRef: MatDialogRef<MapImportDialogComponent>;
  public reader: FileReader;

  private tooManyVertex = false;
  private fitResult = false;
  private jszip: JSZip;
  private readonly SOURCE_NAME_POLYGON_LABEL = 'polygon_label';
  private emptyData: FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  };
  private featureIndex = 0;

  @Input() public mapComponent: ArlasMapComponent<L, S, M>;
  @Input() public maxVertexByPolygon: number;
  @Input() public maxFeatures?: number;
  @Input() public maxFileSize?: number;
  @Input() public maxLoadingTime = 20000;
  @Input() public allowedImportType = [this.SHP, this.KML, this.WKT, this.GEOJSON];
  @Input() public allowedGeometryObjectType: Array<AllowedImportGeometry> = ['Polygon'];
  @Output() public imported = new Subject<any>();
  @Output() public error = new Subject<any>();
  private _currentAllowedGeom: string[];

  private readonly mapService = inject(ArlasMapFrameworkService<L, S, M>);

  public constructor(
    public dialog: MatDialog
  ) { }

  public promiseTimeout(ms, promise) {

    // Create a promise that rejects in <ms> milliseconds
    const timeout = new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error(this.TIMEOUT));
      }, ms);
    });

    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      promise,
      timeout
    ]);
  }

  private buildAllowedGeometryForImportType(importType: string) {
    this._currentAllowedGeom = [];
    this.allowedGeometryObjectType.forEach(allowed => {
      this._currentAllowedGeom = this._currentAllowedGeom.concat(this.getAllowedGeom(allowed));
    });
    if (importType === this.KML) {
      this._currentAllowedGeom.push('GeometryCollection', 'MultiGeometry');
    } else if (importType === this.WKT) {
      this._currentAllowedGeom.push('GeometryCollection');
    }
  }

  private getAllowedGeom(allowed: AllowedImportGeometry): string[] {
    if (allowed === 'Polygon') {
      return ['Polygon', 'MultiPolygon'];
    }
    if (allowed === 'Point') {
      return ['Point', 'MultiPoint'];
    }
  }

  public openDialog(defaultFitResult?: boolean) {
    this.dialogRef = this.dialog.open(MapImportDialogComponent,
      { data: { allowedImportType: this.allowedImportType, defaultFitResult }, panelClass: 'map-import-dialog' });
    this.dialogRef.componentInstance.file.subscribe((file: File) => {
      this.currentFile = file;
    });
    this.dialogRef.componentInstance.importRun.subscribe(importOptions => {
      this.fitResult = importOptions.fitResult;
      this.buildAllowedGeometryForImportType(importOptions.type);
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

  public buildFeature(geom: any, feature: Feature | any, geometryType?: string, bbox?: boolean) {
    const f = {
      type: 'Feature',
      geometry: {
        coordinates: geom,
        type: geometryType ?? geom.type
      },
      properties: feature.properties
    };

    if (bbox) {
      f.geometry['bbox'] = feature.geometry.bbox;
    }
    return f;
  }

  public handleSimpleGeometry(feature, centroids, importedGeojson) {
    // avoid self intersect control for point
    if (feature.geometry.type === 'Point' || gpsi(feature).geometry.coordinates.length === 0) {
      this.addFeature(feature, centroids, importedGeojson, ++this.featureIndex);
    } else {
      throw new Error('Geometry is not valid due to self-intersection');
    }
  }

  public handleMultiGeometry(feature, centroids, importedGeojson) {
    // Create a new Polygon feature for each polygon in the MultiPolygon
    // All properties of the MultiPolygon are copied in each feature created
    const geomType = (feature.geometry.type === 'MultiPolygon') ? 'Polygon' : 'Point';
    feature.geometry.coordinates.forEach(geom => {
      const newFeature = this.buildFeature(geom, feature, geomType, true);
      this.handleSimpleGeometry(newFeature, centroids, importedGeojson);
    });
  }

  public handleGeometryCollection(feature, centroids, importedGeojson) {
    // Create a new Polygon feature for each polygon in the MultiPolygon
    // All properties of the MultiPolygon are copied in each feature created
    const simpleGeometry = this._currentAllowedGeom.filter(g => SIMPLE_GEOMETRY_OBJECT.includes(g));
    feature.geometry.geometries.filter(geom => simpleGeometry.includes(geom.type)).forEach(geom => {
      const newFeature = this.buildFeature(geom, feature);
      this.handleSimpleGeometry(newFeature, centroids, importedGeojson);
    });
  }

  public handleFeatureCollection(feature, centroids, importedGeojson) {
    feature.features.filter(feature => this._currentAllowedGeom.includes(feature.geometry.type))
      .forEach((feature) => {
        const multiGeometry = this._currentAllowedGeom.filter(g => !SIMPLE_GEOMETRY_OBJECT.includes(g));
        if (multiGeometry.includes(feature.geometry.type)) {
          this.handleMultiGeometry(feature, centroids, importedGeojson);
        } else {
          this.handleSimpleGeometry(feature, centroids, importedGeojson);
        }
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
        reject(new Error(this.PARSING_ISSUE));
      };

      if (this.maxFileSize && this.currentFile.size > this.maxFileSize) {
        reject(new Error(this.FILE_TOO_LARGE));
      } else if (this.currentFile.name.split('.').pop().toLowerCase() === this.KML) {
          reader.readAsText(this.currentFile);
        } else if (this.currentFile.name.split('.').pop().toLowerCase() === 'kmz') {
          reader.readAsArrayBuffer(this.currentFile);
        } else {
          reject(new Error(marker('Only `kml` or `zip` file is allowed')));
        }
    });
  }

  private resolveFileFromGzip(result, resolve) {
    this.jszip.loadAsync(result).then(kmzContent => {
      const kmlFile = Object.keys(kmzContent.files).filter(file => file.split('.').pop().toLowerCase() === this.KML)[0];
      this.jszip.file(kmlFile).async('text').then((data) => resolve(data));
    });
  }

  public processAllKml() {
    const readKmlFile = this.readKmlFile();

    let readKmzFile = readKmlFile;
    if (this.currentFile.name.split('.').pop().toLowerCase() === 'kmz') {
      readKmzFile = readKmlFile.then(result => new Promise<string>((resolve, reject) => {
      this.resolveFileFromGzip(result, resolve);
      }));
    }

    const parseKml = readKmzFile.then((file: string) => new Promise((resolve, reject) => {
      const geojson = toGeoJSON.kml((new DOMParser()).parseFromString(file, 'text/xml'));
      resolve(geojson);
    }));
    const geojsonParserPromise = parseKml.then((geojson: any) => new Promise<{ geojson: any; centroides: any; }>((resolve, reject) => {
      this.computeGeojson(geojson, reject, resolve);
    }));

    return Promise.all<{ geojson: any; centroides: any; }>([geojsonParserPromise])
      .then(([importedResult]) => {
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
        reject(new Error(this.PARSING_ISSUE));
      };

      if (this.maxFileSize && this.currentFile.size > this.maxFileSize) {
        reject(new Error(this.FILE_TOO_LARGE));
      } else {
        const extension = this.currentFile.name.split('.').pop().toLowerCase();
        if (extension === 'json' || extension === 'geojson') {
          reader.readAsText(this.currentFile);
        } else {
          reject(new Error(marker('Only `json` or `geojson` file is allowed')));
        }
      }
    });
  }

  public processJson() {
    const readJsonFile = this.readJsonFile();
    const parseJson = readJsonFile.then((fileContent: string) => new Promise<{ geojson: any; centroides: any; }>((resolve, reject) => {
      const feature = JSON.parse(fileContent);
      if (valid(feature) && (this._currentAllowedGeom.includes(feature.geometry) || feature.type === 'FeatureCollection')) {
        const centroides = new Array<any>();
        const importedGeojson = {
          type: 'FeatureCollection',
          features: []
        };
        try {
          if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'Point')) {
            this.handleSimpleGeometry(feature, centroides, importedGeojson);
          } else if (feature.geometry && (feature.geometry.type === 'MultiPolygon' || feature.geometry.type === 'MultiPoint')) {
            this.handleMultiGeometry(feature, centroides, importedGeojson);
          } else if (feature.type && feature.type === 'FeatureCollection') {
            this.handleFeatureCollection(feature, centroides, importedGeojson);
          }
          resolve({ geojson: importedGeojson, centroides: centroides });
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(this.GEOMETRY_INVALID));
      }
    }));

    return Promise.all<{ geojson: any; centroides: any; }>([parseJson])
      .then(([importedResult]) => {
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
          reject(new Error(marker('File is empty')));
        } else {
          resolve(reader.result);
        }
      };
      reader.onerror = () => {
        reader.abort();
        reject(new Error(this.PARSING_ISSUE));
      };

      if (this.maxFileSize && this.currentFile.size > this.maxFileSize) {
        reject(new Error(this.FILE_TOO_LARGE));
      } else if (this.currentFile.name.split('.').pop().toLowerCase() !== 'zip') {
          reject(new Error(marker('Only `zip` file is allowed')));
        } else {
          reader.readAsArrayBuffer(this.currentFile);
        }
    });
  }

  private areFilesInvalid(zipResult): boolean {
    const testArray = Object.keys(zipResult.files).map(fileName => fileName.split('.').pop().toLowerCase());
    return (testArray.filter(elem => elem === this.SHP || elem === 'shx' || elem === 'dbf').length < 3) &&
    (testArray.filter(elem => elem === 'json').length !== 1);
  }

  public processAllShape() {
    const fileReaderPromise = this.readZipFile();

    const zipLoaderPromise = fileReaderPromise.then((buffer: ArrayBuffer) => new Promise<any>((resolve, reject) => {
      this.jszip.loadAsync(buffer).then(zipResult => {
        if (this.areFilesInvalid(zipResult)) {
          reject(new Error(marker('Zip file must contain at least a `*.shp`, `*.shx` and `*.dbf` or a `*.json`')));
        } else {
          resolve(buffer);
        }
      });
    }));

    const shapeParserPromise = zipLoaderPromise
      .then(buffer => shp(buffer));

    const geojsonParserPromise = shapeParserPromise.then(geojson => new Promise<{ geojson: any; centroides: any; }>((resolve, reject) => {
      this.computeGeojson(geojson, reject, resolve);
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
      if (geojsonWKT && valid(geojsonWKT) && this._currentAllowedGeom.includes(geojsonWKT.type)) {
        const feature = {
          type: 'Feature',
          geometry: geojsonWKT,
          properties: { arlas_id: null }
        };
        this.handleGeom(feature, centroides, importedGeojson, reject);
        resolve({ geojson: importedGeojson, centroides: centroides });
      } else {
        reject(new Error(this.GEOMETRY_INVALID));
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
    const labelSource = this.mapService.getSource(this.SOURCE_NAME_POLYGON_LABEL, this.mapComponent.map);
    this.featureIndex = 0;
    this.mapComponent.onAoiChanged.next(this.emptyData);
    if (labelSource !== undefined) {
      this.mapService.setDataToGeojsonSource(labelSource, this.emptyData);
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
      throw new Error(this.TOO_MANY_VERTICES);
    } else if (this.maxFeatures && importedResult.geojson.features.length > this.maxFeatures) {
      throw new Error(this.TOO_MANY_FEATURES);
    } else if (importedResult.geojson.features.length > 0) {
      this.dialogRef.componentInstance.isRunning = false;
      if (this.fitResult) {
        this.mapComponent.fitToPaddedBounds(this.mapComponent.map.geometryToBounds(importedResult.geojson));
      }
      if (this.mapComponent.drawData.features.length > 0) {
        this.mapComponent.drawData.features.forEach(df => importedResult.geojson.features.push(df));
      }
      this.mapComponent.drawComponent.draw.changeMode('static');
      this.imported.next(importedResult.geojson.features);
      this.mapComponent.onAoiChanged.next(importedResult.geojson);
      this.dialogRef.close();
    } else {
      throw new Error(marker('No polygon to display in this file'));
    }
  }

  public calcCentroid(feature) {
    let cent;
    if (feature.type === 'Point') {
      cent = centroid(feature);
    } else {
      if (!this.maxVertexByPolygon) {
        this.maxVertexByPolygon = 100;
      }
      if (this.maxVertexByPolygon && feature.geometry.coordinates[0].length - 1 > this.maxVertexByPolygon) {
        this.tooManyVertex = true;
      }
      const poly = polygon(feature.geometry.coordinates);
      cent = centroid(poly);
    }

    cent.properties.arlas_id = feature.properties.arlas_id;
    return cent;
  }

  private throwError(error: Error) {
    this.dialogRef.componentInstance.displayError = true;
    this.dialogRef.componentInstance.isRunning = false;
    this.dialogRef.componentInstance.errorMessage = error.message;
    switch (this.dialogRef.componentInstance.errorMessage) {
      case this.TOO_MANY_FEATURES:
        this.dialogRef.componentInstance.errorThreshold = this.maxFeatures.toString();
        break;
      case this.TOO_MANY_VERTICES:
        this.dialogRef.componentInstance.errorThreshold = this.maxVertexByPolygon.toString();
        break;
      case this.FILE_TOO_LARGE:
        this.dialogRef.componentInstance.errorThreshold = this.formatBytes(this.maxFileSize);
        break;
      case this.TIMEOUT:
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

  private computeGeojson(geojson: any, reject: (reason?: any) => void,
    resolve: (value: { geojson: any; centroides: any; } | PromiseLike<{ geojson: any; centroides: any; }>) => void) {
    if (valid(geojson)) {
      const centroides = new Array<any>();
      const importedGeojson = {
        type: 'FeatureCollection',
        features: []
      };
      geojson.features.filter(feature => this._currentAllowedGeom.includes(feature.geometry.type))
        .forEach((feature) => {
          this.handleGeom(feature, centroides, importedGeojson, reject);
        });
      resolve({ geojson: importedGeojson, centroides: centroides });
    } else {
      reject(new Error('Geometry is not valid'));
    }
  }

  private handleGeom(feature: any, centroides: any[], importedGeojson: { type: string; features: any[]; }, reject: (reason?: any) => void) {
    try {
      if (feature.geometry.type === 'GeometryCollection' || feature.geometry.type === 'MultiGeometry') {
        // Create a new Polygon feature for each polygon in the MultiPolygon
        // All properties of the MultiPolygon are copied in each feature created
        this.handleGeometryCollection(feature, centroides, importedGeojson);
      } else if (feature.geometry.type === 'MultiPolygon' || feature.geometry.type === 'MultiPoint') {
        this.handleMultiGeometry(feature, centroides, importedGeojson);
      } else {
        this.handleSimpleGeometry(feature, centroides, importedGeojson);
      }
    } catch (e) {
      reject(new Error('Error during import'));
    }
  }
}

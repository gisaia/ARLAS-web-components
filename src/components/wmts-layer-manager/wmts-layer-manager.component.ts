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

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import moment from 'moment';
import { Observable, Subject } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { xyz } from '../mapgl/mapgl.component.util';

export interface GetTilesInfo {
  url: string;
  zoomMax: number;
  zoomMin: number;
  bbox: Array<number>;
  md: Object;
}

export interface Dimension {
  identifier: string;
  abstract: string;
  values: Array<string>;
  startDate?: Date;
  endDate?: Date;
}

export interface LayerParam {
  styles: Array<string>;
  dimensions?: Array<Dimension>;
}


@Component({
  templateUrl: './wmts-layer-manager-dialog.component.html',
  selector: 'arlas-wmts-layer-manager-dialog',
  styleUrls: ['./wmts-layer-manager-dialog.component.css']
})
export class WmtsLayerManagertDialogComponent implements OnInit {
  public layer: string;
  public style: string;
  public formGroup: FormGroup;
  public imageToShow: any;
  public isImageLoading = false;
  public showError = false;
  public previewLoading = false;
  public launchPreview = false;
  @Input() public layers: Array<string>;
  @Input() public styles: Array<string>;
  @Input() public metadata: Map<string, string>;
  @Input() public dimensions: Array<Dimension>;
  @Input() public data: Map<string, LayerParam>;
  @Input() public isDimension: boolean;
  @Output() public clickTopreview = new Subject<any>();

  constructor(private dialogRef: MatDialogRef<WmtsLayerManagertDialogComponent>, private http: HttpClient) { }

  public ngOnInit() {
    const l = new Array();
    this.data.forEach((value: LayerParam, key: string) => {
      l.push(key);
    });
    this.layers = l;
    this.formGroup = new FormGroup({
      layer: new FormControl(),
      style: new FormControl(),
    });
  }

  public selectionChange(event) {
    this.style = undefined;
    this.styles = new Array();
    this.styles = this.data.get(event.value).styles;
    this.dimensions = this.data.get(event.value).dimensions;
    this.dimensions.forEach(d => {
      this.formGroup.addControl(d.identifier, new FormControl);
    });
  }
  public clickOnPreview() {
    this.previewLoading = true;
    this.launchPreview = true;
    this.clickTopreview.next(this.formGroup.value);
  }

  public previewUrl(url: string) {
    this.isImageLoading = true;
    this.getImage(url).subscribe(data => {
      this.createImageFromBlob(data);
      this.isImageLoading = false;
    }, error => {
      this.isImageLoading = false;
      this.showError = true;
    });
  }

  private getImage(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, { responseType: 'blob' });
  }

  private createImageFromBlob(image: Blob) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      this.imageToShow = reader.result;
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }
}

@Component({
  selector: 'arlas-wmts-layer-manager',
  templateUrl: './wmts-layer-manager.component.html',
  styleUrls: ['./wmts-layer-manager.component.css']
})
export class WmtsLayerManagerComponent implements OnInit, OnChanges {
  public dialogRef: MatDialogRef<WmtsLayerManagertDialogComponent>;
  /**
   * @Input : Angular
   * @description Url to access  getCapabilities endpoint of WMTS service
   */
  @Input() public getCapaUrl: string;
  /**
   * @Input : Angular
   * @description Metadata of product to display (optional)
   */
  @Input() public metadata: Map<string, string>;
  /**
   * @Input : Angular
   * @description Base url to access getTiles endpoint of WMTS service
   * If this input is  provided, we use it to build getTiles endpoint
   * If this input is not provided, we try to find it in getCapabilities response
   */
  @Input() public getTilesBaseUrl: string;
  /**
  * @Input : Angular
  * @description Version of WMTS service
  * If this input is  provided, we use it to build getTiles endpoint
  * If this input is not provided, we try to find it in getCapabilities response
  */
  @Input() public version: string;
  /**
  * @Input : Angular
  * @description Format of getTile response
  * If getCapabilities does not contains this format, we send an error
   */
  @Input() public format = 'image/png';
  /**
  * @Input : Angular
  * @description Supported CRS code of WMTS service
  */
  @Input() public supportedCRSCode = '3857';
    /**
  * @Input : Angular
  * @description String date Format for time input
  */
  @Input() public dateFormat = 'YYYY-MM-DDT00:00:00';
  /**
  * @Input : Angular
  * @description Value to use in TileMatrixSet
  * If this input is  provided, we use it and we dont search TileMatrixSet in getCapabilities
  */
  @Input() public crsCode: string;
  /**
   * @Output : Angular
   * @description Emit the information needed by a wmts client to view a product
   */
  @Output() public getTilesInfoBus = new Subject<GetTilesInfo>();
  /**
   * @Output : Angular
   * @description Emit all errors of the component
   */
  @Output() public onError = new Subject<Error>();

  public errorInRun = false;
  public isGetCapaLoading = false;

  public constructor(public dialog: MatDialog, private http: HttpClient) {

  }

  public ngOnInit() {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['getCapaUrl'] !== undefined) {
      this.getCapaUrl = changes['getCapaUrl'].currentValue;
    }
  }


  public run(header?: HttpHeaders, md = {}, timeoutDuration: number = 100000, numberOfRetry: number = 0) {
    // Call the gatCapabilities services
    this.errorInRun = false;
    this.isGetCapaLoading = true;
    const httpCall: Observable<string> = this.http.get(this.getCapaUrl, { headers: header, responseType: 'text' });
    httpCall
      .pipe(timeout(timeoutDuration),
        retry(numberOfRetry))
      .subscribe(
        response => {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response, 'text/xml');
            const data = this.geLayerToData(xmlDoc);
            // if getCapa contains juste one layer and one style we just build the url and send it to the bus
            const mapSize = data.size;
            if (mapSize === 0) {
              const nonDataError: Error = new Error('NoStyle-NoLayer');
              this.errorInRun = true;
              this.onError.next(nonDataError);
            }
            if (mapSize === 1 && data.values().next().value.styles.length === 1) {
              // update layer and style
              this.getTilesInfoBus.next(this.buildGetTileInfo(xmlDoc, data.keys().next().value, data.values().next().value.styles[0], md));
            } else {
              this.dialogRef = this.dialog.open(WmtsLayerManagertDialogComponent, { data: response });
              this.isGetCapaLoading = false;
              this.dialogRef.componentInstance.data = data;
              this.dialogRef.componentInstance.metadata = this.metadata;
              this.dialogRef.afterClosed().subscribe(formGroupValue => {
                if (formGroupValue) {
                  const getTileInfo = this.buildGetTileInfo(xmlDoc,
                    formGroupValue.layer,
                    formGroupValue.style, md,
                    this.getDimensionsFromGroupValues(formGroupValue));
                  if (!this.errorInRun) {
                    this.getTilesInfoBus.next(getTileInfo);
                  }
                }
              });
              this.dialogRef.componentInstance.clickTopreview.subscribe(formGroupValue => {
                const getTileInfo = this.buildGetTileInfo(xmlDoc,
                  formGroupValue.layer,
                  formGroupValue.style, md,
                  this.getDimensionsFromGroupValues(formGroupValue));
                if (!this.errorInRun) {
                  // bounds[[west,south][east,north]]
                  const bounds = getTileInfo.bbox;
                  const tiles = xyz([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], getTileInfo.zoomMin)
                    .filter(obj => obj.x >= 0 && obj.y >= 0);
                  const previewURL = getTileInfo.url
                    .replace('{x}', tiles[0].x.toString())
                   .replace('{y}', tiles[0].y.toString())
                    .replace('{z}', tiles[0].z.toString());
                  this.dialogRef.componentInstance.previewUrl(previewURL);
                }
              });
            }
          } catch (e) {
            this.onError.next(e);
            this.isGetCapaLoading = false;
          }
        },
        error => {
        this.isGetCapaLoading = false;
          this.onError.next(error);
        });
  }

  public geLayerToData(xmlDoc: Document): Map<string, LayerParam> {
    const layerToData: Map<string, LayerParam> = new Map<string, LayerParam>();
    const layers = Array.from(xmlDoc.getElementsByTagName('Layer'));
    layers.forEach(l => {
      const identifier = l.getElementsByTagName('ows:Identifier')[0].textContent.replace(/\n/g, '');
      const styles = Array.from(l.getElementsByTagName('Style'))
        .map(s => s.getElementsByTagName('ows:Identifier')[0].textContent.replace(/\n/g, ''));
      const data = {
        styles: styles,
        dimensions: this.getDimension(l)
      };
      layerToData.set(identifier, data);
    });
    return layerToData;
  }

  public getDimension(layerElement: Element): Array<Dimension> {
    const dimensionElements = layerElement.getElementsByTagName('Dimension');
    const allDimension: Array<Dimension> = Array.from(dimensionElements).map(e => {
      return {
        identifier: e.getElementsByTagName('ows:Identifier')[0].textContent.replace(/\n/g, ''),
        abstract: e.getElementsByTagName('ows:Abstract')[0].textContent.replace(/\n/g, ''),
        values: Array.from(e.getElementsByTagName('Value')).map(el => el.textContent.replace(/\n/g, ''))
      };
    });
    const timeDimension = allDimension.filter(r => r.identifier === 'time').map(r => {
      let startDate = null;
      let endDate = null;
      if (r.abstract.indexOf('/') > 0) {
        startDate = new Date(r.abstract.split('/')[0]);
        endDate = new Date(r.abstract.split('/')[1]);
        r.startDate = startDate;
        r.endDate = endDate;
      }
      return r;
    })[0];
    const result = allDimension.filter(r => r.identifier !== 'time').concat(timeDimension);
    return result.filter(data => data !== undefined);
  }

  public getFormat(xmlDoc: Document, layer: string): string {
    const layerElement = Array.from(xmlDoc.getElementsByTagName('Layer'))
      .filter(l => l.getElementsByTagName('ows:Identifier')[0].textContent.replace(/\n/g, '') === layer)[0];
    const format = new Set(Array.from(layerElement.getElementsByTagName('Format'))
      .filter(f => f.textContent === this.format).map(e => e.textContent));
    if (format.has(this.format)) {
      return this.format;
    } else {
      const formatError = new Error(this.format.concat(' does not exist for layer ').concat(layer));
      this.errorInRun = true;
      this.onError.next(formatError);
    }
  }

  public getVersion(xmlDoc): string {
    if (this.version === undefined) {
      try {
        return xmlDoc.getElementsByTagName('ows:ServiceTypeVersion')[0].textContent;
      } catch (e) {
        this.onError.next(new Error(e));
      }
    } else {
      return this.version;
    }
  }

  public getKVPBaseUrl(xmlDoc: Document): string {
    if (this.getTilesBaseUrl === undefined) {
      try {
        const getCapaOperationNode = Array.from(xmlDoc
          .getElementsByTagName('ows:OperationsMetadata')[0]
          .getElementsByTagName('ows:Operation'))
          .filter(element => element.getAttribute('name') === 'GetCapabilities')[0];

        const getKvpNode = Array.from(getCapaOperationNode.
          getElementsByTagName('ows:Get'))
          .filter(element => Array.from(element.getElementsByTagName('ows:Value'))
            .filter(e => e.textContent === 'KVP').length > 0)[0];
        return getKvpNode.getAttribute('xlink:href');
      } catch (e) {
        this.onError.next(e);
      }
    } else {
      return this.getTilesBaseUrl;
    }
  }

  public getTileMatrixSet(xmlDoc: Document): string {
    if (this.crsCode === undefined) {
      let tileMatrixSet = 'EPSG:'.concat(this.supportedCRSCode);
      Array.from(xmlDoc.getElementsByTagName('ows:Identifier')).forEach(node => {
        if (node.textContent.indexOf('EPSG') >= 0 && node.textContent.indexOf(this.supportedCRSCode)) {
          tileMatrixSet = node.textContent;
        }
      });
      return tileMatrixSet;
    } else {
      return this.crsCode;
    }
  }

  public getBbox(xmlDoc: Document, layer: string): Array<number> {
    const layerElement = Array.from(xmlDoc.getElementsByTagName('Layer'))
      .filter(l => l.getElementsByTagName('ows:Identifier')[0].textContent.replace(/\n/g, '') === layer)[0];
    const lowerCornerText = layerElement
      .getElementsByTagName('ows:WGS84BoundingBox')[0]
      .getElementsByTagName('ows:LowerCorner')[0]
      .textContent;
    const upperCornerText = layerElement
      .getElementsByTagName('ows:WGS84BoundingBox')[0]
      .getElementsByTagName('ows:UpperCorner')[0]
      .textContent;
    const bounds = new Array<number>();
    // west
    bounds.push(parseFloat(lowerCornerText.split(' ')[0]));
    // south
    bounds.push(parseFloat(lowerCornerText.split(' ')[1]));
    // east
    bounds.push(parseFloat(upperCornerText.split(' ')[0]));
    // north
    bounds.push(parseFloat(upperCornerText.split(' ')[1]));
    return bounds;
  }

  public getZoomMinMax(xmlDoc: Document): Array<number> {
    const numberOfTileMatrixSetTag = xmlDoc.getElementsByTagName('TileMatrixSet').length;
    const numberOfTileMatrixTag = xmlDoc
      .getElementsByTagName('TileMatrixSet')[numberOfTileMatrixSetTag - 1]
      .getElementsByTagName('TileMatrix').length;
    const maxZoom = xmlDoc
      .getElementsByTagName('TileMatrixSet')[numberOfTileMatrixSetTag - 1]
      .getElementsByTagName('TileMatrix')[numberOfTileMatrixTag - 1].children[0].textContent;
    const minZoom = parseInt(maxZoom, 10) - numberOfTileMatrixTag + 1;
    return [minZoom, parseInt(maxZoom, 10)];
  }

  public buildGetTileUrl(xmlDoc: Document, layer: string, style: string, dimensions?: Object): string {
    let baseURL = this.getKVPBaseUrl(xmlDoc);
    if (baseURL[baseURL.length - 1] === '?') {
      baseURL = baseURL.substring(0, baseURL.length - 1);
    }
    const version = this.getVersion(xmlDoc);
    const tileMatrixSet = this.getTileMatrixSet(xmlDoc);
    const format = this.getFormat(xmlDoc, layer);
    let url = '';
    url = url.concat(baseURL)
      .concat('?')
      .concat('SERVICE=WMTS&')
      .concat('REQUEST=GetTile&')
      .concat('VERSION=').concat(version).concat('&')
      .concat('LAYER=').concat(layer).concat('&')
      .concat('STYLES=').concat(style).concat('&')
      .concat('FORMAT=').concat(format).concat('&')
      .concat('TileMatrixSet=').concat(tileMatrixSet).concat('&')
      .concat('TileMatrix=').concat('{z}').concat('&')
      .concat('TileRow=').concat('{y}').concat('&')
      .concat('TileCol=').concat('{x}');

    if (dimensions) {
      Object
        .keys(dimensions)
        .forEach(e => url = url.concat('&').concat(e).concat('=').concat(dimensions[e]));
    }
    return url;
  }

  public buildGetTileInfo(xmlDoc: Document, layer: string, style: string, md: Object, dimensions?: Object): GetTilesInfo {
    const getTilesInfo = {
      url: this.buildGetTileUrl(xmlDoc, layer, style, dimensions),
      zoomMax: this.getZoomMinMax(xmlDoc)[1],
      zoomMin: this.getZoomMinMax(xmlDoc)[0],
      bbox: this.getBbox(xmlDoc, layer),
      md: md
    };
    return getTilesInfo;
  }

  public getDimensionsFromGroupValues(formGroup: any): Object {
    const dimensions = {};
    Object.keys(formGroup).filter(e => e !== 'style').filter(e => e !== 'layer')
      .forEach(e => dimensions[e] = formGroup[e]);
    if (dimensions['time']) {
      dimensions['time'] = moment(dimensions['time']).format(this.dateFormat);
    }
    return dimensions;
  }
}

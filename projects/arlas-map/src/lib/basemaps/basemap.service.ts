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

import { Injectable } from '@angular/core';
import { ArlasBasemaps } from './basemaps.model';
import { BasemapStyle } from './basemap.config';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AbstractArlasMapGL } from '../map/AbstractArlasMapGL';

@Injectable({
  providedIn: 'root'
})
export abstract class BasemapService {

  protected POWERED_BY_ARLAS = ' Powered by ARLAS.';
  public basemaps: ArlasBasemaps;

  protected protomapBasemapAddedSource = new Subject<boolean>();
  public protomapBasemapAdded$ = this.protomapBasemapAddedSource.asObservable();

  protected constructor(protected http: HttpClient) { }

  public setBasemaps(basemaps: ArlasBasemaps) {
    this.basemaps = basemaps;
  }

  public addProtomapBasemap(map: AbstractArlasMapGL) { };

  protected addPMtilesToSource(map: AbstractArlasMapGL, pmtilesSource: any) {
    /* eslint-disable max-len */
    pmtilesSource['attribution'] = '<a href="https://protomaps.com/" target="_blank">Protomaps</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>';
    pmtilesSource['attribution'] = pmtilesSource['attribution'] + this.POWERED_BY_ARLAS;
    map.addSource('arlas_protomaps_source', pmtilesSource as any);
  }

  protected addProtomapLayerToMap(map: AbstractArlasMapGL, styleFile: any) {
    styleFile.layers.forEach(l => {
      if (!!map.getLayer(l.id)) {
        map.removeLayer(l.id);
      }
      map.addLayer(l as any);
    });
  }

  public notifyProtomapAddition() {
    this.protomapBasemapAddedSource.next(true);
  }

  public removeProtomapBasemap(map: AbstractArlasMapGL) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      (selectedBasemap.styleFile as any).layers.forEach(l => {
        if (!!map.getLayer(l.id)) {
          map.removeLayer(l.id);
        }
      });
      map.removeSource('arlas_protomaps_source');
    }
  }

  public abstract declareProtomapProtocol(map: AbstractArlasMapGL): void;
  public cloneStyleFile<T>(selected: any) {
    return Object.assign({}, selected.styleFile as T);
  }

  public buildInitStyle<StyleType, LayerSpec>(clonedStyleFile: StyleType) {
    (<any>clonedStyleFile).sources = {
      protomaps_attribution: {
        'type': 'vector',
        // eslint-disable-next-line max-len
        'attribution': '<a href="https://protomaps.com/" target="_blank">Protomaps</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>' + this.POWERED_BY_ARLAS
      }
    };
    (<any>clonedStyleFile).layers = [{
      id: 'backgrounds',
      type: 'background',
      source: 'protomaps_attribution',
      paint: {
        'background-color': 'rgba(0,0,0,0)'
      }
    } as unknown as LayerSpec];
    return clonedStyleFile;
  };
  public abstract getInitStyle(selected: BasemapStyle): any;
  public abstract fetchSources$(): Observable<readonly any[]>;
  protected abstract getStyleFile(b: BasemapStyle): Observable<any>;
}

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
import * as pmtiles from 'pmtiles';
import { MapLibreBasemapStyle } from './basemap.config';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import maplibre, { GetResourceResponse, RequestParameters, VectorSourceSpecification } from 'maplibre-gl';
import { BackgroundLayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { BasemapService } from 'arlas-map';
import { ArlasMaplibreGL } from '../map/ArlasMaplibreGL';

@Injectable({
  providedIn: 'root'
})
export class MapLibreBasemapService extends BasemapService {


  public constructor(protected http: HttpClient) {
    super(http);
  }


  public addProtomapBasemap(map: ArlasMaplibreGL) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      const styleFile = selectedBasemap.styleFile as any;
      const pmtilesSource = styleFile.sources['arlas_protomaps_source'];
      pmtilesSource['type'] = 'vector';
      if (pmtilesSource) {
        this.addPMtilesToSource(map, pmtilesSource);
        this.addProtomapLayerToMap(map, styleFile);
      }
    }
  }

  public removeProtomapBasemap(map: ArlasMaplibreGL) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      (selectedBasemap.styleFile as maplibre.StyleSpecification).layers.forEach(l => {
        if (!!map.getLayer(l.id)) {
          map.removeLayer(l.id);
        }
      });
      map.removeSource('arlas_protomaps_source');
    }
  }

  public declareProtomapProtocol(map: ArlasMaplibreGL) {
    const protocol = new pmtiles.Protocol();
    maplibre.addProtocol('pmtiles', (requestParameters: RequestParameters, abortController: AbortController) => {
      return new Promise((res, rej) => {
        protocol.tile(requestParameters, (error?: Error | null, data?: any | null, cacheControl?: string | null, expires?: string | null) => {
          if (error) {
            rej(error);
          }
          res({
            cacheControl,
            expires,
            data
          });
        });
      });
    });
  }

  public getInitStyle(selected: MapLibreBasemapStyle) {
    if (selected.type === 'protomap') {
      const clonedStyleFile = this.cloneStyleFile<maplibre.StyleSpecification>(selected);
      return this.buildInitStyle<maplibre.StyleSpecification, BackgroundLayerSpecification>(clonedStyleFile);
    }
    return selected.styleFile;
  }


  public fetchSources$(): Observable<readonly unknown[]> {
    const sources$: Observable<maplibre.StyleSpecification>[] = [];
    this.basemaps.styles().forEach(s => {
      sources$.push(this.getStyleFile(s).pipe(
        tap(sf => {
          Object.keys(sf.sources).forEach(k => {
            const attribution = sf.sources[k]['attribution'];
            if (!!attribution) {
              sf.sources[k]['attribution'] = attribution + this.POWERED_BY_ARLAS;
            } else {
              sf.sources[k]['attribution'] = this.POWERED_BY_ARLAS;
            }
          });
          s.styleFile = sf as maplibre.StyleSpecification;
        }),
        catchError(() => {
          s.errored = true;
          return of();
        })
      ));
    });
    return forkJoin(sources$);
  }

  protected getStyleFile(b: MapLibreBasemapStyle): Observable<maplibre.StyleSpecification> {
    if (typeof b.styleFile === 'string') {
      return this.http.get(b.styleFile) as Observable<maplibre.StyleSpecification>;
    } else {
      return of(b.styleFile);
    }
  }
}

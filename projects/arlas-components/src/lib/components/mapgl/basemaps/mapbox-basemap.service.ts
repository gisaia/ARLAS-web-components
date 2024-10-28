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
import { CustomProtocol } from '../custom-protocol/mapbox-gl-custom-protocol';
import { MapboxBasemapStyle } from './basemap.config';
import mapboxgl from 'mapbox-gl';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ArlasMapboxGL } from '../model/ArlasMapboxGL';
import { AbstractArlasMapGL } from '../model/AbstractArlasMapGL';
import { BasemapService } from './basemap.service';

@Injectable({
  providedIn: 'root'
})
export class MapboxBasemapService extends BasemapService{

  public constructor(protected http: HttpClient) {
    super(http);
  }

  public addProtomapBasemap(map: ArlasMapboxGL) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      const styleFile = selectedBasemap.styleFile as mapboxgl.Style;
      const pmtilesSource = styleFile.sources['arlas_protomaps_source'];
      if (pmtilesSource) {
        // eslint-disable-next-line max-len
        this.addPMtilesToSource(map, pmtilesSource);
        this.addProtomapLayerToMap(map, styleFile);
      }
    } else {
      /** no action needed. The base map has been added already thanks to getInitStyle */
    }
  }

  public notifyProtomapAddition() {
    this.protomapBasemapAddedSource.next(true);
  }

  public removeProtomapBasemap(map: AbstractArlasMapGL) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      (selectedBasemap.styleFile as mapboxgl.Style).layers.forEach(l => {
        if (!!map.getLayer(l.id)) {
          map.removeLayer(l.id);
        }
      });
      map.removeSource('arlas_protomaps_source');
    }
  }

  public declareProtomapProtocol(map: AbstractArlasMapGL) {
    const protocol = new pmtiles.Protocol();
    if (!(mapboxgl as any).Style.getSourceType('pmtiles-type')) {
      /** addSourceType is private */
      (map as any).addSourceType('pmtiles-type', CustomProtocol(mapboxgl).vector, (e) => e && console.error('There was an error', e));
      (mapboxgl as any).addProtocol('pmtiles', protocol.tile);
    }
  }

  public getInitStyle(selected: MapboxBasemapStyle) {
    if (selected.type === 'protomap') {
      /** This is necessaty to make it work for mapbox. */
      const clonedStyleFile: mapboxgl.Style = this.cloneStyleFile<mapboxgl.Style>(selected);
      return this.buildInitStyle<mapboxgl.Style, any>(clonedStyleFile);
    }
    return selected.styleFile as mapboxgl.Style;
  }


  public fetchSources$(): Observable<readonly unknown[]> {
    const sources$: Observable<mapboxgl.Style>[] = [];
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
          s.styleFile = sf as mapboxgl.Style;
        }),
        catchError(() => {
          s.errored = true;
          return of();
        })
      ));
    });
    return forkJoin(sources$);
  }

  protected getStyleFile(b: MapboxBasemapStyle): Observable<mapboxgl.Style> {
    if (typeof b.styleFile === 'string') {
      return this.http.get(b.styleFile) as Observable<mapboxgl.Style>;
    } else {
      return of(b.styleFile);
    }
  }
}

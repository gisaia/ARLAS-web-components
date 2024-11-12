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
import { ArlasBasemaps } from './basemaps';
import * as pmtiles from 'pmtiles';
import { CustomProtocol } from '../custom-protocol/mapbox-gl-custom-protocol';
import { BasemapStyle } from './basemap.config';
import mapboxgl from 'mapbox-gl';
import { Observable, Subject, catchError, forkJoin, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ArlasMapboxGL } from '../model/ArlasMapboxGL';

@Injectable({
  providedIn: 'root'
})
export class MapboxBasemapService {
  private POWERED_BY_ARLAS = ' Powered by ARLAS.';
  public basemaps: ArlasBasemaps;

  private protomapBasemapAddedSource = new Subject<boolean>();
  public protomapBasemapAdded$ = this.protomapBasemapAddedSource.asObservable();

  public constructor(private http: HttpClient) { }

  public setBasemaps(basemaps: ArlasBasemaps) {
    this.basemaps = basemaps;
  }

  public addProtomapBasemap(map: ArlasMapboxGL) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      const styleFile = selectedBasemap.styleFile as mapboxgl.Style;
      const pmtilesSource = styleFile.sources['arlas_protomaps_source'];
      if (pmtilesSource) {
        // eslint-disable-next-line max-len
        pmtilesSource['attribution'] = '<a href="https://protomaps.com/" target="_blank">Protomaps</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>';
        pmtilesSource['attribution'] = pmtilesSource['attribution'] + this.POWERED_BY_ARLAS;
        map.addSource('arlas_protomaps_source', pmtilesSource as any);
        styleFile.layers.forEach(l => {
          if (!!map.getLayer(l.id)) {
            map.removeLayer(l.id);
          }
          map.addLayer(l as any);
        });
      }
    } else {
      /** no action needed. The base map has been added already thanks to getInitStyle */
    }
  }

  public notifyProtomapAddition() {
    this.protomapBasemapAddedSource.next(true);
  }

  public removeProtomapBasemap(map: ArlasMapboxGL) {
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

  public declareProtomapProtocol(map: ArlasMapboxGL) {
    const protocol = new pmtiles.Protocol();
    if (!(mapboxgl as any).Style.getSourceType('pmtiles-type')) {
      /** addSourceType is private */
      (map as any).addSourceType('pmtiles-type', CustomProtocol(mapboxgl).vector, (e) => e && console.error('There was an error', e));
      (mapboxgl as any).addProtocol('pmtiles', protocol.tile);
    }
  }

  public getInitStyle(selected: BasemapStyle) {
    if (selected.type === 'protomap') {
      /** This is necessaty to make it work for mapbox. */
      const clonedStyleFile: mapboxgl.Style = Object.assign({}, selected.styleFile as mapboxgl.Style);
      clonedStyleFile.sources = {
        protomaps_attribution: {
          'type': 'vector',
          // eslint-disable-next-line max-len
          'attribution': '<a href="https://protomaps.com/" target="_blank">Protomaps</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>' + this.POWERED_BY_ARLAS
        }
      };
      clonedStyleFile.layers = [{
        id: 'backgrounds',
        type: 'background',
        source: 'protomaps_attribution',
        paint: {
          'background-color': 'rgba(0,0,0,0)'
        }
      }];
      return clonedStyleFile;
    }
    return selected.styleFile;
  }


  public fetchSources$() {
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

  private getStyleFile(b: BasemapStyle): Observable<mapboxgl.Style> {
    if (typeof b.styleFile === 'string') {
      return this.http.get(b.styleFile) as Observable<mapboxgl.Style>;
    } else {
      return of(b.styleFile);
    }
  }
}

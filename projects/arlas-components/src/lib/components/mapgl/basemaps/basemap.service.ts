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

import {Injectable} from '@angular/core';
import {ArlasBasemaps} from './basemaps';
import * as pmtiles from 'pmtiles';
import {BasemapStyle} from './basemap.config';
import * as maplibregl from 'maplibre-gl';
import {catchError, forkJoin, Observable, of, Subject, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import mapboxgl from "mapbox-gl";

@Injectable({
  providedIn: 'root'
})
export class MapboxBasemapService {
  public basemaps: ArlasBasemaps;

  private protomapBasemapAddedSource = new Subject<boolean>();
  public protomapBasemapAdded$ = this.protomapBasemapAddedSource.asObservable();

  public constructor(private http: HttpClient) { }

  public setBasemaps(basemaps: ArlasBasemaps) {
    this.basemaps = basemaps;
  }

  public addProtomapBasemap(map: maplibregl.Map | mapboxgl.Map) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      const styleFile = selectedBasemap.styleFile as maplibregl.StyleSpecification;
      const pmtilesSource = styleFile.sources['arlas_protomaps_source'];
      if (pmtilesSource) {
        // eslint-disable-next-line max-len
        pmtilesSource['attribution'] = '<a href="https://protomaps.com/" target="_blank">Protomaps</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>';
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

  public removeProtomapBasemap(map: any) {
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

  public declareProtomapProtocol(map: any) {
    const protocol = new pmtiles.Protocol();
    // TODO: we have to find the good implementation
    if(!map.getSource('pmtiles-type')) {
      // TODO: Maplibregl is undefied  Cannot read properties of undefined (reading 'addProtocol')
      // MapLibreGL.addProtocol('pmtiles', protocol.tile);
    }
    // TODO: do not wrok because this methode do not exist on map libre its  a mapbox implementation
   // if (!(maplibregl as any).Style.getSourceType('pmtiles-type')) {
      /** addSourceType is private */
    //  (map as any).addSourceType('pmtiles-type', CustomProtocol(maplibregl).vector, (e) => e && console.error('There was an error', e));
     // (maplibregl as any).addProtocol('pmtiles', protocol.tile);
    //}
  }

  public getInitStyle(selected: BasemapStyle) {
    if (selected.type === 'protomap') {
      /** This is necessaty to make it work for mapbox. */
      const clonedStyleFile: any = Object.assign({}, selected.styleFile as any);
      clonedStyleFile.sources = {
        protomaps_attribution: {
          'type': 'vector',
          // eslint-disable-next-line max-len
          'attribution': '<a href="https://protomaps.com/" target="_blank">Protomaps</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>'
        }
      };
      clonedStyleFile.layers = [{
        id: 'backgrounds',
        type: 'background',
        source: 'protomaps_attribution',
        paint: {
          'background-color': 'rgba(0,0,0,0)'
        }
      } as any];
      return clonedStyleFile;
    }
    return selected.styleFile;
  }


  public fetchSources$<T>() {
    const sources$: Observable<T>[] = [];
    this.basemaps.styles().forEach(s => {
      sources$.push(this.getStyleFile<T>(s).pipe(
        tap(sf => (s as any).styleFile = sf ),
        catchError(() => {
          s.errored = true;
          return of();
        })
      ));
    });
    return forkJoin(sources$);
  }

  private getStyleFile<T>(b: BasemapStyle): Observable<T> {
    if (typeof b.styleFile === 'string') {
      return this.http.get(b.styleFile) as Observable<T>;
    } else {
      return of(b.styleFile as unknown as T);
    }
  }
}

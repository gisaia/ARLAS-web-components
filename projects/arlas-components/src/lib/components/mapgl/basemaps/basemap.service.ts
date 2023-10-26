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
import { OfflineBasemapTheme } from './basemap.config';
import mapboxgl from 'mapbox-gl';
import { OfflineBasemap } from './offline-basemap';
import { Subject } from 'rxjs';
import { OnlineBasemap } from './online-basemap';

@Injectable({
  providedIn: 'root'
})
export class MapboxBasemapService {
  private basemaps: ArlasBasemaps;
  private LOCAL_STORAGE_BASEMAPS = 'arlas_last_base_map';

  public onlineBasemaps: OnlineBasemap;
  public offlineBasemaps: OfflineBasemap;

  private offlineBasemapChangedSource = new Subject<boolean>();
  public offlineBasemapChanged$ = this.offlineBasemapChangedSource.asObservable();

  public setBasemaps(basemaps: ArlasBasemaps) {
    this.basemaps = basemaps;
    this.onlineBasemaps = basemaps.onlineBasemaps;
    this.offlineBasemaps = basemaps.offlineBasemaps;
  }

  /** Add offline basemap only if configured. */
  public addOfflineBasemap(map: mapboxgl.Map) {
    if (!!this.basemaps && this.basemaps.isOnline) {
      return;
    }
    const protocol = new pmtiles.Protocol();
    /** addSourceType is private */
    (map as any).addSourceType('pmtiles-type', CustomProtocol(mapboxgl).vector, (e) => e && console.error('There was an error', e));
    (mapboxgl as any).addProtocol('pmtiles', protocol.tile);
    const pmtilesUrl = this.offlineBasemaps.getUrl();
    map.addSource('protomaps_source', {
      'type': 'pmtiles-type',
      'tiles': ['pmtiles://' + pmtilesUrl + '/{z}/{x}/{y}'],
      'maxzoom': 21
    } as any);

    if (this.offlineBasemaps && !!this.offlineBasemaps.getSelected()) {
      this.offlineBasemaps.getSelected().layers.forEach(l =>{
        map.addLayer(l as any);
      });
    }
  }

  public changeOfflineBasemap(map: mapboxgl.Map, newTheme: OfflineBasemapTheme) {
    const currentTheme = this.offlineBasemaps.getSelected();
    currentTheme.layers.forEach(l => {
      if (!!map.getLayer(l.id)) {
        map.removeLayer(l.id);
      }
    });
    this.offlineBasemaps.setSelected(newTheme).getSelected().layers.forEach(l =>{
      map.addLayer(l as any);
    });
    this.offlineBasemapChangedSource.next(true);
  }

  public isOnline(): boolean {
    if (!this.basemaps) {
      throw new Error('No basemap configuration is set');
    }
    return !!this.basemaps && this.basemaps.isOnline;
  }

  public getInitStyle() {
    if (this.basemaps.isOnline) {
      const initStyle = this.onlineBasemaps.getSelected();
      return initStyle.styleFile;
    } else {
      return {
        version: 8,
        name: 'Empty',
        metadata: {
          'mapbox:autocomposite': true
        },
        glyphs: this.offlineBasemaps.getGlyphs(),
        sources: {},
        layers: [
          {
            id: 'backgrounds',
            type: 'background',
            paint: {
              'background-color': 'rgba(0,0,0,0)'
            }
          }
        ]
      } as mapboxgl.Style;
    }
  }
}

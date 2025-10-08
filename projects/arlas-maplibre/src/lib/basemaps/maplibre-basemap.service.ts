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

import { inject, Injectable } from '@angular/core';
import { BackgroundLayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { ArlasMapSource, BasemapService, BasemapStyle } from 'arlas-map';
import maplibre, { AddLayerObject, GeoJSONSource, MapOptions, RequestParameters } from 'maplibre-gl';
import * as pmtiles from 'pmtiles';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { ArlasMapService } from '../arlas-map.service';
import { ArlasMaplibreGL } from '../map/ArlasMaplibreGL';
import { ArlasLayerSpecification } from '../map/model/layers';
import { MaplibreSourceType } from '../map/model/sources';
import { MapLibreBasemapStyle } from './basemap.config';

@Injectable({
  providedIn: 'root'
})
export class MaplibreBasemapService extends BasemapService<ArlasLayerSpecification, MaplibreSourceType | GeoJSONSource, MapOptions> {
  private readonly mapService = inject(ArlasMapService);

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
        this.mapFrameworkService.removeLayer(map, l.id);
      });
      this.mapFrameworkService.removeSource(map, 'arlas_protomaps_source');
    }
  }

  public declareProtomapProtocol(map: ArlasMaplibreGL) {
    const protocol = new pmtiles.Protocol();
    maplibre.addProtocol('pmtiles', (requestParameters: RequestParameters, abortController: AbortController) =>
      new Promise((res, rej) => {
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
      })
    );
  }

  public getInitStyle(selected: MapLibreBasemapStyle) {
    if (selected.type === 'protomap') {
      const clonedStyleFile = this.cloneStyleFile<maplibre.StyleSpecification>(selected);
      return this.buildInitStyle<maplibre.StyleSpecification, BackgroundLayerSpecification>(clonedStyleFile);
    }
    return selected.styleFile;
  }


  public fetchSources$(): Observable<readonly maplibre.StyleSpecification[]> {
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

  public setBasemap(s: any, newBasemap: BasemapStyle, map: ArlasMaplibreGL, mapSources: Array<ArlasMapSource<any>>) {
    const selectedBasemapLayersSet = new Set<string>();
    const layers = this.mapFrameworkService.getAllLayers(map);
    const sources = this.mapFrameworkService.getAllSources(map);
    if (s.layers) {
      s.layers.forEach(l => selectedBasemapLayersSet.add(l.id));
    }
    const layersToSave = new Array<AddLayerObject>();
    const sourcesToSave = new Array<ArlasMapSource<MaplibreSourceType>>();
    layers.filter((l: any) => !selectedBasemapLayersSet.has(l.id) && !!l.source).forEach(l => {
      layersToSave.push(l as AddLayerObject);
      if (sourcesToSave.filter(ms => ms.id === l.source.toString()).length === 0) {
        sourcesToSave.push({ id: l.source.toString(), source: sources[l.source.toString()] as MaplibreSourceType });
      }
    });
    const sourcesToSaveSet = new Set<string>();
    sourcesToSave.forEach(mapSource => sourcesToSaveSet.add(mapSource.id));
    if (mapSources) {
      mapSources.forEach(mapSource => {
        if (!sourcesToSaveSet.has(mapSource.id)) {
          sourcesToSave.push(mapSource);
        }
      });
    }
    const initStyle = this.getInitStyle(newBasemap);
    map.getMapProvider().setStyle(initStyle).once('styledata', () => {
      setTimeout(() => {
        /** the timeout fixes a mapboxgl bug related to layer placement*/
        this.mapService.declareBasemapSources(sourcesToSave, map);
        layersToSave.forEach((l: ArlasLayerSpecification) => {
          this.mapFrameworkService.addLayer(map, l);
        });
        localStorage.setItem(this.LOCAL_STORAGE_BASEMAPS, JSON.stringify(newBasemap));
        this.basemaps.setSelected(newBasemap);
        if (newBasemap.type === 'protomap') {
          this.addProtomapBasemap(map);
          this.notifyProtomapAddition();
        }
        this.basemapChangedSource.next();
      }, 0);
    });
  }
}

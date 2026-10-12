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
import { AbstractArlasMapGL, ArlasMapSource, BasemapService, BasemapStyle } from 'arlas-map';
import mapboxgl, { GeoJSONSource, MapboxOptions, VectorSource } from 'mapbox-gl';
import { Protocol } from 'pmtiles';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { ArlasMapService } from '../arlas-map.service';
import { ArlasMapboxGL } from '../map/ArlasMapboxGL';
import { ArlasAnyLayer } from '../map/model/layers';
import { MapboxSourceType } from '../map/model/sources';
import { CustomProtocol } from '../map/protocols/mapbox-gl-custom-protocol';
import { MapboxBasemapStyle } from './basemap.config';

@Injectable()
export class MapboxBasemapService extends BasemapService<ArlasAnyLayer, MapboxSourceType | GeoJSONSource, MapboxOptions> {
  private readonly mapService = inject(ArlasMapService);

  public addProtomapBasemap(map: ArlasMapboxGL) {
    const selectedBasemap = this.basemaps?.getSelected();
    if (selectedBasemap?.type === 'protomap') {
      const styleFile = selectedBasemap.styleFile as mapboxgl.Style;
      const pmtilesSource = styleFile.sources?.['arlas_protomaps_source'];
      if (pmtilesSource) {
        this.addPMtilesToSource(map as AbstractArlasMapGL, pmtilesSource);
        this.addProtomapLayerToMap(map, styleFile);
      }
    } else {
      /** no action needed. The base map has been added already thanks to getInitStyle */
    }
  }

  public removeProtomapBasemap(map: ArlasMapboxGL) {
    const selectedBasemap = this.basemaps?.getSelected();
    if (selectedBasemap?.type === 'protomap') {
      (selectedBasemap.styleFile as mapboxgl.Style).layers?.forEach(l => {
        this.mapFrameworkService.removeLayer(map, l.id, false);
      });
      this.mapFrameworkService.removeSource(map, 'arlas_protomaps_source');
    }
  }

  public declareProtomapProtocol(map: ArlasMapboxGL) {
    const protocol = new Protocol();
    if (!(mapboxgl as any).Style.getSourceType('pmtiles-type')) {
      /** addSourceType is private readonly */
      (map as any).addSourceType('pmtiles-type', CustomProtocol(mapboxgl).vector, (e: any) => e && console.error('There was an error', e));
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


  public fetchSources$(): Observable<readonly mapboxgl.Style[]> {
    const sources$: Observable<mapboxgl.Style>[] = [];
    this.basemaps?.styles().forEach(s => {
      sources$.push(this.getStyleFile(s).pipe(
        tap(sf => {
          if (sf.sources) {
            for (const k of Object.keys(sf.sources)) {
              const attribution = (sf.sources[k] as VectorSource)['attribution'];
              if (attribution) {
                (sf.sources[k] as VectorSource)['attribution'] = attribution + this.POWERED_BY_ARLAS;
              } else {
                (sf.sources[k] as VectorSource)['attribution'] = this.POWERED_BY_ARLAS;
              }
            }
          }
          s.styleFile = sf;
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

  public setBasemap(s: any, newBasemap: BasemapStyle, map: ArlasMapboxGL, mapSources: Array<ArlasMapSource<MapboxSourceType>>) {
    const selectedBasemapLayersSet = new Set<string>();
    const layers: Array<ArlasAnyLayer> = this.mapFrameworkService.getAllLayers(map);
    const sources = this.mapFrameworkService.getAllSources(map);
    if (s.layers) {
      s.layers.forEach((l: any) => selectedBasemapLayersSet.add(l.id));
    }
    const layersToSave = new Array<ArlasAnyLayer>();
    const sourcesToSave = new Array<ArlasMapSource<MapboxSourceType>>();
    layers.filter((l: any) => !selectedBasemapLayersSet.has(l.id)).forEach(l => {
      const layerSource = l.source;
      if (layerSource) {
        layersToSave.push(l);
        if (sourcesToSave.filter(ms => ms.id === layerSource.toString()).length === 0) {
          sourcesToSave.push({ id: layerSource.toString(), source: sources[layerSource.toString()] });
        }
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
        layersToSave.forEach(l => {
          this.mapFrameworkService.addLayer(map, l);
        });
        localStorage.setItem(this.LOCAL_STORAGE_BASEMAPS, JSON.stringify(newBasemap));
        this.basemaps?.setSelected(newBasemap);
        if (newBasemap.type === 'protomap') {
          this.addProtomapBasemap(map);
          this.notifyProtomapAddition();
        }
        this.basemapChangedSource.next(newBasemap);
      }, 0);
    });
  }
}

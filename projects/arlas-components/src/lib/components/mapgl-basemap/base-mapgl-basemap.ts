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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import mapboxgl, { AnyLayer } from 'mapbox-gl';
import { MapSource } from '../mapgl/model/mapSource';
import { MapglService } from '../../services/mapgl.service';
import { BasemapStyle } from '../mapgl/basemaps/basemap.config';
import { ArlasBasemaps } from '../mapgl/basemaps/basemaps';
import { AbstractArlasMapGL } from '../mapgl/model/map/AbstractArlasMapGL';
import { BasemapService } from '../mapgl/basemaps/basemap.service';

@Component({
  selector: 'arlas-base-mapgl-basemap',
  template: '',
})
export class BaseMapglBasemapComponent implements OnInit {
  protected LOCAL_STORAGE_BASEMAPS = 'arlas_last_base_map';

  @Input() public map: AbstractArlasMapGL;
  @Input() public mapSources: Array<MapSource>;

  @Output() public basemapChanged = new EventEmitter<void>();
  @Output() public blur = new Subject<void>();

  public showList = false;
  public basemaps: ArlasBasemaps;


  public constructor(protected mapglService: MapglService, protected basemapService: BasemapService) { }

  public ngOnInit(): void {
    this.initBasemaps();
  }

  protected initBasemaps() {
    this.basemaps = this.basemapService.basemaps;
    if (!!this.basemaps) {
      const styles = this.basemaps.styles();
      if (!!styles) {
        this.showList = styles.length > 0;
        styles.filter(bm => !bm.image).forEach(bm => {
          if (bm.type !== 'protomap' && !!bm.url) {
            const splitUrl = bm.url.split('/style.json?key=');
            if (splitUrl.length === 2) {
              bm.image = `${splitUrl[0]}/0/0/0.png?key=${splitUrl[1]}`;
            }
          }
        });
      }
    }
  }

  /** Removes the old basemap and set the new one that is given as a parameter
   * @param newBasemap: Basemap selected by the user
   */
  public onChangeBasemap(newBasemap: BasemapStyle) {
    const selectedBasemap = this.basemaps.getSelected();
    if (selectedBasemap.type === 'protomap') {
      this.basemapService.removeProtomapBasemap(this.map);
    }
    this.setBaseMapStyle(newBasemap);
  }

  public setBaseMapStyle(newBasemap: BasemapStyle) {
    if (this.map) {
      this.setStyle(this.basemaps.getSelected().styleFile as any, newBasemap);
    }
  }

    // TODO: s to any try to find a good type or interface for all layer
  /**  Set mapbox new style.
   * !!NOTE: mapbox setStyle removes all added layers from the map; thus the following description :
   * This method saves all the currently added layers to the map, applies the 'map.setStyle' and adds all the saved layers afterwards.
   */
  public setStyle(s: any, newBasemap: BasemapStyle) {
    const selectedBasemapLayersSet = new Set<string>();
    // TODO: Array to any try to find a good type or interface for all layer
    const layers: Array<any> = this.map.getStyle().layers;
    const sources = this.map.getStyle().sources;
    if (s.layers) {
      s.layers.forEach(l => selectedBasemapLayersSet.add(l.id));
    }
    // TODO: Array to any try to find a good type or interface for all layer
    const layersToSave = new Array<any>();
    const sourcesToSave = new Array<MapSource>();
    layers.filter((l: mapboxgl.Layer) => !selectedBasemapLayersSet.has(l.id) && !!l.source).forEach(l => {
      layersToSave.push(l);
      if (sourcesToSave.filter(ms => ms.id === l.source.toString()).length === 0) {
        sourcesToSave.push({ id: l.source.toString(), source: sources[l.source.toString()] });
      }
    });
    const sourcesToSaveSet = new Set<string>();
    sourcesToSave.forEach(mapSource => sourcesToSaveSet.add(mapSource.id));
    if (this.mapSources) {
      this.mapSources.forEach(mapSource => {
        if (!sourcesToSaveSet.has(mapSource.id)) {
          sourcesToSave.push(mapSource);
        }
      });
    }
    const initStyle = this.basemapService.getInitStyle(newBasemap);
    this.map.setStyle(initStyle).once('styledata', () => {
      setTimeout(() => {
        /** the timeout fixes a mapboxgl bug related to layer placement*/
        this.mapglService.addSourcesToMap(sourcesToSave, this.map);
        layersToSave.forEach(l => {
          if (!this.map.getLayer(l.id)) {
            this.map.addLayer(l);
          }
        });
        localStorage.setItem(this.LOCAL_STORAGE_BASEMAPS, JSON.stringify(newBasemap));
        this.basemaps.setSelected(newBasemap);
        if (newBasemap.type === 'protomap') {
          this.basemapService.addProtomapBasemap(this.map);
          this.basemapService.notifyProtomapAddition();
        }
        this.basemapChanged.emit();
      }, 0);
    });
  }
}

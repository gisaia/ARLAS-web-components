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

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { AbstractArlasMapGL } from '../map/AbstractArlasMapGL';
import { ArlasMapSource } from '../map/model/sources';
import { ArlasBasemaps } from './basemaps.model';
import { BasemapService } from './basemap.service';
import { BasemapStyle } from './basemap.config';
import { ArlasMapFrameworkService } from '../arlas-map-framework.service';
import { AbstractArlasMapService } from '../arlas-map.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'arlas-basemap',
  templateUrl: './basemap.component.html',
  styleUrls: ['./basemap.component.scss']
})
/** L: a layer class/interface.
 *  S: a source class/interface.
 *  M: a Map configuration class/interface.
 */
export class BasemapComponent<L, S, M>implements OnInit, OnDestroy {

  private readonly _onDestroy$ = new Subject<boolean>();

  @Input() public map: AbstractArlasMapGL;
  @Input() public mapSources: Array<ArlasMapSource<any>>;

  @Output() public basemapChanged = new EventEmitter<void>();
  @Output() public blur = new Subject<void>();

  public showList = false;
  public basemaps: ArlasBasemaps;

  public constructor(protected basemapService: BasemapService<L, S, M>,
    protected mapService: AbstractArlasMapService<L, S, M>,
    protected mapFrameworkService: ArlasMapFrameworkService<L, S, M>) {

      this.basemapService.basemapChanged$.pipe(takeUntil(this._onDestroy$)).subscribe(() => this.basemapChanged.emit());

     }

  public ngOnInit(): void {
    this.initBasemaps();
  }

  protected initBasemaps() {
    this.basemaps = this.basemapService.basemaps;
    if (this.basemaps) {
      const styles = this.basemaps.styles();
      if (styles) {
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
      this.basemapService.setBasemap(this.basemaps.getSelected().styleFile as any, newBasemap, this.map, this.mapSources);
    }
  }

  public ngOnDestroy() {
    this._onDestroy$.next(true);
    this._onDestroy$.complete();
  }

}

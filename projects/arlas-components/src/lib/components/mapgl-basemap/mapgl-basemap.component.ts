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
import { AbstractArlasMapGL } from '../mapgl/model/AbstractArlasMapGL';
import { BasemapService } from '../mapgl/basemaps/basemap.service';
import { BaseMapglBasemapComponent } from './base-mapgl-basemap';
import { MapboxBasemapService } from '../mapgl/basemaps/mapbox-basemap.service';
import { ArlasMapboxGL, ArlasMapGlConfig } from '../mapgl/model/ArlasMapboxGL';

@Component({
  selector: 'arlas-mapgl-basemap',
  templateUrl: './mapgl-basemap.component.html',
  styleUrls: ['./mapgl-basemap.component.scss']
})
export class MapglBasemapComponent extends BaseMapglBasemapComponent implements OnInit {
  @Input() public map: ArlasMapboxGL;

  public constructor(protected mapglService: MapglService, protected basemapService: MapboxBasemapService) {
    super(mapglService, basemapService);
  }
}

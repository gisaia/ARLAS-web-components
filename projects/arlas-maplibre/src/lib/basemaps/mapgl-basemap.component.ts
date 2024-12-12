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

import { Component, Input, OnInit } from '@angular/core';
import { BasemapComponent } from 'arlas-map';
import { ArlasMaplibreGL } from '../map/ArlasMaplibreGL';
import { MaplibreBasemapService } from './maplibre-basemap.service';
import { ArlasMapSource } from 'arlas-map';
import { MaplibreSourceType } from '../map/model/sources';
import { ArlasMaplibreService } from '../arlas-maplibre.service';
import { MapLogicService } from '../arlas-map-logic.service';

@Component({
  selector: 'arlas-maplibre-basemap',
  templateUrl: './mapgl-basemap.component.html',
  styleUrls: ['./mapgl-basemap.component.scss']
})
export class MaplibreBasemapComponent extends BasemapComponent implements OnInit {
  @Input() public map: ArlasMaplibreGL;
  @Input() public mapSources: Array<ArlasMapSource<MaplibreSourceType>>;
  public constructor(protected basemapService: MaplibreBasemapService,
    protected mapLogicService: MapLogicService,
    protected mapService: ArlasMaplibreService) {
    super(basemapService, mapLogicService, mapService);
  }
}

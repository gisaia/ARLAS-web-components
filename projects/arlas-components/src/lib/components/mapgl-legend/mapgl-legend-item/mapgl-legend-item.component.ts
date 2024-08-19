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

import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Legend, PROPERTY_SELECTOR_SOURCE } from '../../mapgl/mapgl.component.util';
import { Layer } from 'mapbox-gl';

@Component({
  selector: 'arlas-mapgl-legend-item',
  templateUrl: './mapgl-legend-item.component.html',
  styleUrls: ['./mapgl-legend-item.component.scss']
})
export class MapglLegendItemComponent implements OnInit {
  @Input() public legend: Legend;
  @Input() public title: string;
  @Input() public layer: Layer;
  @Input() public colorPalette: string;
  @ViewChild('interpolated_svg', { read: ElementRef, static: false }) public interpolatedElement: ElementRef;

  protected PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;

  public constructor() { }

  public ngOnInit(): void {
  }

}

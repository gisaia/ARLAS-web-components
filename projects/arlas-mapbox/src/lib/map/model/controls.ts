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

import { ControlButton, PitchToggle } from 'arlas-map';

export class MapBoxPitchToggle extends PitchToggle {

  protected _buildClasses() {
    this.btnClasses = ['mapboxgl-ctrl-icon', 'mapboxgl-ctrl-pitch'];
    this.containerClasses = ['mapboxgl-ctrl', 'mapboxgl-ctrl-group', 'mapboxgl-ctrl-group-pitch'];
  }
}

export class MapBoxControlButton extends ControlButton {
  protected _buildClasses() {
    this.btnClasses = ['mapboxgl-ctrl-icon', 'map__controls__icons', 'map__controls__icons--' + this.name];
    this.containerClasses = ['mapboxgl-ctrl', 'mapboxgl-ctrl-group', 'mapboxgl-ctrl-group-' + this.name];
  }
}

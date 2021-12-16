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

import * as MapboxDraw from '@gisaia-team/mapbox-gl-draw';


export class PitchToggle {
  public bearing: number;
  public pitch: number;
  public minpitchzoom: number;
  public map: any;
  public btn: HTMLButtonElement;
  public container: HTMLDivElement;
  public image3D = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzM' +
    'CI+ICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHN0eWxlPSJmb250LXNpemU6IDE0cHg7IGZvbnQtZmFtaWx5OiAnSGVsdmV0aWNhIE5ldWUnLEFya' +
    'WFsLEhlbHZldGljYSxzYW5zLXNlcmlmOyBmb250LXdlaWdodDogYm9sZDsgdGV4dC1hbmNob3I6IG1pZGRsZTsiPjNEPC90ZXh0Pjwvc3ZnPg==)';
  public image2D = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzM' +
    'CI+ICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHN0eWxlPSJmb250LXNpemU6IDE0cHg7IGZvbnQtZmFtaWx5OiAnSGVsdmV0aWNhIE5ldWUnLEFyaWF' +
    'sLEhlbHZldGljYSxzYW5zLXNlcmlmOyBmb250LXdlaWdodDogYm9sZDsgdGV4dC1hbmNob3I6IG1pZGRsZTsiPjJEPC90ZXh0Pjwvc3ZnPg==)';

  constructor(bearing, pitch, minpitchzoom) {
    this.bearing = bearing;
    this.pitch = pitch;
    this.minpitchzoom = minpitchzoom;
  }

  public onAdd(map) {
    this.map = map;
    this.btn = document.createElement('button');
    this.btn.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-pitch';
    this.btn.style.backgroundImage = this.image3D;
    this.btn.type = 'button';
    this.btn['aria-label'] = 'Toggle Pitch';
    this.btn.onclick = () => {
      if (map.getPitch() === 0) {
        const options = { pitch: this.pitch, bearing: this.bearing, minpitchzoom: null };
        if (this.minpitchzoom && map.getZoom() > this.minpitchzoom) {
          options.minpitchzoom = this.minpitchzoom;
        }
        map.easeTo(options);
        this.btn.style.backgroundImage = this.image2D;
      } else {
        map.easeTo({ pitch: 0, bearing: 0 });
        this.btn.style.backgroundImage = this.image3D;
      }
    };
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-group-pitch';
    this.container.appendChild(this.btn);
    return this.container;
  }

  public onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}
export class DrawControl {
  public mapboxDraw: MapboxDraw;
  public enabled: boolean;
  constructor(drawOptions: any, enabled: boolean) {
    this.mapboxDraw = new MapboxDraw(drawOptions).default;
    this.enabled = enabled;
  }

  public onAdd(map) {
    const controlContainer = this.mapboxDraw.onAdd(map);
    if (!this.enabled) {
      controlContainer.className += ' draw-control-disabled';
    }
    return controlContainer;
  }

  public onRemove(map) {
    return this.mapboxDraw.onRemove(map);
  }
}
export class ControlButton {
  public map: any;
  public btn: HTMLButtonElement;
  public container: HTMLDivElement;
  public icon;
  public name;
  private tooltip;
  constructor(name: string, tooltip?: string) {
    this.name = name;
    this.tooltip = tooltip;
  }
  public onAdd(map) {
    this.map = map;
    this.btn = document.createElement('button');
    this.btn.className = 'mapboxgl-ctrl-icon map__controls__icons map__controls__icons--' + this.name;
    this.btn.type = 'button';
    this.btn.id = 'layers_switcher_btn';
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-group-' + this.name;
    this.container.setAttribute('title', this.tooltip);
    this.container.appendChild(this.btn);
    return this.container;
  }
  public onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}

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


/** All the map controls configuration
 * These interfaces are generic.
 */

export type ControlPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface IconConfig {
  path: string;
  recolorable?: boolean;
}

export interface ConfigControls {
  enable: boolean;
  position?: ControlPosition;
  config?: any;
  overrideEvent?: { event: any; fn: (e) => void; };
}

export interface NavigationConfigControls extends ConfigControls {
  config: {
    showCompass: boolean;
    showZoom: boolean;
    visualizePitch: boolean;
  };
}

export interface ControlsOption {
  mapAttribution?: ConfigControls;
  scale?: ConfigControls;
  navigationControl?: NavigationConfigControls;
  globe?: ConfigControls;
}

export interface DrawConfigControl extends ConfigControls {
  name?: string;
}

export interface DrawControlsOption {
  draw: { control: any; position?: ControlPosition; };
  addGeoBox: DrawConfigControl;
  removeAois: DrawConfigControl;
}

export class ControlButton {
  public map: any;
  public btn: HTMLButtonElement;
  public container: HTMLDivElement;
  public icon;
  public name;
  private tooltip;
  public btnClasses: string[] = [];
  public containerClasses: string[] = [];
  public constructor(name: string, tooltip?: string) {
    this.name = name;
    this.tooltip = tooltip;
    this._buildClasses();
  }

  protected _buildClasses() {
    this.btnClasses = [];
    this.containerClasses = [];
  }
  public onAdd(map) {
    this.map = map;
    this.btn = document.createElement('button');
    this.btn.className = this.btnClasses.join(' ');
    this.btn.type = 'button';
    this.btn.id = 'layers_switcher_btn';
    this.container = document.createElement('div');
    this.container.className = this.containerClasses.join(' ');
    this.container.setAttribute('title', this.tooltip);
    this.container.appendChild(this.btn);
    return this.container;
  }
  public onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}

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

import { Component, ViewChild, OnInit } from '@angular/core';
import { WmtsLayerManagerComponent } from '../../../projects/arlas-components/src/public-api';

@Component({
  selector: 'arlas-wmts-layer-manager-demo',
  templateUrl: './wmts-layer-manager-demo.component.html',
  styleUrls: ['./wmts-layer-manager-demo.component.css']
})
export class WmtsLayerManagerDemoComponent implements OnInit {
    @ViewChild('wmtsLayerManager', { static: false }) public wmtsLayerMangerComponent: WmtsLayerManagerComponent;

    public getCapaUrl = '/assets/getCap_1.xml';
    public metadata = new Map<string, string>();
    public constructor() { }

    public ngOnInit(

    ) {
      this.metadata.set('Id', '65b4c9b2-9acc-4cb0-998d-a375df0830d2');
      this.metadata.set('Collection', 'Sentinel S5P');
      this.metadata.set('Date', new Date().toISOString());

    }
}

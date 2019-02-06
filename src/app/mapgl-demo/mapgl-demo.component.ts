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

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'arlas-mapgl-demo',
  templateUrl: './mapgl-demo.component.html',
  styleUrls: ['./mapgl-demo.component.css']
})
export class MapglDemoComponent implements OnInit {
  public geojsondata = {
    'type': 'FeatureCollection',
    'features': []
  };

  public mapLayers = {
    layers: [],
    events: {
      zoomOnClick: [],
      emitOnClick: [],
      onHover: []
    },
    styleGroups: [
      {
        id: 'distribution',
        name: 'Distribution',
        base: [


        ],
        styles: [
          {
            id: 'heat-distrib',
            name: 'Heats',
            layerIds: [
            ],
            isDefault: false,
            geomStrategy: 'centroid'
          },
          {
            id: 'fill',
            name: 'Rectangle',
            layerIds: [
            ],
            isDefault: true,
            geomStrategy: 'geohash'
          }
        ]
      },
      {
        id: 'accuracy',
        name: 'Accuracy',
        base: [


        ],
        styles: [
          {
            id: 'heat-acc',
            name: 'Heats',
            layerIds: [
            ],
            isDefault: false,
            geomStrategy: 'centroid'
          },
          {
            id: 'fill-precision',
            name: 'Rectangle',
            layerIds: [
            ],
            isDefault: true,
            geomStrategy: 'geohash'
          }
        ]
      }
    ]
  };

  constructor(private http: HttpClient) {
  }

  public ngOnInit() {
  }

}

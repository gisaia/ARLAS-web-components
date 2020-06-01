/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the 'License'); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Component, ViewChild, OnInit } from '@angular/core';
import { MapglComponent } from '../../components/mapgl/mapgl.component';
import { MapglImportComponent } from '../../components/mapgl-import/mapgl-import.component';
import { MapglSettingsComponent,
  MapSettingsService,
  GeometrySelectModel,
  OperationSelectModel } from '../../components/mapgl-settings/mapgl-settings.component';

@Component({
  selector: 'arlas-mapgl-demo',
  templateUrl: './mapgl-demo.component.html',
  styleUrls: ['./mapgl-demo.component.css']
})
export class MapglDemoComponent implements OnInit {

  @ViewChild('demoMap', { static: true }) public mapComponent: MapglComponent;
  @ViewChild('demoImportMap', { static: true }) public mapImportComponent: MapglImportComponent;
  @ViewChild('mapSettings', { static: true }) public mapSettings: MapglSettingsComponent;

  public modeChoice = 'all';
  public idToSelect: number;
  public actionDisabled = false;
  public drawEnabled = true;
  public defaultBasemapStyle = {
    name: 'Positron Style',
    styleFile: 'http://demo.arlas.io:82/styles/positron/style.json'
  };
  public basemapStyles = [
    {
      name: 'Positron Style',
      styleFile: 'http://demo.arlas.io:82/styles/positron/style.json'
    },
    {
      'name': 'OSM',
      'styleFile': {
        'version': 8,
        'sources': {
          'raster-tiles': {
            'type': 'raster',
            'tiles': ['http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            'tileSize': 256,
            'attribution': ''
          }
        },
        'layers': [{
          'id': 'simple-tiles',
          'type': 'raster',
          'source': 'raster-tiles',
          'minzoom': 0,
          'maxzoom': 22
        }]
      }
    },
    {
      'name': 'Stamen',
      'styleFile': {
        'version': 8,
        'sources': {
          'raster-tiles': {
            'type': 'raster',
            'tiles': ['https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'],
            'tileSize': 256,
            'attribution': ''
          }
        },
        'layers': [{
          'id': 'simple-tiles',
          'type': 'raster',
          'source': 'raster-tiles',
          'minzoom': 0,
          'maxzoom': 22
        }]
      }
    }
  ];

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
        id: 'point-0',
        name: 'Point 0',
        base: [
        ],
        styles: [
          {
            id: 'heat-distrib',
            name: 'Path',
            layerIds: [
            ],
            isDefault: false,
            geomStrategy: 'centroid'
          },
          {
            id: 'fill',
            name: 'Dot',
            layerIds: [
            ],
            isDefault: true,
            geomStrategy: 'geohash'
          }
        ]
      },
      {
        id: 'point-1',
        name: 'Point 1',
        base: [
        ],
        styles: [
          {
            id: 'heat-distrib',
            name: 'Path',
            layerIds: [
            ],
            isDefault: false,
            geomStrategy: 'centroid'
          },
          {
            id: 'fill',
            name: 'Dot',
            layerIds: [
            ],
            isDefault: true,
            geomStrategy: 'geohash'
          }
        ]
      },
      {
        id: 'point-2',
        name: 'Point 2',
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
        id: 'point-3',
        name: 'Point 3',
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
        base: [],
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

  public drawOptions = {
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true
    },
    userProperties: true,
    styles: [
      {
        'id': 'gl-draw-polygon-fill-inactive',
        'type': 'fill',
        'filter': ['all',
          ['==', 'active', 'false'],
          ['==', '$type', 'Polygon'],
          ['!=', 'mode', 'static']
        ],
        'paint': {
          'fill-color': '#3bb2d0',
          'fill-outline-color': '#3bb2d0',
          'fill-opacity': 0.1
        }
      },
      {
        'id': 'gl-draw-polygon-fill-active',
        'type': 'fill',
        'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': '#fbb03b',
          'fill-outline-color': '#fbb03b',
          'fill-opacity': 0.1
        }
      },
      {
        'id': 'gl-draw-polygon-midpoint',
        'type': 'circle',
        'filter': ['all',
          ['==', '$type', 'Point'],
          ['==', 'meta', 'midpoint']],
        'paint': {
          'circle-radius': 3,
          'circle-color': '#fbb03b'
        }
      },
      {
        'id': 'gl-draw-polygon-stroke-inactive',
        'type': 'line',
        'filter': ['all',
          ['==', 'active', 'false'],
          ['==', '$type', 'Polygon'],
          ['!=', 'mode', 'static']
        ],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': '#3bb2d0',
          'line-width': 2
        }
      },
      {
        'id': 'gl-draw-polygon-stroke-active',
        'type': 'line',
        'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': '#fbb03b',
          'line-dasharray': [0.2, 2],
          'line-width': 2
        }
      },
      {
        'id': 'gl-draw-line-inactive',
        'type': 'line',
        'filter': ['all',
          ['==', 'active', 'false'],
          ['==', '$type', 'LineString'],
          ['!=', 'mode', 'static']
        ],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': '#3bb2d0',
          'line-width': 2
        }
      },
      {
        'id': 'gl-draw-line-active',
        'type': 'line',
        'filter': ['all',
          ['==', '$type', 'LineString'],
          ['==', 'active', 'true']
        ],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': '#fbb03b',
          'line-dasharray': [0.2, 2],
          'line-width': 2
        }
      },
      {
        'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
        'type': 'circle',
        'filter': ['all',
          ['==', 'meta', 'vertex'],
          ['==', '$type', 'Point'],
          ['!=', 'mode', 'static']
        ],
        'paint': {
          'circle-radius': 5,
          'circle-color': '#fff'
        }
      },
      {
        'id': 'gl-draw-polygon-and-line-vertex-inactive',
        'type': 'circle',
        'filter': ['all',
          ['==', 'meta', 'vertex'],
          ['==', '$type', 'Point'],
          ['!=', 'mode', 'static']
        ],
        'paint': {
          'circle-radius': 3,
          'circle-color': '#fbb03b'
        }
      },
      {
        'id': 'gl-draw-point-point-stroke-inactive',
        'type': 'circle',
        'filter': ['all',
          ['==', 'active', 'false'],
          ['==', '$type', 'Point'],
          ['==', 'meta', 'feature'],
          ['!=', 'mode', 'static']
        ],
        'paint': {
          'circle-radius': 5,
          'circle-opacity': 1,
          'circle-color': '#fff'
        }
      },
      {
        'id': 'gl-draw-point-inactive',
        'type': 'circle',
        'filter': ['all',
          ['==', 'active', 'false'],
          ['==', '$type', 'Point'],
          ['==', 'meta', 'feature'],
          ['!=', 'mode', 'static']
        ],
        'paint': {
          'circle-radius': 3,
          'circle-color': '#3bb2d0'
        }
      },
      {
        'id': 'gl-draw-point-stroke-active',
        'type': 'circle',
        'filter': ['all',
          ['==', '$type', 'Point'],
          ['==', 'active', 'true'],
          ['!=', 'meta', 'midpoint']
        ],
        'paint': {
          'circle-radius': 7,
          'circle-color': '#fff'
        }
      },
      {
        'id': 'gl-draw-point-active',
        'type': 'circle',
        'filter': ['all',
          ['==', '$type', 'Point'],
          ['!=', 'meta', 'midpoint'],
          ['==', 'active', 'true']],
        'paint': {
          'circle-radius': 5,
          'circle-color': '#fbb03b'
        }
      },
      {
        'id': 'gl-draw-polygon-fill-static',
        'type': 'fill',
        'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': '#404040',
          'fill-outline-color': '#404040',
          'fill-opacity': 0.1
        }
      },
      {
        'id': 'gl-draw-polygon-stroke-static',
        'type': 'line',
        'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': '#404040',
          'line-width': 2
        }
      },
      {
        'id': 'gl-draw-line-static',
        'type': 'line',
        'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
        'layout': {
          'line-cap': 'round',
          'line-join': 'round'
        },
        'paint': {
          'line-color': '#404040',
          'line-width': 2
        }
      },
      {
        'id': 'gl-draw-point-static',
        'type': 'circle',
        'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Point']],
        'paint': {
          'circle-radius': 5,
          'circle-color': '#404040'
        }
      }
    ]
  };

  public drawData = {
    'type': 'FeatureCollection',
    'features': []
  };

  constructor() { }

  public ngOnInit(): void {
    this.mapComponent.onPolygonError.subscribe(error => {
      console.log(error);
    });
  }

  public onPolygonError(event) {
    console.log(event);
  }

  public polygonChange(event) {
    console.log(event);
  }

  public getWKT() {
    switch (this.modeChoice) {
      case 'all':
        console.log(this.mapComponent.getAllPolygon('wkt'));
        break;
      case 'selected':
        console.log(this.mapComponent.getSelectedPolygon('wkt'));
        break;
      case 'id':
        console.log(this.mapComponent.getPolygonById(this.idToSelect, 'wkt'));
        break;
    }
  }

  public getGeojson() {
    switch (this.modeChoice) {
      case 'all':
        console.log(JSON.stringify(this.mapComponent.getAllPolygon('geojson')));
        break;
      case 'selected':
        console.log(JSON.stringify(this.mapComponent.getSelectedPolygon('geojson')));
        break;
      case 'id':
        console.log(JSON.stringify(this.mapComponent.getPolygonById(this.idToSelect, 'geojson')));
        break;
    }
  }

  public switchToDrawMode() {
    this.mapComponent.switchToDrawMode();
  }

  public delete() {
    this.mapComponent.deleteSelectedItem();
  }

  public polygonSelect(event) {
    console.log(event);
  }

  public onAoiChanged(event) {
    this.drawData = event;
    console.log(event);
  }

  public transformRequest = (url: string, resourceType: string) => {
    return {
      url: url.replace('http', 'http'),
    };
  }

  public openSettings() {
    this.mapSettings.openDialog(new MapSettings());
  }
}

export class MapSettings implements MapSettingsService {
  public getClusterGeometries(): Array<GeometrySelectModel> {
    const clusterDisplayGeometries = new Array<GeometrySelectModel>();
    for (let i = 0; i < 5; i++) {
      clusterDisplayGeometries.push({
        path: 'point-' + i,
        selected: i === 1
      });
    }
    return clusterDisplayGeometries;
  }

  public getAllGeometries(): Array<GeometrySelectModel> {
    const allDisplayGeometries = new Array<GeometrySelectModel>();
    for (let i = 0; i < 8; i++) {
      if (i < 5) {
        allDisplayGeometries.push({
          path: 'point-' + i,
          selected: i === 1
        });
      } else {
        allDisplayGeometries.push({
          path: 'geometry-' + (i - 4),
          selected: i === 5 || i === 7
        });
      }
    }
    return allDisplayGeometries;
  }

  public getFeatureGeometries(): Array<GeometrySelectModel> {
    const featuresGeometries = new Array<GeometrySelectModel>();
    for (let i = 0; i < 8; i = i + 2) {
      if (i < 5) {
        featuresGeometries.push({
          path: 'point-' + i,
          selected: i === 1
        });
      } else {
        featuresGeometries.push({
          path: 'geometry-' + (i - 4),
          selected: i === 5 || i === 7
        });
      }
    }
    return featuresGeometries;
  }

  public getTopologyGeometries(): Array<GeometrySelectModel> {
    const topologyGeometries = new Array<GeometrySelectModel>();
    for (let i = 0; i < 8; i = i + 3) {
      if (i < 5) {
        topologyGeometries.push({
          path: 'point-' + i,
          selected: i === 1
        });
      } else {
        topologyGeometries.push({
          path: 'geometry-' + (i - 4),
          selected: i === 5 || i === 7
        });
      }
    }
    return topologyGeometries;
  }

  public getFilterGeometries(): Array<GeometrySelectModel> {
    const filterGeometries = new Array<GeometrySelectModel>();
    for (let i = 0; i < 8; i++) {
      if (i < 5) {
        filterGeometries.push({
          path: 'point-' + i,
          selected: i === 3
        });
      } else {
        filterGeometries.push({
          path: 'geometry-' + (i - 4),
          selected: false
        });
      }
    }
    return filterGeometries;
  }
  public getOperations(): Array<OperationSelectModel> {
    return [
      {
        operation: 'within',
        selected: true
      },
      {
        operation: 'notwithin',
        selected: false
      },
      {
        operation: 'intersects',
        selected: false
      },
      {
        operation: 'notintersects',
        selected: false
      }
    ];
  }

  public hasFeaturesMode(): boolean {
    return true;
  }

  public hasTopologyMode(): boolean {
    return true;
  }

  public hasClusterMode(): boolean {
    return false;
  }
}

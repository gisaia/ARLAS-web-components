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
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'arlas-mapgl-demo',
  templateUrl: './mapgl-demo.component.html',
  styleUrls: ['./mapgl-demo.component.css']
})
export class MapglDemoComponent implements OnInit {

  @ViewChild('demoMap') public mapComponent: MapglComponent;
  @ViewChild('demoImportMap') public mapImportComponent: MapglImportComponent;

  public modeChoice = 'all';
  public idToSelect: number;
  public actionDisabled = false;
  public drawEnabled = true;

  public geojsondata = {
    'type': 'FeatureCollection',
    'features': []
  };

  public mapLayers = {
    layers: [
      {
        'id': 'polygon_imported',
        'type': 'fill',
        'source': 'polygon_imported',
        'paint': {
          'fill-color': 'rgba(153, 32, 228, 1)',
          'fill-opacity': 0.4,
          'fill-outline-color': 'rgba(0, 0, 0, 1)'
        },
        'layout': {
          'visibility': 'visible'
        }
      },
      {
        'id': 'geobox',
        'type': 'line',
        'source': 'geobox',
        'layout': {
          'visibility': 'visible'
        },
        'paint': {
          'line-color': '#FC9F28',
          'line-opacity': 1
        }
      },
      {
        'id': 'polygon_label',
        'type': 'symbol',
        'source': 'polygon_label',
        'layout': {
          'text-field': '{arlas_id}',
          'text-font': [
            'Open Sans Bold'
          ],
          'text-size': 14,
          'visibility': 'visible'
        },
        'filter': ['all', ['==', '$type', 'Point']],
      }],
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
          'polygon_label',
          'polygon_imported',
          'geobox'
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
    'features': [{
      'id': '179479e6d5aa9fd3c5c5264ced0d3cef',
      'type': 'Feature',
      'properties': {},
      'geometry': {
        'coordinates': [
          [
            [-4.724834116462489, 48.54429850016129],
            [-4.806692014663952, 48.35426654640426],
            [-4.54747533707436, 48.36333181438215],
            [-4.533832354037941, 48.24535748577782],
            [-4.274615676448377, 48.13621602556799],
            [-4.697548150406732, 48.03596544582163],
            [-4.370116557669178, 47.81655843250948],
            [-4.151828829171819, 47.81655843250948],
            [-3.9744700497665804, 47.88979752124746],
            [-2.8011735091294554, 47.49492070129705],
            [-2.4600989333555106, 47.439583828644174],
            [-2.0917383915257517, 46.84569679361735],
            [-1.696091883623211, 46.43354877377584],
            [-1.1230865963324845, 46.320599789906],
            [-1.2595164266455185, 44.69537398451712],
            [-1.5187331042180006, 43.49021269504226],
            [-1.8052357478633212, 43.361403277431435],
            [0.705073129796773, 42.67313678326295],
            [0.705073129796773, 42.83342175337188],
            [3.2290249905104247, 42.37148554932173],
            [3.1062381432338952, 43.07307172228528],
            [4.074889938427134, 43.529791215593434],
            [5.943978613648625, 43.063104940355714],
            [6.721628646400319, 43.162699826928105],
            [7.567493594317, 43.737152590087476],
            [7.4856356961326185, 43.865160549567406],
            [7.717566407649343, 44.100762280353706],
            [7.6629944755378006, 44.19865368835616],
            [7.362848848856032, 44.13014675026392],
            [6.898987425805501, 44.29638273012122],
            [6.858058476713325, 44.56916014219914],
            [7.035417256118507, 44.74384468147568],
            [7.035417256118507, 44.860008681286814],
            [6.830772510657539, 44.87934660816367],
            [6.639770748215909, 45.08200257345979],
            [7.076346205210683, 45.25513756139026],
            [7.117275154302888, 45.370268523344976],
            [6.9399163748976775, 45.647536145480615],
            [6.803486544584672, 45.81894637227069],
            [7.021774273082059, 45.94241548017018],
            [6.776200578528943, 46.12237682238302],
            [6.880657024056063, 46.28178930860136],
            [6.799168714937736, 46.43363573285819],
            [6.171708734824875, 46.36901199175986],
            [6.082071594823361, 46.42240231976808],
            [6.122815749362076, 46.58506024646428],
            [6.465066647601759, 46.783513585826626],
            [6.485438724881277, 46.967337645930655],
            [7.059931303658715, 47.34138083769511],
            [7.019187149119972, 47.371742452553036],
            [6.876582608183384, 47.35518373742519],
            [7.027335980023622, 47.50677743852583],
            [7.198461429143464, 47.48750794393027],
            [7.169940520960239, 47.45170297723908],
            [7.459224018285283, 47.45721302131932],
            [7.593807522645335, 47.595616734694715],
            [7.519002224559671, 47.68866423594042],
            [7.628333044834335, 47.98992449343831],
            [7.582299015244217, 48.10532816666796],
            [7.8642574464636255, 48.64046220407624],
            [8.222746419470496, 48.96327880554642],
            [7.938646893193038, 49.04481605469658],
            [7.565766264939015, 49.07584275181054],
            [7.411879021548657, 49.184283691788295],
            [7.050835873561141, 49.12234648419451],
            [7.038998393294634, 49.188152196170506],
            [6.8318424887272045, 49.211356871263604],
            [6.825923748586547, 49.157195692160855],
            [6.713467686106668, 49.16880664970549],
            [6.51814926179091, 49.446653322277825],
            [6.245887215765123, 49.50434089222617],
            [6.139349893411065, 49.50434089222617],
            [6.09791871250053, 49.458196272158375],
            [5.99730013027235, 49.454348924222955],
            [5.973625169754172, 49.49665314188391],
            [5.766469265171878, 49.55428183300589],
            [5.476450998768655, 49.50434089222617],
            [4.890495725806517, 49.787939049654796],
            [4.878658245554874, 50.149598299131725],
            [4.807633363985502, 50.16097487051604],
            [4.535371317959687, 49.94435692356615],
            [4.109222028543485, 49.99384710301666],
            [4.198003130505185, 50.27837431017434],
            [4.0038370419678415, 50.357738858403366],
            [3.6546313742468044, 50.31996274127934],
            [3.5954439729291323, 50.49724937329401],
            [3.4829879104492534, 50.531122228757965],
            [3.3646131078286885, 50.50101422418075],
            [3.293588226259317, 50.531122228757965],
            [3.2462383052081236, 50.70761910094393],
            [3.1456197229947236, 50.78252333338392],
            [2.8851951572354437, 50.70761910094393],
            [2.5833394105656566, 50.81619114931112],
            [2.5715019302991493, 51.09953058273956],
            [1.760634532377253, 50.95807683001459],
            [1.606747288972059, 50.868515101588486],
            [1.5120474468844805, 50.206454089480786],
            [1.115491858112307, 49.94435692342668],
            [0.7130175292142837, 49.86048835530033],
            [0.6242364272525833, 49.87574803116647],
            [0.19216839771053174, 49.71145379378362],
            [0.07971233532273914, 49.49665314161982],
            [0.39932430238485495, 49.462043317826016],
            [-0.21030593109531992, 49.288627168714754],
            [-1.0566857698017316, 49.388897794863766],
            [-1.1750605724074603, 49.358067052729155],
            [-1.305272855294504, 49.56963801242031],
            [-1.2283292335844465, 49.68848469596864],
            [-1.4295663980408904, 49.71910774684372],
            [-1.5656974210537271, 49.661673691399045],
            [-1.9444967894186789, 49.72293427106871],
            [-1.8261219867981424, 49.37348484101619],
            [-1.6071286019642343, 49.06033182412784],
            [-1.5893723815719056, 48.81149818561525],
            [-1.3703789967231614, 48.64752671287417],
            [-1.837959467064593, 48.61232039031131],
            [-1.8497969473311286, 48.71396053307035],
            [-2.1871651347855448, 48.59275070765392],
            [-2.3055399374061096, 48.68661604210752],
            [-2.70209552616339, 48.53007676447359],
            [-3.1045698550613565, 48.86603654503034],
            [-3.560312845136309, 48.799803668186314],
            [-3.5899065457951735, 48.69052330745231],
            [-3.8148186707548746, 48.721770516419895],
            [-3.8680873319467253, 48.63188249095228],
            [-3.962787174034247, 48.737386845578214],
            [-4.335667802273321, 48.643616112251266],
            [-4.335667802273321, 48.682708473583176],
            [-4.560579927247943, 48.62797067735502],
            [-4.724834116462489, 48.54429850016129]
          ]
        ],
        'type': 'Polygon'
      }
    }]
  };

  constructor() { }

  public ngOnInit(): void {
    this.mapComponent.onPolygonError.subscribe(error => {
      console.log(error);
    });
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
    console.log(event);
  }

  public transformRequest = (url: string, resourceType: string) => {
    return {
      url: url.replace('http', 'http'),
      headers: { 'seb-header': true }
    };

  }
}

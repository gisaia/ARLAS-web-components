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

import { VisualisationSetConfig } from '../../projects/arlas-map/src/lib/map/model/visualisationsets';

export const defaultBasemapStyle = {
  name: 'Basic',
  styleFile: 'https://api.maptiler.com/maps/basic/style.json?key=xIhbu1RwgdbxfZNmoXn4',
  image: 'https://cloud.maptiler.com/static/img/maps/basic.png'
};
export const basemapStyles = [
  {
    name: 'Basic',
    styleFile: 'https://api.maptiler.com/maps/basic/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://cloud.maptiler.com/static/img/maps/basic.png'
  },
  {
    name: 'Bright',
    styleFile: 'https://api.maptiler.com/maps/bright/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://cloud.maptiler.com/static/img/maps/bright.png'
  },
  {
    name: 'Pastel',
    styleFile: 'https://api.maptiler.com/maps/pastel/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://cloud.maptiler.com/static/img/maps/pastel.png'
  },
  {
    name: 'Satellite Hybrid',
    styleFile: 'https://api.maptiler.com/maps/hybrid/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://cloud.maptiler.com/static/img/maps/hybrid.png'
  },
  {
    name: 'Streets',
    styleFile: 'https://api.maptiler.com/maps/streets/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://cloud.maptiler.com/static/img/maps/streets.png'
  },
  {
    name: 'Topo',
    styleFile: 'https://api.maptiler.com/maps/topo/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://cloud.maptiler.com/static/img/maps/topo.png'
  },
  {
    name: 'Topographique',
    styleFile: 'https://api.maptiler.com/maps/topographique/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://cloud.maptiler.com/static/img/maps/topographique.png'
  },
  {
    name: 'Voyager',
    styleFile: 'https://api.maptiler.com/maps/voyager/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://cloud.maptiler.com/static/img/maps/voyager.png'
  },
  {
    name: 'Positron',
    styleFile: 'https://api.maptiler.com/maps/8bb9093c-9865-452b-8be4-7a397f552b49/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://api.maptiler.com/maps/8bb9093c-9865-452b-8be4-7a397f552b49/0/0/0.png?key=xIhbu1RwgdbxfZNmoXn4'
  },
  {
    name: 'Dark Topo',
    styleFile: 'https://api.maptiler.com/maps/99521f88-ff7f-4c7b-b1dc-05a5a773b1f1/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://api.maptiler.com/maps/99521f88-ff7f-4c7b-b1dc-05a5a773b1f1/0/0/0.png?key=xIhbu1RwgdbxfZNmoXn4'
  },
  {
    name: 'Streets-dark',
    styleFile: 'https://api.maptiler.com/maps/a1e62ee0-aca6-451a-a4b8-42250422a212/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    image: 'https://api.maptiler.com/maps/a1e62ee0-aca6-451a-a4b8-42250422a212/0/0/0.png?key=xIhbu1RwgdbxfZNmoXn4'
  },
  {
    name: 'Streets-light',
    styleFile: 'https://api.maptiler.com/maps/208a41eb-368f-4003-8e3c-2dba0d90b3cb/style.json?key=xIhbu1RwgdbxfZNmoXn4',
    'image': 'https://api.maptiler.com/maps/208a41eb-368f-4003-8e3c-2dba0d90b3cb/0/0/0.png?key=xIhbu1RwgdbxfZNmoXn4'
  }
];

export const geojsondata = {
  'type': 'FeatureCollection',
  'features': []
};

export const mapLayers = {
  layers: [{
    id: 'arlas_id:Latest products:1677155839933',
    type: 'fill',
    source: 'feature-_geometry_wkt-window-demo_eo',
    minzoom: 0,
    maxzoom: 22,
    layout: {
      visibility: 'visible'
    },
    paint: {
      'fill-opacity': 0,
      'fill-color': [
        'match',
        [
          'get',
          'metadata_ObservationContext_processusUsed_platform'
        ],
        'SENTINEL 2',
        '#ff61ec',
        'PLEIADES',
        '#ec4040',
        'SPOT 6',
        '#0087e9',
        'SPOT 5',
        '#0041ff',
        'SPOT 4',
        '#00b4ff',
        'SPOT 7',
        '#1102c6',
        'TerraSAR-X 1',
        '#5e5e5e',
        'ALOS2',
        '#00c926',
        'SENTINEL 2A',
        '#ff0094',
        'DRONE',
        '#ffe300',
        '#9d9ca9'
      ]
    },
    metadata: {
      collection: 'demo_eo',
      'collection-display-name': 'demo_eo',
      stroke: {
        'color': [
          'get',
          'metadata_ObservationContext_processusUsed_platform_arlas__color'
        ],
        'width': 3,
        'opacity': 0.7
      },
      'is-scrollable-layer': true
    },
    filter: [
      'all',
      [
        'all'
      ]
    ]
  },
  {
    id: 'arlas_id:Density of products:1677155972496',
    type: 'circle',
    source: 'cluster-_centroid_wkt-Coarse-tile-centroid-demo_eo',
    minzoom: 0,
    maxzoom: 15,
    layout: {
      'visibility': 'visible'
    },
    paint: {
      'circle-opacity': [
        'interpolate',
        [
          'linear'
        ],
        [
          'get',
          'count_:normalized'
        ],
        0,
        0,
        0.2,
        0.02,
        0.4,
        0.04,
        0.6,
        0.06000000000000001,
        0.8,
        0.08,
        1,
        0.1
      ],
      'circle-color': [
        'interpolate',
        [
          'linear'
        ],
        [
          'get',
          'count_:normalized'
        ],
        0,
        '#fffa83',
        0.45,
        '#ffcc26',
        0.9,
        '#ff7700',
        1,
        '#ff5700'
      ],
      'circle-radius': [
        'interpolate',
        [
          'linear'
        ],
        [
          'get',
          'count_:normalized'
        ],
        0,
        5,
        0.2,
        14,
        0.4,
        23,
        0.6,
        32,
        0.8,
        41,
        1,
        50
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': [
        'interpolate',
        [
          'linear'
        ],
        [
          'get',
          'count_:normalized'
        ],
        0,
        '#fff500',
        0.8,
        '#ffa700',
        1,
        '#ff5418'
      ],
      'circle-stroke-opacity': 1
    },
    metadata: {
      collection: 'demo_eo',
      'collection-display-name': 'demo_eo'
    },
    filter: [
      'all',
      [
        'all'
      ]
    ]
  },
  {
    id: 'arlas_id:Number of products:1677155990578',
    type: 'symbol',
    source: 'cluster-_centroid_wkt-Coarse-tile-centroid-demo_eo',
    minzoom: 0,
    maxzoom: 15,
    layout: {
      visibility: 'visible',
      'text-field': [
        'get',
        'count_:_arlas__short_format'
      ],
      'text-font': [
        'Open Sans Bold',
        'Arial Unicode MS Bold'
      ],
      'text-size': [
        'interpolate',
        [
          'linear'
        ],
        [
          'get',
          'count_:normalized'
        ],
        0,
        8,
        0.2,
        13.2,
        0.4,
        18.4,
        0.6,
        23.6,
        0.8,
        28.8,
        1,
        34
      ],
      'text-rotate': 0,
      'text-allow-overlap': true,
      'text-anchor': 'center',
      'symbol-placement': 'point'
    },
    paint: {
      'text-color': '#ffffff',
      'text-opacity': 1,
      'text-halo-color': '#000',
      'text-halo-width': 1.3,
      'text-halo-blur': 2,
      'text-translate': [
        0,
        0
      ]
    },
    metadata: {
      'collection': 'demo_eo',
      'collection-display-name': 'demo_eo'
    },
    filter: [
      'all',
      [
        'all'
      ]
    ]
  }],
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
} as any;

export const drawOptions = {
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

export const mapDataSources = new Set(['feature-_geometry_wkt-window-demo_eo', 'cluster-_centroid_wkt-Coarse-tile-centroid-demo_eo']);

export const mapSources = [
  {
    'id': 'arlas_id:Latest products:1677155839933',
    'name': 'Latest products',
    'source': 'feature-_geometry_wkt-window-demo_eo',
    'minzoom': 0,
    'maxzoom': 22,
    'include_fields': [
      'metadata.ObservationContext.processusUsed.platform'
    ],
    'short_form_fields': [],
    'colors_from_fields': [
      'metadata.ObservationContext.processusUsed.platform'
    ],
    'provided_fields': [],
    'normalization_fields': [],
    'metrics': [],
    'returned_geometry': '_geometry_wkt',
    'render_mode': 'window'
  },
  {
    'id': 'arlas_id:Density of products:1677155972496',
    'name': 'Density of products',
    'source': 'cluster-_centroid_wkt-Coarse-tile-centroid-demo_eo',
    'minzoom': 0,
    'maxzoom': 15,
    'include_fields': [],
    'short_form_fields': [],
    'colors_from_fields': [],
    'provided_fields': [],
    'normalization_fields': [],
    'metrics': [
      {
        'field': '',
        'metric': 'count',
        'normalize': true
      },
      {
        'field': '',
        'metric': 'count',
        'normalize': true
      },
      {
        'field': '',
        'metric': 'count',
        'normalize': true
      },
      {
        'field': '',
        'metric': 'count',
        'normalize': true
      }
    ],
    'agg_geo_field': '_centroid_wkt',
    'aggType': 'tile',
    'granularity': 'Coarse',
    'minfeatures': 1000,
    'aggregated_geometry': 'centroid'
  },
  {
    'id': 'arlas_id:Number of products:1677155990578',
    'name': 'Number of products',
    'source': 'cluster-_centroid_wkt-Coarse-tile-centroid-demo_eo',
    'minzoom': 0,
    'maxzoom': 15,
    'include_fields': [],
    'short_form_fields': [],
    'colors_from_fields': [],
    'provided_fields': [],
    'normalization_fields': [],
    'metrics': [
      {
        'field': '',
        'metric': 'count',
        'normalize': true
      },
      {
        'field': '',
        'metric': 'count',
        'normalize': false,
        'short_format': true
      }
    ],
    'agg_geo_field': '_centroid_wkt',
    'aggType': 'tile',
    'granularity': 'Coarse',
    'minfeatures': 1000,
    'aggregated_geometry': 'centroid'
  }
];

export const visualisationSets: Array<VisualisationSetConfig> = [{
    'name': 'Latest products',
    'layers': [
      'arlas_id:Latest products:1677155839933'
    ],
    'enabled': true
  },
  {
    'name': 'All products',
    'layers': [
      'arlas_id:Number of products:1677155990578',
      'arlas_id:Density of products:1677155972496'
    ],
    'enabled': true
  }];
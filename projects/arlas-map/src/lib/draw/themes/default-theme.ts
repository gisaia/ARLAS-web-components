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

const roundLineLayout = {
  'line-cap': 'round',
  'line-join': 'round'
};

const staticModeVertex = ['all',
  ['==', 'meta', 'vertex'],
  ['==', '$type', 'Point'],
  ['!=', 'mode', 'static']
];

const deactivatedStaticModeFeature = ['all',
  ['==', 'active', 'false'],
  ['==', '$type', 'Point'],
  ['==', 'meta', 'feature'],
  ['!=', 'mode', 'static']
];
const deactivatedStaticPolygon = ['all',
  ['==', 'active', 'false'],
  ['==', '$type', 'Polygon'],
  ['!=', 'mode', 'static']
];

const activatedMidPoint = ['all',
  ['==', '$type', 'Point'],
  ['==', 'active', 'true'],
  ['!=', 'meta', 'midpoint']
];
const staticLineMidPoint = ['all', ['==', 'meta', 'midpoint'],
  ['==', 'actionType', 'rotation'],
  ['==', '$type', 'LineString'],
  ['!=', 'mode', 'static']
];

const staticPolygon = ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']];
const activePolygon = ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']];
const staticMidpoint = ['all',
  ['==', 'meta', 'midpoint'],
  ['==', 'actionType', 'resize'],
  ['==', '$type', 'Point'],
  ['!=', 'mode', 'static']
];

const rotatePointFilter = ['all',
  ['==', 'meta', 'midpoint'],
  ['==', 'actionType', 'rotation'],
  ['==', '$type', 'Point'],
  ['!=', 'mode', 'static']
];

/** Summarized style of a draw component */
export interface DrawStyle {
  color?: string;
  opacity?: number;
  dash?: number[];
}

export interface DrawTheme {
  /** Style for active drawings */
  active?: DrawStyle;
  /** Style for deactivated drawings */
  inactive?: DrawStyle;
}

function buildLinePaint(color: string, dash: number[]) {
  return {
    'line-color': color,
    'line-dasharray': dash,
    'line-width': 2
  };
}

/**
 * Builds the style for the Mapbox draw layers
 * @param theme Theme summarizing the drawing styles
 */
export function buildDrawStyle(theme: DrawTheme) {
  const activeColor = theme?.active?.color ?? '#fbb03b';
  const activeOpacity = theme?.active?.opacity ?? 0.1;
  const activeDash = theme.active?.dash ?? [0.2, 2];

  const activeLinePaint = buildLinePaint(activeColor, activeDash);

  const inactiveColor = theme?.inactive?.color ?? '#3bb2d0';
  const inactiveOpacity = theme?.inactive?.opacity ?? 0.1;
  const inactiveDash = theme.inactive?.dash ?? [0.2, 2];

  const inactiveLinePaint = buildLinePaint(inactiveColor, inactiveDash);

  return [
    {
      'id': 'gl-draw-polygon-fill-inactive',
      'type': 'fill',
      'filter': deactivatedStaticPolygon,
      'paint': {
        'fill-color': inactiveColor,
        'fill-outline-color': inactiveColor,
        'fill-opacity': inactiveOpacity
      }
    },
    {
      'id': 'gl-draw-polygon-fill-active',
      'type': 'fill',
      'filter': activePolygon,
      'paint': {
        'fill-color': activeColor,
        'fill-outline-color': activeColor,
        'fill-opacity': activeOpacity
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
        'circle-color': activeColor
      }
    },
    {
      'id': 'gl-draw-polygon-stroke-inactive',
      'type': 'line',
      'filter': deactivatedStaticPolygon,
      'layout': roundLineLayout,
      'paint': inactiveLinePaint
    },
    {
      'id': 'gl-draw-polygon-stroke-active',
      'type': 'line',
      'filter': activePolygon,
      'layout': roundLineLayout,
      'paint': activeLinePaint
    },
    {
      'id': 'gl-draw-line-inactive',
      'type': 'line',
      'filter': ['all',
        ['==', 'active', 'false'],
        ['==', '$type', 'LineString'],
        ['!=', 'mode', 'static']
      ],
      'layout': roundLineLayout,
      'paint': inactiveLinePaint
    },
    {
      'id': 'gl-draw-line-active',
      'type': 'line',
      'filter': ['all',
        ['==', '$type', 'LineString'],
        ['==', 'active', 'true']
      ],
      'layout': roundLineLayout,
      'paint': activeLinePaint
    },
    {
      'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
      'type': 'circle',
      'filter': staticModeVertex,
      'paint': {
        'circle-radius': 5,
        'circle-color': '#fff'
      }
    },
    {
      'id': 'gl-draw-polygon-and-line-vertex-inactive',
      'type': 'circle',
      'filter': staticModeVertex,
      'paint': {
        'circle-radius': 3,
        'circle-color': activeColor
      }
    },
    {
      'id': 'gl-draw-point-point-stroke-inactive',
      'type': 'circle',
      'filter': deactivatedStaticModeFeature,
      'paint': {
        'circle-radius': 5,
        'circle-opacity': 1,
        'circle-color': '#fff'
      }
    },
    {
      'id': 'gl-draw-point-inactive',
      'type': 'circle',
      'filter': deactivatedStaticModeFeature,
      'paint': {
        'circle-radius': 3,
        'circle-color': inactiveColor
      }
    },
    {
      'id': 'gl-draw-point-stroke-active',
      'type': 'circle',
      'filter': activatedMidPoint,
      'paint': {
        'circle-radius': 7,
        'circle-color': '#fff'
      }
    },
    {
      'id': 'gl-draw-point-active',
      'type': 'circle',
      'filter': activatedMidPoint,
      'paint': {
        'circle-radius': 5,
        'circle-color': activeColor
      }
    },
    {
      'id': 'gl-draw-polygon-fill-static',
      'type': 'fill',
      'filter': staticPolygon,
      'paint': {
        'fill-color': inactiveColor,
        'fill-outline-color': inactiveColor,
        'fill-opacity': inactiveOpacity
      }
    },
    {
      'id': 'gl-draw-polygon-stroke-static',
      'type': 'line',
      'filter': staticPolygon,
      'layout': roundLineLayout,
      'paint': inactiveLinePaint
    },
    {
      'id': 'gl-draw-line-static',
      'type': 'line',
      'filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
      'layout': roundLineLayout,
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
    },
    {
      'id': 'gl-draw-line-rotate-point',
      'type': 'line',
      'filter': staticLineMidPoint,
      'layout': roundLineLayout,
      'paint': activeLinePaint
    },
    {
      'id': 'gl-draw-polygon-rotate-point-stroke',
      'type': 'circle',
      'filter': rotatePointFilter,
      'paint': {
        'circle-radius': 4,
        'circle-color': '#fff'
      }
    },
    {
      'id': 'gl-draw-polygon-rotate-point',
      'type': 'circle',
      'filter': rotatePointFilter,
      'paint': {
        'circle-radius': 2,
        'circle-color': activeColor
      }
    },
    {
      'id': 'gl-draw-polygon-rotate-point-icon',
      'type': 'symbol',
      'filter': rotatePointFilter,
      'layout': {
        'icon-image': 'rotate',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-rotation-alignment': 'map',
        'icon-rotate': ['get', 'heading']
      },
      'paint': {
        'icon-opacity': 1,
        'icon-opacity-transition': {
          'delay': 0,
          'duration': 0
        }
      }
    },
    {
      'id': 'gl-draw-line-resize-point',
      'type': 'line',
      'filter': staticLineMidPoint,
      'layout': roundLineLayout,
      'paint': activeLinePaint
    },
    {
      'id': 'gl-draw-polygon-resize-point-stroke',
      'type': 'circle',
      'filter': staticMidpoint,
      'paint': {
        'circle-radius': 5,
        'circle-color': '#fff'
      }
    },
    {
      'id': 'gl-draw-polygon-resize-point',
      'type': 'circle',
      'filter': staticMidpoint,
      'paint': {
        'circle-radius': 6,
        'circle-color': activeColor
      }
    },
    {
      'id': 'gl-draw-polygon-resize-point-icon',
      'type': 'symbol',
      'filter': staticMidpoint,
      'layout': {
        'icon-image': 'resize',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-rotation-alignment': 'map',
        'icon-rotate': ['get', 'heading']
      },
      'paint': {
        'icon-opacity': 1,
        'icon-opacity-transition': {
          'delay': 0,
          'duration': 0
        }
      }
    }
  ];
}

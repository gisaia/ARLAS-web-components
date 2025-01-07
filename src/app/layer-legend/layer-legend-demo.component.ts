import { Component } from '@angular/core';

@Component({
  selector: 'arlas-layer-legend',
  templateUrl: './layer-legend-demo.component.html',
  styleUrl: './layer-legend-demo.component.scss'
})
export class LayerLegendDemoComponent {
protected layersLeg = new Map([
  [
    "arlas_id:Tracks:1724158164373#Cluster",
    {
      "layer": {
        "id": "arlas_id:Tracks:1724158164373",
        "type": "circle-heatmap",
        "source": "cluster",
        "minzoom": 0,
        "maxzoom": 23,
        "layout": {
          "visibility": "visible",
          "circle-sort-key": [
            "interpolate",
            [
              "linear"
            ],
            [
              "get",
              "count_:normalized"
            ],
            0,
            0,
            1,
            8
          ]
        },
        "paint": {
          "circle-stroke-opacity": 0,
          "circle-stroke-color": [
            "interpolate",
            [
              "linear"
            ],
            [
              "get",
              "count_:normalized"
            ],
            0,
            "#cee897",
            0.05,
            "#9dc95b",
            0.1,
            "#4bc71e",
            0.15,
            "#1bc473",
            0.2,
            "#16ccc9",
            0.25,
            "#2673cc",
            0.3,
            "#3619cf",
            0.35,
            "#6518d0",
            0.45,
            "#9317d1",
            0.55,
            "#d11799",
            0.75,
            "#cf1919",
            1,
            "#631313"
          ],
          "circle-opacity": 0.7,
          "circle-color": [
            "interpolate",
            [
              "linear"
            ],
            [
              "get",
              "count_:normalized"
            ],
            0,
            "#cee897",
            0.05,
            "#9dc95b",
            0.1,
            "#4bc71e",
            0.15,
            "#1bc473",
            0.2,
            "#16ccc9",
            0.25,
            "#2673cc",
            0.3,
            "#3619cf",
            0.35,
            "#6518d0",
            0.45,
            "#9317d1",
            0.55,
            "#d11799",
            0.75,
            "#cf1919",
            1,
            "#631313"
          ],
          "circle-radius": [
            "interpolate",
            [
              "linear"
            ],
            [
              "zoom"
            ],
            0,
            9,
            23,
            15
          ],
          "circle-blur": 1
        },
        "filter": [
          "all",
          [
            "all"
          ]
        ],
        "metadata": {
          "collection": "courses",
          "collectionDisplayName": "courses",
          "hiddenProps": {
            "geomType": "circle-heatmap"
          }
        }
      },
      "colorLegend": {
        "visible": true,
        "type": "Interpolated",
        "title": "count_:normalized",
        "interpolatedValues": [
          "#cee897",
          "#9dc95b",
          "#4bc71e",
          "#1bc473",
          "#16ccc9",
          "#2673cc",
          "#3619cf",
          "#6518d0",
          "#9317d1",
          "#d11799",
          "#cf1919",
          "#631313"
        ],
        "minValue": "0",
        "maxValue": "1"
      },
      "strokeColorLegend": {
        "visible": true,
        "type": "Interpolated",
        "title": "count_:normalized",
        "interpolatedValues": [
          "#cee897",
          "#9dc95b",
          "#4bc71e",
          "#1bc473",
          "#16ccc9",
          "#2673cc",
          "#3619cf",
          "#6518d0",
          "#9317d1",
          "#d11799",
          "#cf1919",
          "#631313"
        ],
        "minValue": "0",
        "maxValue": "1"
      },
      "aggType": "tile"
    }
  ],
  [
    "arlas_id:Trails:1724158240395#Features",
    {
      "layer": {
        "id": "arlas_id:Trails:1724158240395",
        "type": "line",
        "source": "feature",
        "minzoom": 0,
        "maxzoom": 23,
        "layout": {
          "visibility": "visible",
          "line-cap": "round",
          "line-join": "round"
        },
        "paint": {
          "line-opacity": 1,
          "line-color": "#ff0000",
          "line-width": 2
        },
        "filter": [
          "all",
          [
            "all"
          ]
        ],
        "metadata": {
          "collection": "courses",
          "collectionDisplayName": "courses",
          "isScrollableLayer": false
        }
      },
      "colorLegend": {
        "visible": true,
        "type": "Fix",
        "fixValue": "#ff0000"
      },
      "aggType": null
    }
  ],
  [
    "arlas_id:efze:1736240686332#Cluster",
    {
      "layer": {
        "id": "arlas_id:efze:1736240686332",
        "type": "fill",
        "source": "cluster",
        "minzoom": 0,
        "maxzoom": 23,
        "layout": {
          "visibility": "visible"
        },
        "paint": {
          "fill-opacity": 0.7,
          "fill-color": "#abcdef"
        },
        "filter": null,
        "metadata": {
          "collection": "courses",
          "collectionDisplayName": "courses",
          "stroke": {
            "color": "#fff",
            "width": 0,
            "opacity": 0
          }
        }
      },
      "colorLegend": {
        "visible": true,
        "type": "Fix",
        "fixValue": "#abcdef"
      },
      "strokeColorLegend": {
        "visible": true,
        "type": "Fix",
        "fixValue": "#fff"
      },
      "aggType": "h3"
    }
  ]
])
}

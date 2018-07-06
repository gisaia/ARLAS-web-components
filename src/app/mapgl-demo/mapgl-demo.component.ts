import { Component, OnInit, SimpleChanges, AfterViewInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { MapLayers } from 'components/mapgl/model/mapLayers';
import { Layer } from 'mapbox-gl/dist/mapbox-gl';
import { StyleGroup } from '../../components/mapgl/model/mapLayers';

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
            drawType: 'CIRCLE'
          },
          {
            id: 'fill',
            name: 'Rectangle',
            layerIds: [
            ],
            isDefault: true,
            drawType: 'RECTANGLE'
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
            drawType: 'CIRCLE'
          },
          {
            id: 'fill-precision',
            name: 'Rectangle',
            layerIds: [
            ],
            isDefault: true,
            drawType: 'RECTANGLE'
          }
        ]
      }
    ]
  };

  constructor(private http: Http) {
  }

  public ngOnInit() {
  }

}

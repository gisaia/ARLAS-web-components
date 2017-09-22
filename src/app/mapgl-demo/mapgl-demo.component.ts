import { Component, OnInit, SimpleChanges, AfterViewInit } from '@angular/core';
import { Http, Response } from '@angular/http';

@Component({
  selector: 'arlas-mapgl-demo',
  templateUrl: './mapgl-demo.component.html',
  styleUrls: ['./mapgl-demo.component.css']
})
export class MapglDemoComponent implements OnInit, AfterViewInit {
  public geojsondata = {
    'type': 'FeatureCollection',
    'features': []
  };
  public paintRuleClusterCircle;
  public paintRuleClusterFeatureLine;
  public paintRuleCLusterFeatureFill;
  constructor(private http: Http) {

  }


  public ngOnInit() {


    this.paintRuleCLusterFeatureFill = {
      'fill-color': '#56A7EE',
      'fill-opacity': 0.5
    },
      this.paintRuleClusterFeatureLine = {
        'line-color': '#56A7EE',
        'line-opacity': 1,
        'line-width': 3
      },

      this.paintRuleClusterCircle = {
        'circle-stroke-width': 2,
        'circle-stroke-color': '#D3D3D3',
        'circle-color': {
          'property': 'point_count_normalize',
          'type': 'interval',
          'stops': [
            [
              0,
              '#f7fcf0'
            ],
            [
              20,
              '#e0f3db'
            ],
            [
              30,
              '#ccebc5'
            ],
            [
              40,
              '#a8ddb5'
            ],
            [
              50,
              '#7bccc4'
            ],
            [
              60,
              '#4eb3d3'
            ],
            [
              70,
              '#2b8cbe'
            ],
            [
              90,
              '#3690c0'
            ]
          ]
        },
        'circle-radius': {
          'property': 'point_count_normalize',
          'type': 'interval',
          'stops': [
            [
              0,
              22
            ],
            [
              20,
              24
            ],
            [
              30,
              26
            ],
            [
              40,
              28
            ],
            [
              50,
              30
            ],
            [
              60,
              32
            ],
            [
              70,
              34
            ],
            [
              90,
              36
            ]
          ]
        },
        'circle-opacity': 1
      };
  }
  public ngAfterViewInit() {
    const ret = this.http
      .get('assets/cluster.json')
      .map((res: Response) => {
        return res.json();
      })
      .toPromise()
      .then((data: any) => {
        setTimeout(() => {
          this.geojsondata = data;
          this.geojsondata.features.forEach(f => {
            f.geometry = f.properties.imageExtension.centerPoint.geometry;
          });
        }, 5000);


      });
  }
}

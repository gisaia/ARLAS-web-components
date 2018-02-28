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

  constructor(private http: Http) {}

  public ngOnInit() { }

}

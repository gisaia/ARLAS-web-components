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


import { Component, inject, ViewChild } from '@angular/core';
import { LngLatBounds } from 'maplibre-gl';
import { Subject } from 'rxjs';
import { ArlasMapComponent } from '../../../projects/arlas-map/src/lib/arlas-map.component';
import { MapImportComponent } from '../../../projects/arlas-map/src/lib/map-import/map-import.component';
import {
  GeometrySelectModel, GeoQueryOperator, MapSettingsComponent, MapSettingsService,
  OperationSelectModel
} from '../../../projects/arlas-map/src/lib/map-settings/map-settings.component';
import { ARLAS_VSET } from '../../../projects/arlas-map/src/lib/map/model/layers';
import { VisualisationSetConfig } from '../../../projects/arlas-map/src/lib/map/model/visualisationsets';
import { ArlasMapFrameworkService, OnMoveResult, VectorStyle, VectorStyleEnum } from '../../../projects/arlas-map/src/public-api';
import {
  basemapStyles,
  defaultBasemapStyle,
  drawOptions,
  geojsondata,
  mapDataSources, mapLayers,
  mapSources, visualisationSets
} from '../../tools/map.constants';

@Component({
  selector: 'arlas-mapgl-demo',
  templateUrl: './mapgl-demo.component.html',
  styleUrls: ['./mapgl-demo.component.css']
})
export class MapglDemoComponent<L, S, M> {
  private readonly mapFramework: ArlasMapFrameworkService<L, S, M> = inject(ArlasMapFrameworkService);

  // eslint-disable-next-line max-len
  @ViewChild('demoMap', { static: true }) public mapComponent: ArlasMapComponent<L, S, M>;
  // eslint-disable-next-line max-len
  @ViewChild('demoImportMap', { static: true }) public mapImportComponent: MapImportComponent<L, S, M>;;
  @ViewChild('mapSettings', { static: true }) public mapSettings: MapSettingsComponent;

  public modeChoice = 'all';
  public idToSelect: number;
  public actionDisabled = false;
  public drawEnabled = true;
  public defaultBasemapStyle = defaultBasemapStyle;
  public basemapStyles = basemapStyles;

  public geojsondata = geojsondata;

  public mapLayers = mapLayers;
  public drawOptions = drawOptions;

  public mapDataSources = mapDataSources;
  public mapSources = mapSources;
  public visualisationSets: Array<VisualisationSetConfig> = visualisationSets;

  public visibilityUpdater = new Subject<Map<string, boolean>>();

  /** Whether to update the layers when moving the map */
  public updateBbox = true;

  public drawData = {
    'type': 'FeatureCollection',
    'features': []
  } as any;

  public constructor() { }

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
    }
  }

  public switchToDrawMode(mode?, opts?) {
    this.mapComponent.switchToDrawMode(mode, opts);
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

  public transformRequest = (url: string, resourceType: string) => ({
    url: url.replace('http', 'http'),
  });

  public openSettings() {
    this.mapSettings.openDialog(new MapSettings());
  }

  public onMapLoaded() {
    this.mapComponent.visibilityStatus = new Map();
    this.mapComponent.visibilityStatus.set('All products' + ARLAS_VSET + 'arlas_id:Number of products:1677155990578', true);
    this.mapComponent.visibilityStatus.set('Latest products' + ARLAS_VSET + 'arlas_id:Latest products:1677155839933', false);

    this.addLayer('bounds', '#ff61ec');
    this.addLayer('pwithin', '#3a3cc7');
    this.addLayer('pwithinraw', '#adc73a', true);
  }

  public stopUpdate() {
    this.updateBbox = !this.updateBbox;
  }

  public addGeoBox() {
    this.mapComponent.addGeoBox();
  }

  /**
   * Update the layers representing the bounds, the pwithin and pwithinraw of the map.
   * Useful to compare between Mercator and globe projection
   */
  public onMove(event: OnMoveResult) {
    if (!this.updateBbox) {
      return;
    }

    const bounds: LngLatBounds = this.mapComponent.map.getBounds() as any;

    const f: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [bounds._ne.lng, bounds._ne.lat],
                [bounds._ne.lng, bounds._sw.lat],
                [bounds._sw.lng, bounds._sw.lat],
                [bounds._sw.lng, bounds._ne.lat],
                [bounds._ne.lng, bounds._ne.lat]
              ]
            ]
          },
          properties: {}
        }
      ]
    };
    const boundsSource = this.mapFramework.getSource('bounds', this.mapComponent.map);
    this.mapFramework.setDataToGeojsonSource(boundsSource, f);

    const pwithinSource = this.mapFramework.getSource('pwithin', this.mapComponent.map);
    this.mapFramework.setDataToGeojsonSource(pwithinSource, this.boundsToFeatureCollection(event.extendWithOffset));

    const pwithinrawSource = this.mapFramework.getSource('pwithinraw', this.mapComponent.map);
    this.mapFramework.setDataToGeojsonSource(pwithinrawSource, this.boundsToFeatureCollection(event.rawExtendWithOffset));
  }

  private addLayer(name: string, color: string, dashes?: boolean) {
    const style: VectorStyle = {
      type: VectorStyleEnum.line,
      style: {
        'line-width': 12.5,
        'line-color': color
      }
    };

    if (dashes) {
      style.style['line-dasharray'] = [
        10,
        5
      ];
    }

    const geojsonBbox: GeoJSON.Feature<GeoJSON.Geometry> = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: []
      },
      properties: {}
    };

    this.mapFramework.addGeojsonLayer(this.mapComponent.map, name, style, geojsonBbox);
  }

  private boundsToFeatureCollection(bounds: number[]) {
    const f: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [bounds[1], bounds[0]],
                [bounds[1], bounds[2]],
                [bounds[3], bounds[2]],
                [bounds[3], bounds[0]],
                [bounds[1], bounds[0]]
              ]
            ]
          },
          properties: {}
        }
      ]
    };

    return f;
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
        operation: GeoQueryOperator.WITHIN,
        selected: true
      },
      {
        operation: GeoQueryOperator.NOT_WITHIN,
        selected: false
      },
      {
        operation: GeoQueryOperator.INTERSECTS,
        selected: false
      },
      {
        operation: GeoQueryOperator.NOT_INTERSECTS,
        selected: false
      }
    ];
  }

  public getGeoQueries(): Map<string, [GeometrySelectModel[], OperationSelectModel[], string]> {
    const geoQueriesMap = new Map<string, [GeometrySelectModel[], OperationSelectModel[], string]>();
    geoQueriesMap.set('Test', [[{ path: '_centroid' }], this.getOperations(), 'Display name Test']);
    return geoQueriesMap;
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

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
import {Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation,} from '@angular/core';
import {Subject} from 'rxjs';
import {ElementIdentifier} from '../results/utils/results.utils';
import {LegendData, MapExtend} from './mapgl.component.util';
import {MapLayers} from './model/mapLayers';
import {MapSource} from './model/mapSource';
import {Feature as TurfFeature, FeatureCollection} from '@turf/helpers';
import * as maplibregl from 'maplibre-gl';
import {RequestTransformFunction} from 'maplibre-gl';
import {TransformRequestFunction} from 'mapbox-gl';
import {AoiDimensions} from './draw/draw.models';
import {BasemapStyle} from './basemaps/basemap.config';
import {MapglMapblibreComponent} from "./mapgl-maps/mapgl-mapblibre/mapgl-mapblibre.component";
import {MapglMapboxComponent} from "./mapgl-maps/mapgl-mapbox/mapgl-mapbox.component";
import {IconConfig, OnMoveResult, VisualisationSetConfig} from "./mapgl.interface";


/**
 * Mapgl Component allows to display and select geometrical data on a map.
 */

@Component({
  selector: 'arlas-mapgl',
  templateUrl: './mapgl.component.html',
  styleUrls: ['./mapgl.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MapglComponent {

  @ViewChild('mapRef') map: any;

  /**
   * @Input : Angular
   * @description element identifier given to map container
   */
  @Input() protected id = 'mapgl';


  @Input() protected providerType: 'mapbox' | 'maplibre' | null = null;

  /**
   * @Input : Angular
   * @description List of mapgl layers
   */
  @Input() protected mapLayers: MapLayers;

  /**
 * @Input : Angular
 * @description Whether the scale is displayed.
 */
  @Input() protected displayScale = true;
  /**
   * @Input : Angular
   * @description Whether the coordinates are displayed.
   */
  @Input() protected displayCurrentCoordinates = false;
  /**
 * @Input : Angular
 * @description Whether the coordinates should be wraped between -180 and 180.
 */
  @Input() protected wrapLatLng = true;
  /**
   * @Input : Angular
   * @description Max width of the scale.
   */
  @Input() protected maxWidthScale = 100;
  /**
   * @Input : Angular
   * @description Unit of the scale.
   */
  @Input() protected unitScale: any; //TODO : can create a same type here
  /**
   * @Input : Angular
   * @description Default style of the base map
   */
  @Input() protected defaultBasemapStyle: BasemapStyle = {
    name: 'Positron Style',
    styleFile: 'http://demo.arlas.io:82/styles/positron/style.json',
  };
  /**
   * @Input : Angular
   * @description List of styles to apply to the base map
   */
  @Input() protected basemapStyles = new Array<BasemapStyle>();

  /**
   * @Input : Angular
   * @description Zoom of the map when it's initialized
   */
  @Input() protected initZoom = 2;
  /**
   * @Input : Angular
   * @description Max zoom of the map
   */
  @Input() protected maxZoom = 22;
  /**
   * @Input : Angular
   * @description Min zoom of the map
   */
  @Input() protected minZoom = 0;
  /**
   * @Input : Angular
   * @description Coordinates of the map's centre when it's initialized.
   */
  @Input() protected initCenter: [number, number] = [2.1972656250000004, 45.706179285330855];
  /**
   * @Input : Angular
   * @description Margin applied to the map extent. Data is loaded in all this extent.
   */
  @Input() protected margePanForLoad: number;
  /**
   * @Input : Angular
   * @description Margin applied to the map extent.
   * Before loading data, the components checks first if there are features already loaded in this extent.
   */
  @Input() protected margePanForTest: number;
  /**
   * @Input : Angular
   * @description the field name of ids.
   */
  @Input() protected idFeatureField: string;
  /**
   * @Input : Angular
   * @description Bounds that the view map fits. It's an array of two corners. Each corner is an lat-long position :
   * For example : boundsToFit = [[30.51, -54.3],[30.57, -54.2]]
   */
  @Input() protected boundsToFit: Array<Array<number>>;
  /**
   * @Input : Angular
   * @description The padding added in the top-left and bottom-right corners of a map container that shouldn't be accounted
   * for when setting the view to fit bounds.
   */
  @Input() protected fitBoundsOffSet: Array<number> = [0, 0];
  /**
   * @Input : Angular
   * @description The maximum zoom level so that the bounds fit the map view.
   */
  @Input() protected fitBoundsMaxZoom = 22;
  /**
   * @Input : Angular
   * @description Feature to highlight.
   */
  @Input() protected featureToHightLight: {
    isleaving: boolean;
    elementidentifier: ElementIdentifier;
  };
  /**
   * @Input : Angular
   * @description List of feature to select.
   */
  @Input() protected featuresToSelect: Array<ElementIdentifier>;
  /**
  * @Input : Angular
  * @description List of maplibregl sources to add to the map.
  */
  @Input() protected mapSources: Array<MapSource>;

  /**
   * @Input : Angular
   * @description Options object for draw tools : https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#options
   */
  @Input() protected drawOption: any = {};

  /**
   * @Input : Angular
   * @description Features drawn at component start
   */
  @Input() protected drawData: FeatureCollection;

  /**
   * @Input : Angular
   * @description Whether the draw tools are activated
   */
  @Input() protected drawButtonEnabled = false;

  /**
   * @Input : Angular
   * @description Maximum number of vertices allowed for a polygon
   */
  @Input() protected drawPolygonVerticesLimit: number;
  /**
   * @Input : Angular
   * @description A callback run before the Map makes a request for an external URL, mapbox map option
   */
  @Input() protected transformRequest: any; //TODO : can create a same type here

  /**
   * @Input : Angular
   * @description Whether the drawing buffer is activated
   * If true , the map's canvas can be exported to a PNG using map.getCanvas().toDataURL()
   * default: false
   */
  @Input() protected preserveDrawingBuffer = false;

  /**
   * @Input : Angular
   * @description An object with noth,east,south,west properies which represent an offset in pixel
   * Origin is top-left and x axe is west to east and y axe north to south.
   */
  @Input() protected offset: { north: number; east: number; south: number; west: number; } =
    { north: 0, east: 0, south: 0, west: 0 };

  /**
   * @Input : Angular
   * @description Padding value applied around a fitBounds to fully show the area targeted
   * */
  @Input() protected fitBoundsPadding = 10;

  /**
   * @Input : Angular
   * @description Subject to which the component subscribes to redraw on the map the `data` of the given `source`.
   */
  @Input() protected redrawSource: Subject<{ source: string; data: TurfFeature[]; }> =
    new Subject<{ source: string; data: TurfFeature[]; }>();

  /**
   * @Input : Angular
   * @description Subject of [collection, [field, legendData]] map. The map subscribes to it to keep
   * the legend updated with the data displayed on the map.
   */
  @Input() protected legendUpdater: Subject<Map<string, Map<string, LegendData>>> = new Subject();

  /**
   * @Input : Angular
   * @description Subject of [layerId, boolean] map. The map subscribes to it to keep
   * the legend updated with the visibility of the layer.
   */
  @Input() protected visibilityUpdater: Subject<Map<string, boolean>> = new Subject();

  /**
   * @Input : Angular
   * @description List of data sources names that should be added to the map. Sources should be of type `geojson`
   */
  @Input() protected dataSources: Set<string>;

  /**
   * @Input : Angular
   * @description List of visualisation sets. A Visualisation set is an entity where to group layers together.
   * If a visualisation set is enabled, all the layers in it can be displayed on the map, otherwise the layers are removed from the map.
   */
  @Input() protected visualisationSetsConfig: Array<VisualisationSetConfig>;

  /**
   * @Input : Angular
   * @description Position of the map attribution
   */
  @Input() protected mapAttributionPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'bottom-right';

  public visualisationsSets: {
    visualisations: Map<string, Set<string>>;
    status: Map<string, boolean>;
  };

  /**
   * @Input : Angular
   * @description List of icons to add to the map and that can be used in layers.
   */
  @Input() protected icons: Array<IconConfig>;

  /**
   * @Output : Angular
   * @description Emits true after the map is loaded and all sources & layers are added.
  */
  @Output() protected onMapLoaded: Subject<boolean> = new Subject<boolean>();


  /**
   * @Output : Angular
   * @description Emits the event of moving the map.
   * @deprecated
   */
  @Output() protected onMove: EventEmitter<OnMoveResult> = new EventEmitter<OnMoveResult>();

  @Output() protected visualisations: EventEmitter<Set<string>> = new EventEmitter();
  /**
   * @Output : Angular
   * @description Emits the event of clicking on a feature.
   */
  @Output() protected onFeatureClic: EventEmitter<any> = new EventEmitter<any>();
  /**
   * @Output : Angular
   * @description Emits the event of hovering feature.
   */
  @Output() protected onFeatureOver: EventEmitter<any> = new EventEmitter<any>();

  /**
   * @Output :  Angular
   * @description Emits the map extend on Tab close/refresh
   */
  @Output() protected onMapClosed: EventEmitter<MapExtend> = new EventEmitter<MapExtend>();
  /**
   * @Output :  Angular
   * @description Emits the geojson of an aoi added to the map
   */
  @Output() protected onAoiChanged: EventEmitter<FeatureCollection> = new EventEmitter();
  @Output() protected onAoiEdit: EventEmitter<AoiDimensions> = new EventEmitter();
  /**
   * @Output :  Angular
   * @description Emits the geojson of an aoi added to the map
   */
  @Output() protected onBasemapChanged: Subject<boolean> = new Subject();
  /**
   * @Output :  Angular
   * @description Emits which layers are displayed in the Legend
   */
  @Output() protected legendVisibiltyStatus: Subject<Map<string, boolean>> = new Subject();
  @Output() protected downloadSourceEmitter: Subject<{
    layerId: string;
    layerName: string;
    collection: string;
    sourceName: string;
    downloadType: string;
  }> = new Subject();

  constructor() {

  }


  protected changeVisualisationWrapper($event: Set<string>) {
    this.visualisations.next($event);
  }

  protected onChangeAoiWrapper($event: FeatureCollection) {
    this.onAoiChanged.next($event);
  }

  protected onAoiEditWrapper($event: AoiDimensions) {
    this.onAoiEdit.next($event);
  }

  protected onMoveWrapper($event) {
    this.onMove.next($event)
  }

  protected onBasemapChangedWrapper() {
    this.onBasemapChanged.next(true);
  }

  protected onMapLoadedWrapper($event: boolean) {
    this.onMapLoaded.next(true);
  }

  protected legendVisibiltyStatusWrapper($event: Map<string, boolean>) {
    this.legendVisibiltyStatus.next($event)
  }

  protected emitFeaturesOnOverWrapper($event: any) {
    this.onFeatureOver.next($event);
  }

  protected emitFeaturesOnClicWrapper($event: any) {
    this.onFeatureClic.next($event);
  }

  protected  downloadLayerSourceWrapper($event: {
    layerId: string;
    layerName: string;
    collection: string;
    sourceName: string;
    downloadType: string
  }) {
    this.downloadSourceEmitter.next($event)
  }
}

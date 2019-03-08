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

import {
  AfterViewInit, Component, EventEmitter,
  HostListener, Input, IterableDiffers,
  OnChanges, OnInit, Output, SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { bboxes } from 'ngeohash';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ElementIdentifier } from '../results/utils/results.utils';
import { ControlButton, PitchToggle } from './mapgl.component.control';
import { getDefaultStyle, paddedBounds, xyz } from './mapgl.component.util';
import * as mapglJsonSchema from './mapgl.schema.json';
import { MapLayers, Style, BasemapStyle, BasemapStylesGroup } from './model/mapLayers';
import { MapSource } from './model/mapSource';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw';


export interface OnMoveResult {
  zoom: number;
  center: Array<number>;
  extend: Array<number>;
  extendForLoad: Array<number>;
  extendForTest: Array<number>;
  tiles: Array<{ x: number, y: number, z: number }>;
  geohash: Array<string>;
}

/**
 * Mapgl Component allows to display and select geometrical data on a map.
 */

@Component({
  selector: 'arlas-mapgl',
  templateUrl: './mapgl.component.html',
  styleUrls: ['./mapgl.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MapglComponent implements OnInit, AfterViewInit, OnChanges {
  public map: any;
  public draw: any;
  private emptyData = {
    'type': 'FeatureCollection',
    'features': []
  };
  private index: any;
  private north: number;
  private east: number;
  private west: number;
  private south: number;
  private zoom: number;
  private isDrawingBbox = false;
  private start: mapboxgl.Point;
  private canvas: HTMLElement;
  private box: HTMLElement;
  private current: mapboxgl.Point;
  private startlngLat: any;
  private endlngLat: any;

  private DATA_SOURCE = 'data_source';
  private GEOBOX_SOURCE = 'geobox';

  /**
   * @Input : Angular
   * @description List of mapgl layers
   */
  @Input() public mapLayers: MapLayers;

  /**
   * @Input : Angular
   * @description Whether the layer switcher controll is displayed.
   * If not, the map component uses the default style group and with its default style
   */
  @Input() public displayLayerSwitcher = false;
  /**
 * @Input : Angular
 * @description Whether the scale is displayed.
 */
  @Input() public displayScale = true;
  /**
   * @Input : Angular
   * @description Whether the coordinates are displayed.
   */
  @Input() public displayCurrentCoordinates = false;
  /**
   * @Input : Angular
   * @description Max width of the scale.
   */
  @Input() public maxWidthScale = 100;
  /**
   * @Input : Angular
   * @description Unit of the scale.
   */
  @Input() public unitScale = 'metric';
  /**
   * @Input : Angular
   * @description Default style of the base map
   */
  @Input() public defaultBasemapStyle = {
    name: 'Positron Style',
    styleFile: 'http://demo.arlas.io:82/styles/positron/style.json'
  };

  /**
   * @Input : Angular
   * @description List of styles to apply to the base map
   */
  @Input() public basemapStyles = new Array<BasemapStyle>();
  /**
   * @Input : Angular
   * @description Zoom of the map when it's initialized
   */
  @Input() public initZoom = 2;
  /**
   * @Input : Angular
   * @description Max zoom of the map
   */
  @Input() public maxZoom = 22;
  /**
   * @Input : Angular
   * @description Min zoom of the map
   */
  @Input() public minZoom = 0;
  /**
   * @Input : Angular
   * @description Coordinates of the map's centre when it's initialized.
   */
  @Input() public initCenter = [2.1972656250000004, 45.706179285330855];
  /**
   * @Input : Angular
   * @description Margin applied to the map extent. Data is loaded in all this extent.
   */
  @Input() public margePanForLoad: number;
  /**
   * @Input : Angular
   * @description Margin applied to the map extent.
   * Before loading data, the components checks first if there are features already loaded in this extent.
   */
  @Input() public margePanForTest: number;
  /**
   * @Input : Angular
   * @description The data displayed on map.
   */
  @Input() public geojsondata: { type: string, features: Array<any> } = this.emptyData;
  /**
   * @Input : Angular
   * @description The geobox feature.
   */
  @Input() public geoboxdata: { type: string, features: Array<any> } = this.emptyData;
  /**
   * @Input : Angular
   * @description the field name of ids.
   */
  @Input() public idFeatureField: string;
  /**
   * @Input : Angular
   * @description Bounds that the view map fits. It's an array of two corners. Each corner is an lat-long position :
   * For example : boundsToFit = [[30.51, -54.3],[30.57, -54.2]]
   */
  @Input() public boundsToFit: Array<Array<number>>;
  /**
   * @Input : Angular
   * @description The padding added in the top-left and bottom-right corners of a map container that shouldn't be accounted
   * for when setting the view to fit bounds.
   */
  @Input() public fitBoundsOffSet: Array<number> = [0, 0];
  /**
   * @Input : Angular
   * @description The maximum zoom level so that the bounds fit the map view.
   */
  @Input() public fitBoundsMaxZoom = 22;
  /**
   * @Input : Angular
   * @description Feature to highlight.
   */
  @Input() public featureToHightLight: {
    isleaving: boolean,
    elementidentifier: ElementIdentifier
  };
  /**
   * @Input : Angular
   * @description List of feature to select.
   */
  @Input() public featuresToSelect: Array<ElementIdentifier>;
  /**
  * @Input : Angular
  * @description List of mapboxgl sources to add to the map.
  */
  @Input() public mapSources: Array<MapSource>;
  /**
   * @Input : Angular
   * @description List of triplet zoom-level-precision to associate a couple level-precision for each zoom.
   */
  @Input() public zoomToPrecisionCluster: Array<Array<number>>;

  /**
   * @Input : Angular
   * @description Options object for draw tools : https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#options
   */
  @Input() public drawOption: any = {};

  /**
   * @Input : Angular
   */
  @Input() public drawData: { type: string, features: Array<any> } = this.emptyData;

  /**
   * @Input : Angular
   * @description A couple of (max precision, max geohash-level) above which data is displayed as features
   */
  @Input() private maxPrecision: Array<number>;
  /**
   * @Output : Angular
   * @description Emits the event of whether redraw the tile.
   */

  @Output() public redrawTile: Subject<boolean> = new Subject<boolean>();
  /**
 * @Output : Angular
 * @description Emits the new Style.
 */
  @Output() public switchLayer: Subject<Style> = new Subject<Style>();
  /**
   * @Output : Angular
   * @description Emits the event of removing the geobox.
   */
  @Output() public onRemoveBbox: Subject<boolean> = new Subject<boolean>();
  /**
   * @Output : Angular
   * @description Emits an event at the end of drawing a geobox.
   */
  @Output() public onChangeBbox: EventEmitter<Array<Object>> = new EventEmitter<Array<Object>>();
  /**
   * @Output : Angular
   * @description Emits the event of moving the map.
   */
  @Output() public onMove: EventEmitter<OnMoveResult> = new EventEmitter<OnMoveResult>();
  /**
   * @Output : Angular
   * @description Emits the event of clicking on a feature.
   */
  @Output() public onFeatureClic: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();
  /**
   * @Output : Angular
   * @description Emits the event of hovering feature.
   */
  @Output() public onFeatureOver: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

  /**
   * @Output : Angular
   */
  @Output() public onPolygonChange: EventEmitter<Array<Object>> = new EventEmitter<Array<Object>>();

  public showLayersList = false;
  private BASE_LAYER_ERROR = 'The layers ids of your base were not met in the declared layers list.';
  private STYLE_LAYER_ERROR = 'The layers ids of your style were not met in the declared layers list.';
  private layersMap = new Map<string, mapboxgl.Layer>();
  public basemapStylesGroup: BasemapStylesGroup;

  public currentLat: string;
  public currentLng: string;

  // Polygon
  private indexId = 0;
  private customIds = new Map<number, string>();

  constructor(private http: HttpClient, private differs: IterableDiffers) {
    this.onRemoveBbox.subscribe(value => {
      if (value) {
        this.geoboxdata = this.emptyData;
        if (this.map.getSource(this.GEOBOX_SOURCE) !== undefined) {
          this.map.getSource(this.GEOBOX_SOURCE).setData(this.geoboxdata);
        }
      }
    });
  }

  public static getMapglJsonSchema(): Object {
    return mapglJsonSchema;
  }

  public ngOnInit() { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.map !== undefined) {
      if (this.map.getSource(this.DATA_SOURCE) !== undefined) {
        if (changes['geojsondata'] !== undefined) {
          this.geojsondata = changes['geojsondata'].currentValue;
          this.map.getSource(this.DATA_SOURCE).setData(this.geojsondata);
        }
      }
      if (this.map.getSource(this.GEOBOX_SOURCE) !== undefined) {
        if (changes['geoboxdata'] !== undefined) {
          this.map.getSource(this.GEOBOX_SOURCE).setData(this.geoboxdata);
        }
      }

      if (changes['boundsToFit'] !== undefined) {
        const newBoundsToFit = changes['boundsToFit'].currentValue;
        const canvas = this.map.getCanvasContainer();
        const positionInfo = canvas.getBoundingClientRect();
        const width = positionInfo.width;
        this.map.fitBounds(newBoundsToFit, {
          maxZoom: this.fitBoundsMaxZoom,
          offset: this.fitBoundsOffSet
        });
      }
      if (changes['featureToHightLight'] !== undefined) {
        const featureToHightLight = changes['featureToHightLight'].currentValue;
        this.highlightFeature(featureToHightLight);
      }
      if (changes['featuresToSelect'] !== undefined) {
        const featuresToSelect = changes['featuresToSelect'].currentValue;
        this.selectFeatures(featuresToSelect);
      }
    }
  }
  public setBaseMapStyle(style: string) {
    if (this.map) {
      const layers = (<mapboxgl.Map>this.map).getStyle().layers;
      const sources = (<mapboxgl.Map>this.map).getStyle().sources;
      const selectedBasemapLayersSet = new Set<string>();
      this.http.get(this.basemapStylesGroup.selectedBasemapStyle.styleFile).subscribe((s: any) => {
        if (s.layers) { s.layers.forEach(l => selectedBasemapLayersSet.add(l.id)); }
        const layersToSave = new Array<mapboxgl.Layer>();
        const sourcesToSave = new Array<MapSource>();
        layers.filter((l: mapboxgl.Layer) => !selectedBasemapLayersSet.has(l.id)).forEach(l => {
          layersToSave.push(l);
          if (sourcesToSave.filter(ms => ms.id === l.source.toString()).length === 0) {
            sourcesToSave.push({ id: l.source.toString(), source: sources[l.source.toString()] });
          }
        });
        const sourcesToSaveSet = new Set<string>();
        sourcesToSave.forEach(mapSource => sourcesToSaveSet.add(mapSource.id));
        if (this.mapSources) {
          this.mapSources.forEach(mapSource => {
            if (!sourcesToSaveSet.has(mapSource.id)) {
              sourcesToSave.push(mapSource);
            }
          });
        }
        this.map.setStyle(style).once('styledata', () => {
          this.addSourcesToMap(sourcesToSave, this.map);
          layersToSave.forEach(l => this.map.addLayer(l));
        });
      });
    }
  }
  public ngAfterViewInit() {
    const afterViewInitbasemapStyle: BasemapStyle = this.getAfterViewInitBasemapStyle();
    this.map = new mapboxgl.Map({
      container: 'mapgl',
      style: afterViewInitbasemapStyle.styleFile,
      center: this.initCenter,
      zoom: this.initZoom,
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      renderWorldCopies: true
    });


    this.draw = new MapboxDraw(this.drawOption);

    /** [basemapStylesGroup] object includes the list of basemap styles and which one is selected */
    this.setBasemapStylesGroup(afterViewInitbasemapStyle);

    /** Whether to display scale */
    if (this.displayScale) {
      const scale = new mapboxgl.ScaleControl({
        maxWidth: this.maxWidthScale,
        unit: this.unitScale,
      });
      this.map.addControl(scale, 'bottom-right');
    }

    if (this.displayCurrentCoordinates) {
      this.map.on('mousemove', (e) => {
        this.currentLat = String(Math.round(e.lngLat.lat * 100000) / 100000);
        this.currentLng = String(Math.round(e.lngLat.lng * 100000) / 100000);
      });
    }
    const layerSwitcherButton = new ControlButton('layersswitcher');
    const navigationControllButtons = new mapboxgl.NavigationControl();
    const addGeoBoxButton = new ControlButton('addgeobox');
    const removeBoxButton = new ControlButton('removegeobox');
    if (this.displayLayerSwitcher) {
      this.map.addControl(layerSwitcherButton, 'top-right');
      layerSwitcherButton.btn.onclick = () => {
        this.showLayersList = !this.showLayersList;
      };
    }
    this.map.addControl(navigationControllButtons, 'top-right');
    this.map.addControl(new PitchToggle(-20, 70, 11), 'top-right');
    this.map.addControl(addGeoBoxButton, 'top-right');
    this.map.addControl(removeBoxButton, 'top-right');
    this.map.addControl(this.draw, 'top-right');

    addGeoBoxButton.btn.onclick = () => {
      this.addGeoBox();
    };
    removeBoxButton.btn.onclick = () => {
      this.removeGeoBox();
    };
    this.map.boxZoom.disable();
    this.map.on('load', () => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();
      // Add GeoBox Source
      this.map.addSource(this.GEOBOX_SOURCE, {
        'type': 'geojson',
        'data': this.geoboxdata
      });
      // Add Data_source
      this.map.addSource(this.DATA_SOURCE, {
        'type': 'geojson',
        'data': this.geojsondata
      });
      this.addSourcesToMap(this.mapSources, this.map);
      if (this.mapLayers !== null) {
        this.mapLayers.layers.forEach(layer => this.layersMap.set(layer.id, layer));
        this.addBaseLayers();
        this.addStylesLayers();

        this.mapLayers.events.zoomOnClick.forEach(layerId => {
          this.map.on('click', layerId, (e) => {
            if (e.features[0].properties.cluster_id !== undefined) {
              const expansionZoom = this.index.getClusterExpansionZoom(e.features[0].properties.cluster_id);
              this.map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: expansionZoom });
            } else {
              const zoom = this.map.getZoom();
              let newZoom: number;
              if (zoom >= 0 && zoom < 3) {
                newZoom = 4;
              } else if (zoom >= 3 && zoom < 5) {
                newZoom = 5;
              } else if (zoom >= 5 && zoom < 7) {
                newZoom = 7;
              } else if (zoom >= 7 && zoom < 10) {
                newZoom = 10;
              } else if (zoom >= 10 && zoom < 11) {
                newZoom = 11;
              } else {
                newZoom = 12;
              }
              this.map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: newZoom });

            }
          });
        });

        this.mapLayers.events.emitOnClick.forEach(layerId => {
          this.map.on('click', layerId, (e) => {
            this.onFeatureClic.next(e.features.map(f => f.properties[this.idFeatureField]));
          });
        });

        this.mapLayers.events.onHover.forEach(layerId => {
          this.map.on('mousemove', layerId, (e) => {
            this.onFeatureOver.next(e.features.map(f => f.properties[this.idFeatureField]));
          });

          this.map.on('mouseleave', layerId, (e) => {
            this.onFeatureOver.next([]);
          });
        });
      }

      this.map.showTileBoundaries = false;
      this.map.on('mousemove', this.DATA_SOURCE, (e) => {
        if (this.isDrawingBbox) {
          this.map.getCanvas().style.cursor = 'crosshair';
        } else {
          this.map.getCanvas().style.cursor = 'pointer';
        }
      });
      this.map.on('mouseleave', this.DATA_SOURCE, (e) => {
        if (this.isDrawingBbox) {
          this.map.getCanvas().style.cursor = 'crosshair';

        } else {
          this.map.getCanvas().style.cursor = '';
        }
      });
      this.canvas = this.map.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);

      this.map.on('draw.create', (e) => {
        this.addCustomId(e.features[0].id);
        this.onChangePolygonDraw();
      });
      this.map.on('draw.update', () => {
        this.onChangePolygonDraw();
      });
      this.map.on('draw.delete', () => {
        this.onChangePolygonDraw();
      });

      const drawIds = this.draw.set(this.drawData);
      drawIds.forEach(id => {
        this.addCustomId(id);
      });

    });
    const moveend = fromEvent(this.map, 'moveend')
      .pipe(debounceTime(750));
    moveend.subscribe(e => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();
      let geohashList = [];
      if (this.west < -180 && this.east > 180) {
        geohashList = bboxes(Math.min(this.south, this.north),
          -180,
          Math.max(this.south, this.north),
          180, Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
      } else if (this.west < -180 && this.east < 180) {
        const geohashList_1: Array<string> = bboxes(Math.min(this.south, this.north),
          Math.min(-180, this.west + 360),
          Math.max(this.south, this.north),
          Math.max(-180, this.west + 360), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
        const geohashList_2: Array<string> = bboxes(Math.min(this.south, this.north),
          Math.min(this.east, 180),
          Math.max(this.south, this.north),
          Math.max(this.east, 180), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
        geohashList = geohashList_1.concat(geohashList_2);

      } else if (this.east > 180 && this.west > -180) {
        const geohashList_1: Array<string> = bboxes(Math.min(this.south, this.north),
          Math.min(180, this.east - 360),
          Math.max(this.south, this.north),
          Math.max(180, this.east - 360), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));

        const geohashList_2: Array<string> = bboxes(Math.min(this.south, this.north),
          Math.min(this.west, -180),
          Math.max(this.south, this.north),
          Math.max(this.west, -180), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
        geohashList = geohashList_1.concat(geohashList_2);
      } else {
        geohashList = bboxes(Math.min(this.south, this.north),
          Math.min(this.east, this.west),
          Math.max(this.south, this.north),
          Math.max(this.east, this.west), Math.max(this.getGeohashLevelFromZoom(this.zoom), 1));
      }

      const onMoveData: OnMoveResult = {
        zoom: this.zoom,
        center: this.map.getCenter(),
        extend: [this.north, this.west, this.south, this.east],
        extendForLoad: [],
        extendForTest: [],
        tiles: [],
        geohash: geohashList
      };

      const canvas = this.map.getCanvasContainer();
      const positionInfo = canvas.getBoundingClientRect();
      const height = positionInfo.height;
      const width = positionInfo.width;
      const panLoad = this.margePanForLoad * Math.max(height, width) / 100;
      const panTest = this.margePanForTest * Math.max(height, width) / 100;
      const extendForLoadLatLng = paddedBounds(panLoad, panLoad, panLoad, panLoad,
        this.map, this.map.getBounds()._sw, this.map.getBounds()._ne);
      const extendForTestdLatLng = paddedBounds(panTest, panTest, panTest, panTest,
        this.map, this.map.getBounds()._sw, this.map.getBounds()._ne);
      onMoveData.extendForLoad = [
        Math.min(extendForLoadLatLng[1].lat, 90),
        Math.max(extendForLoadLatLng[0].lng, -180),
        Math.max(extendForLoadLatLng[0].lat, -90),
        Math.min(extendForLoadLatLng[1].lng, 180)
      ];
      onMoveData.extendForTest = [
        Math.min(extendForTestdLatLng[1].lat, 90),
        Math.max(extendForTestdLatLng[0].lng, -180),
        Math.max(extendForTestdLatLng[0].lat, -90),
        Math.min(extendForTestdLatLng[1].lng, 180)
      ];
      onMoveData.tiles = xyz([[onMoveData.extendForLoad[1], onMoveData.extendForLoad[2]],
      [onMoveData.extendForLoad[3], onMoveData.extendForLoad[0]]],
        Math.ceil((this.zoom) - 1));
      this.onMove.next(onMoveData);
    });
    // Fit bounds on current bounds to emit init position in moveend bus
    this.map.fitBounds(this.map.getBounds());
    this.map.on('mousedown', (e) => {
      this.startlngLat = e.lngLat;
    });
    this.map.on('mouseup', (e) => {
      this.endlngLat = e.lngLat;
    });

    this.redrawTile.subscribe(value => {
      if (value) {
        if (this.map.getSource(this.DATA_SOURCE) !== undefined) {
          this.map.getSource(this.DATA_SOURCE).setData(this.geojsondata);
        }
      }
    });

  }

  /**
   * @description Displays the geobox
   */
  public addGeoBox() {
    this.map.getCanvas().style.cursor = 'crosshair';
    this.isDrawingBbox = true;
  }

  /**
   * @description Removes the geobox
   */
  public removeGeoBox() {
    this.map.getCanvas().style.cursor = '';
    this.geoboxdata.features = [];
    this.onRemoveBbox.next(true);
    this.isDrawingBbox = false;
  }

  public onChangeStyle(styleGroupId: string, selectedStyle: Style) {
    this.mapLayers.styleGroups.filter(styleGroup => styleGroup.id === styleGroupId).forEach(styleGroup => {
      styleGroup.selectedStyle = selectedStyle;
    });
    this.removeAllLayers();
    if (selectedStyle.geomStrategy !== undefined) {
      this.switchLayer.next(selectedStyle);
    }
    this.mapLayers.styleGroups.forEach(styleGroup => {
      styleGroup.selectedStyle.layerIds.forEach(layerId => {
        this.addLayer(layerId);
      });
    });
  }

  public onChangePolygonDraw() {
    this.drawData = {
      'type': 'FeatureCollection',
      'features': this.draw.getAll().features
    };
    this.onPolygonChange.next(this.draw.getAll().features);
  }

  public onChangeBasemapStyle(selectedStyle: BasemapStyle) {
    this.setBaseMapStyle(selectedStyle.styleFile);
    localStorage.setItem('arlas_last_base_map', JSON.stringify(selectedStyle));
    this.basemapStylesGroup.selectedBasemapStyle = selectedStyle;
  }

  /**
   * Return the polygons geometry in WKT or GeoJson given the mode
   * @param mode : string
   */
  public getAllPolygon(mode: 'wkt' | 'geojson') {
    let polygon;
    if (mode === 'wkt') {
      polygon = this.latLngToWKT(this.draw.getAll().features);
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getAll().features
      };
    }
    return polygon;
  }

  /**
   * Return the selected polygon geometry in WKT or GeoJson given the mode
   * @param mode : string
   */
  public getSelectedPolygon(mode: 'wkt' | 'geojson') {
    let polygon;
    if (mode === 'wkt') {
      polygon = this.latLngToWKT(this.draw.getSelected().features);
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getSelected().features
      };
    }
    return polygon;
  }

  public getPolygonById(id: number, mode: 'wkt' | 'geojson') {
    let polygon;
    if (mode === 'wkt') {
      polygon = this.latLngToWKT([this.draw.get(this.customIds.get(id))]);
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': [this.draw.get(this.customIds.get(id))]
      };
    }
    return polygon;
  }

  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isDrawingBbox) {
      this.map.getCanvas().style.cursor = '';
      this.isDrawingBbox = false;
    }
  }


  private latLngToWKT(features) {
    let wktType = 'POLYGON[###]';
    if (features.length > 1) {
      wktType = 'MULTIPOLYGON([###])';
    }

    let polygons = '';
    features.forEach((feat, indexFeature) => {
      const currentFeat: Array<any> = feat.geometry.coordinates;
      polygons += (indexFeature === 0 ? '' : ',') + '((';
      currentFeat[0].forEach((coord, index) => {
        polygons += (index === 0 ? '' : ',') + coord[0] + ' ' + coord[1];
      });
      polygons += '))';
    });

    let wkt = '';
    if (polygons !== '') {
      wkt = wktType.replace('[###]', polygons);
    }
    return wkt;
  }

  /**
   * @description Add map sources
   */
  private addSourcesToMap(sources: Array<MapSource>, map: any) {


    // Add sources defined as input in mapSources;
    const mapSourcesMap = new Map<string, MapSource>();
    if (sources) {
      sources.forEach(mapSource => {
        mapSourcesMap.set(mapSource.id, mapSource);
      });
      mapSourcesMap.forEach((mapSource, id) => {
        if (map.getSource(id) === undefined) {
          map.addSource(id, mapSource.source);
        }
      });
    }
  }

  /**
   * @description Add base layers of each style group
   */
  private addBaseLayers() {
    this.mapLayers.styleGroups.forEach(styleGroup => {
      styleGroup.base.forEach(layerId => {
        this.addLayer(layerId);
      });
    });
  }

  /**
   * @description Add layers of the selected style of each style group
   */
  private addStylesLayers() {
    this.mapLayers.styleGroups.forEach(styleGroup => {
      let style;
      if (!styleGroup.selectedStyle) {
        style = getDefaultStyle(styleGroup.styles);
        styleGroup.selectedStyle = style;
      } else {
        style = styleGroup.selectedStyle;
      }
      if (style.geomStrategy !== undefined) {
        this.switchLayer.next(style);
      }
      style.layerIds.forEach(layerId => {
        this.addLayer(layerId);
      });
    });
  }

  private getAllBasemapStyles(): Array<BasemapStyle> {
    const allBasemapStyles = new Array<BasemapStyle>();
    this.basemapStyles.forEach(b => allBasemapStyles.push(b));
    /** Check whether to add [defaultBasemapStyle] to [allBasemapStyles] list*/
    if (this.basemapStyles.map(b => b.name).filter(n => n === this.defaultBasemapStyle.name).length === 0) {
      allBasemapStyles.push(this.defaultBasemapStyle);
    }
    return allBasemapStyles;
  }

  /**
   * @description returns the basemap style that is displayed when the map is loaded for the first time
   */
  private getAfterViewInitBasemapStyle(): BasemapStyle {
    if (!this.defaultBasemapStyle) {
      throw new Error('[defaultBasemapStyle] input is invalid.');
    }
    if (!this.basemapStyles) {
      throw new Error('[basemapStyles] input is null or undefined.');
    }
    const allBasemapStyles = this.getAllBasemapStyles();
    const localStorageBasemapStyle: BasemapStyle = JSON.parse(localStorage.getItem('arlas_last_base_map'));
    /** check if a basemap style is saved in local storage and that it exists in [allBasemapStyles] list */
    if (localStorageBasemapStyle && allBasemapStyles.filter(b => b.name === localStorageBasemapStyle.name
      && b.styleFile === localStorageBasemapStyle.styleFile).length > 0) {
      return localStorageBasemapStyle;
    } else {
      localStorage.setItem('arlas_last_base_map', JSON.stringify(this.defaultBasemapStyle));
      return this.defaultBasemapStyle;
    }
  }

  /**
   * @param selectedBasemapStyle the selected basemap style
   * @description This method sets the [basemapStylesGroup] object that includes the list of basemapStyles
   * and which basemapStyle is selected.
   */
  private setBasemapStylesGroup(selectedBasemapStyle: BasemapStyle) {
    const allBasemapStyles = this.getAllBasemapStyles();
    /** basemapStylesGroup object includes the list of basemap styles and which one is selected */
    this.basemapStylesGroup = {
      basemapStyles: allBasemapStyles,
      selectedBasemapStyle: selectedBasemapStyle
    };
  }

  private addLayer(layerId: string): void {
    const layer = this.layersMap.get(layerId);
    if (layer !== undefined && layer.id === layerId) {
      this.map.addLayer(layer);
    } else {
      throw new Error(this.BASE_LAYER_ERROR);
    }
  }

  private removeAllLayers() {
    this.mapLayers.styleGroups.forEach(styleGroup => {
      styleGroup.styles.forEach(style => {
        style.layerIds.forEach(layerId => {
          if (this.map.getLayer(layerId) !== undefined) {
            this.map.removeLayer(layerId);
          }
        });
      });
    });
  }

  private highlightFeature(featureToHightLight: {
    isleaving: boolean,
    elementidentifier: ElementIdentifier
  }) {
    if (this.map.getLayer('features-fill-hover') !== undefined) {
      this.map.setLayoutProperty('features-fill-hover', 'visibility', 'visible');
      if (!featureToHightLight.isleaving) {
        this.map.setFilter('features-fill-hover', ['all', ['!=', '$type', 'Point'], ['==',
          featureToHightLight.elementidentifier.idFieldName,
          featureToHightLight.elementidentifier.idValue]]
        );
      } else {
        this.map.setFilter('features-fill-hover', ['all', ['!=', '$type', 'Point'], ['==',
          featureToHightLight.elementidentifier.idFieldName,
          ' ']]);
      }
    }
  }

  private selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    if (this.map.getLayer('features-line-select') !== undefined) {
      if (elementToSelect.length > 0) {
        this.map.setLayoutProperty('features-line-select', 'visibility', 'visible');
        const filter = elementToSelect.reduce(function (memo, element) {
          memo.push(element.idValue);
          return memo;
        }, ['in', elementToSelect[0].idFieldName]);
        this.map.setFilter('features-line-select', filter);
      } else {
        this.map.setLayoutProperty('features-line-select', 'visibility', 'none');
      }
    }
  }

  private mousedown = (e) => {
    // Continue the rest of the function if we add a geobox.
    if (!this.isDrawingBbox) { return; }
    // Disable default drag zooming when we add a geobox.
    this.map.dragPan.disable();
    // Call functions for the following events
    document.addEventListener('mousemove', this.mousemove);
    document.addEventListener('mouseup', this.mouseup);
    // Capture the first xy coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.start = new mapboxgl.Point(
      e.clientX - rect.left - this.canvas.clientLeft,
      e.clientY - rect.top - this.canvas.clientTop
    );
  }

  private mousemove = (e) => {
    // Capture the ongoing xy coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.current = new mapboxgl.Point(
      e.clientX - rect.left - this.canvas.clientLeft,
      e.clientY - rect.top - this.canvas.clientTop
    );
    // Append the box element if it doesnt exist
    if (this.box === undefined) {
      this.box = document.createElement('div');
      this.box.classList.add('boxdraw');
      this.canvas.appendChild(this.box);
    }

    const minX = Math.min(this.start.x, this.current.x);
    const maxX = Math.max(this.start.x, this.current.x);
    const minY = Math.min(this.start.y, this.current.y);
    const maxY = Math.max(this.start.y, this.current.y);

    // Adjust width and xy position of the box element ongoing
    const pos = 'translate(' + minX + 'px,' + minY + 'px)';
    this.box.style.transform = pos;
    this.box.style.webkitTransform = pos;
    this.box.style.width = maxX - minX + 'px';
    this.box.style.height = maxY - minY + 'px';
  }

  private mouseup = (e) => {
    const rect = this.canvas.getBoundingClientRect();
    const f = new mapboxgl.Point(
      e.clientX - rect.left - this.canvas.clientLeft,
      e.clientY - rect.top - this.canvas.clientTop
    );
    // Capture xy coordinates
    if (this.start.x !== f.x && this.start.y !== f.y) {
      this.finish([[this.start, f], [e.lngLat]]);
    } else {
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.map.getCanvas().style.cursor = '';
      this.isDrawingBbox = false;
      this.map.dragPan.enable();
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
  }

  private finish(bbox?) {
    // Remove these events now that finish has been called.
    document.removeEventListener('mousemove', this.mousemove);
    document.removeEventListener('mouseup', this.mouseup);
    if (bbox) {
      this.map.getCanvas().style.cursor = '';
      this.map.dragPan.enable();
      const startlng: number = this.startlngLat.lng;
      const endlng: number = this.endlngLat.lng;
      const startlat: number = this.startlngLat.lat;
      const endlat: number = this.endlngLat.lat;
      const west = Math.min(startlng, endlng);
      const north = Math.max(startlat, endlat);
      const east = Math.max(startlng, endlng);
      const south = Math.min(startlat, endlat);
      const coordinates = [[
        [east, south],
        [east, north],
        [west, north],
        [west, south],
        [east, south],
      ]];
      const polygonGeojson = {
        type: 'Feature',
        properties: {
        },
        geometry: {
          type: 'Polygon',
          coordinates: coordinates
        }
      };
      this.geoboxdata.features.push(polygonGeojson);
      this.onChangeBbox.emit(this.geoboxdata.features);
      this.map.getSource(this.GEOBOX_SOURCE).setData(this.geoboxdata);
      this.isDrawingBbox = false;
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
  }

  private getGeohashLevelFromZoom(zoom: number): number {
    const zoomToPrecisionClusterObject = {};
    const zoomToPrecisionCluster = this.zoomToPrecisionCluster;
    zoomToPrecisionCluster.forEach(triplet => {
      zoomToPrecisionClusterObject[triplet[0]] = [triplet[1], triplet[2]];
    });
    if (zoomToPrecisionClusterObject[Math.ceil(zoom) - 1] !== undefined) {
      if (zoomToPrecisionClusterObject[Math.ceil(zoom) - 1][1] !== undefined) {
        return zoomToPrecisionClusterObject[Math.ceil(zoom) - 1][1];
      } else {
        return this.maxPrecision[1];
      }
    } else {
      return this.maxPrecision[1];
    }
  }

  private getNextFeatureId() {
    return ++this.indexId;
  }

  private addCustomId(featureId: string) {
    const id = this.getNextFeatureId();
    this.draw.setFeatureProperty(featureId, 'arlas_id', id);
    this.customIds.set(id, featureId);
  }
}

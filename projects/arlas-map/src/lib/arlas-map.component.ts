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

import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Feature, FeatureCollection } from '@turf/helpers';
import { BasemapStyle } from './basemaps/basemap.config';
import {
  ArlasMapOffset, AbstractArlasMapGL, MapConfig,
  ZOOM_IN, ZOOM_OUT, RESET_BEARING, CROSS_LAYER_PREFIX
} from './map/AbstractArlasMapGL';
import { IconConfig, ControlPosition } from './map/model/controls';
import { AoiDimensions } from './draw/draw.models';
import { LegendData } from './legend/legend.config';
import { MapExtent } from './map/model/extent';
import { ArlasMapSource } from './map/model/sources';
import { getLayerName, MapLayers } from './map/model/layers';
import { AbstractDraw } from './draw/AbstractDraw';
import { finalize, fromEvent, Subject, Subscription } from 'rxjs';
import { VisualisationSetConfig } from './map/model/visualisationsets';
import { MapboxAoiDrawService } from './draw/draw.service';
import { BasemapService } from './basemaps/basemap.service';
import { TranslateService } from '@ngx-translate/core';
import { ArlasBasemaps } from './basemaps/basemaps.model';
import { ArlasMapService } from './map/service/arlas-map.service';
import cleanCoords from '@turf/clean-coords';
import { ARLAS_VSET } from './map/model/layers';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { OnMoveResult } from './map/model/map';
import { MapLogicService } from './arlas-map-logic.service';
import { latLngToWKT } from './map/tools';
import { ElementIdentifier } from 'arlas-web-components';

@Component({
  selector: 'arlas-map',
  templateUrl: './arlas-map.component.html',
  styleUrls: ['./arlas-map.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ArlasMapComponent implements OnInit {

  /** Map instance. */
  public map: AbstractArlasMapGL;
  /** Draw instance. */
  public draw: AbstractDraw;
  /** Whether the legend is visible (open) or not.*/
  public legendOpen = true;
  /** DEAD CODE TO REMOVE. KEPT TO THE END OF REFACTOR !!! */
  private index: any;
  /** Used to clear geojson sources. */
  public emptyData: FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  };

  /** Whether the list of basemaps is shown. */
  public showBasemapsList = false;

  /** Visibility status of each visualisation set*. */
  public visibilityStatus = new Map<string, boolean>();
  /** Subscribtion to protomaps basemaps change. Should be unsbscribed when this component is destroyed. */
  protected offlineBasemapChangeSubscription!: Subscription;


  /** ------------------------------------------------------- VISUAL SEPERATOR ----------------------------------------- */


  /** ANGULAR INPUTS */

  /** @description Html identifier given to the map container (it's a div ;))*/
  @Input() public id = 'mapgl';
  /** @description An object with noth,east,south,west properies which represent an offset in pixel */
  /** Origin is top-left and x axe is west to east and y axe north to south.*/
  @Input() public offset: ArlasMapOffset = { north: 0, east: 0, south: 0, west: 0 };

  /** --- LAYERS */

  /** @description List of configured (by the builder) layers. */
  @Input() public mapLayers: MapLayers<unknown>;

  /** --- SCALE & COORDINATES */

  /** @description Whether the map scale is displayed. */
  @Input() public displayScale = true;
  /** @description Maximim width in pixels that the map scale could take. */
  @Input() public maxWidthScale = 100;
  /** @description Unit display for the map scale. */
  @Input() public unitScale = 'metric';
  /** @description Whether to display the coordinates of the mouse while moving. */
  @Input() public displayCurrentCoordinates = false;
  /** @description If true, the coordinates values are wrapped between -180 and 180. */
  @Input() public wrapLatLng = true;

  /** --- BASEMAPS */

  /** @description Default basemap to display. */
  @Input() public defaultBasemapStyle: BasemapStyle;
  /** @description List of available basemaps. */
  @Input() public basemapStyles = new Array<BasemapStyle>();

  /** --- INITIAL MAP VIEW : ZOOMs, CENTER, BOUNDS */

  /** @description Zoom of the map when it's initialized. */
  @Input() public initZoom = 2;
  /** @description Max zoom of the map. */
  @Input() public maxZoom = 22;
  /** @description Min zoom of the map. */
  @Input() public minZoom = 0;
  /** @description Coordinates of the map's centre when it's first loaded. */
  @Input() public initCenter: [number, number] = [2.1972656250000004, 45.706179285330855];

  /** --- BOUNDS TO FIT STRATEGY */

  /** @description Bounds that the view map fits. It's an array of two corners. */
  /** Each corner is an lat-long positio. For example: boundsToFit = [[30.51, -54.3],[30.57, -54.2]] */
  @Input() public boundsToFit: Array<Array<number>>;
  /** @description The padding added in the top-left and bottom-right corners of a map container that shouldn't be accounted */
  /** for when setting the view to fit bounds.*/
  @Input() public fitBoundsOffSet: [number, number] = [0, 0];
  /**  @description Padding value applied around a fitBounds to fully show the area targeted. */
  @Input() public fitBoundsPadding = 10;
  /** @description The maximum zoom level so that the bounds fit the map view. */
  @Input() public fitBoundsMaxZoom = 22;

  /** --- DATA LOADING STRATEGIES */

  /** @description Margin applied to the map extent. Data will be fetched in all this extent. */
  @Input() public margePanForLoad: number;
  /** @description Margin applied to the map extent. Before loading data,
   * the components checks first if there are features already loaded in this extent. */
  @Input() public margePanForTest: number;
  /** @description A callback run before the Map makes a request for an external URL/ */
  @Input() public transformRequest: unknown /** TransformRequestFunction or RequestTransformRequest */;

  /** --- MAP INTERACTION */

  /** @description Feature to highlight. */
  @Input() public featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; };
  /** @description List of feature to select. */
  @Input() public featuresToSelect: Array<ElementIdentifier>;

  /** --- SOURCES */

  /** @description List of sources to add to the map. */
  @Input() public mapSources: Array<ArlasMapSource<unknown>>;
  /** @description Subject to which the component subscribes to redraw on the map the `data` of the given `source`. */
  @Input() public redrawSource = new Subject<{ source: string; data: Feature<GeoJSON.Geometry>[]; }>();
  /** @description List of data sources names that should be added to the map. Sources should be of type `geojson`. */
  @Input() public dataSources: Set<string>;

  /** --- DRAW */

  /**  @description Options object for draw tools : https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#options */
  @Input() public drawOption: any = {};
  /** @description Features drawn at component start */
  @Input() public drawData: FeatureCollection<GeoJSON.Geometry> = Object.assign({}, this.emptyData);
  /** @description Whether the draw tools are activated. */
  @Input() public drawButtonEnabled = false;
  /** @description Maximum number of vertices allowed for a polygon. */
  @Input() public drawPolygonVerticesLimit: number;
  /** @description Whether the drawing buffer is activated */
  /** If true , the map's canvas can be exported to a PNG using map.getCanvas().toDataURL(). Default: false */
  @Input() public preserveDrawingBuffer = false;

  /** --- ATTRIBUTION */

  /** @description Position of the map attribution. */
  @Input() public mapAttributionPosition: ControlPosition = 'bottom-right';

  /** --- MAP ICONS */

  /** @description List of icons to add to the map and that can be used in layers. */
  @Input() public icons: Array<IconConfig>;

  /** --- LEGEND AND VISUALISATIONS */

  /** @description Subject of [collection, [field, legendData]] map. The map subscribes to it to keep */
  /** the legend updated with the data displayed on the map. */
  @Input() public legendUpdater: Subject<Map<string, Map<string, LegendData>>> = new Subject();
  /** @description Subject of [layerId, boolean] map. The map subscribes to it to keep */
  /** the legend updated with the visibility of the layer.*/
  @Input() public visibilityUpdater: Subject<Map<string, boolean>> = new Subject();
  /** @description List of visualisation sets. A Visualisation set is an entity where to group layers together. */
  /** If a visualisation set is enabled, all the layers in it can be displayed on the map, otherwise the layers are removed from the map. */
  @Input() public visualisationSetsConfig: Array<VisualisationSetConfig>;


  /** ------------------------------------------------------- VISUAL SEPERATOR ----------------------------------------- */


  /** ANGULAR OUTPUTS */

  /** @description Emits true after the map is loaded and all sources & layers are added. */
  @Output() public onMapLoaded: Subject<boolean> = new Subject<boolean>();

  /** @description Emits the map extent on Tab (which tab ???) close/refresh. */
  @Output() public onMapClosed: EventEmitter<MapExtent> = new EventEmitter<MapExtent>();

  /** @description @deprecated Emits the event of moving the map. */
  @Output() public onMove: EventEmitter<OnMoveResult> = new EventEmitter<OnMoveResult>();

  /** @description Emits the visible visualisations ids */
  @Output() public visualisations: EventEmitter<Set<string>> = new EventEmitter();

  /** @description Emits the event of clicking on a feature. */
  @Output() public onFeatureClick = new EventEmitter<{ features: Array<GeoJSON.Feature<GeoJSON.Geometry>>; point: [number, number]; }>();

  /** @description Emits the event of hovering feature. */
  @Output() public onFeatureHover = new EventEmitter<{ features: Array<GeoJSON.Feature<GeoJSON.Geometry>>; point: [number, number]; } | {}>();

  /** @description Emits the geojson of an aoi added to the map. */
  @Output() public onAoiChanged: EventEmitter<FeatureCollection<GeoJSON.Geometry>> = new EventEmitter();

  /** @description Emits the the dimensions of the polygon/bbox that is being drawn. */
  @Output() public onAoiEdit: EventEmitter<AoiDimensions> = new EventEmitter();

  /** @description Emits the geojson of an aoi added to the map. */
  @Output() public onBasemapChanged: Subject<boolean> = new Subject();

  /** @description Emits which layers are displayed in the Legend. */
  @Output() public legendVisibiltyStatus: Subject<Map<string, boolean>> = new Subject();

  /** @description  Notifies that the user wants to download the selected layer */
  @Output() public downloadSourceEmitter: Subject<{
    layerId: string;
    layerName: string;
    collection: string;
    sourceName: string;
    downloadType: string;
  }> = new Subject();

  protected ICONS_BASE_PATH = 'assets/icons/';


  /** ------------------------------------------------------- VISUAL SEPERATOR - INIT ----------------------------------------- */

  public constructor(private drawService: MapboxAoiDrawService,
    private basemapService: BasemapService, private translate: TranslateService,
    protected mapService: ArlasMapService,
    protected mapLogicService: MapLogicService) {
  }

  public ngOnInit() {
    this.offlineBasemapChangeSubscription = this.basemapService.protomapBasemapAdded$.subscribe(() => this.reorderLayers());
  }

  public ngAfterViewInit() {
    /** init values */
    if (!this.initCenter) {
      this.initCenter = [0, 0];
    }
    if (this.initZoom === undefined || this.initZoom === null) {
      this.initZoom = 3;
    }
    if (this.maxZoom === undefined || this.maxZoom === null) {
      this.maxZoom = 22;
    }
    if (this.minZoom === undefined || this.minZoom === null) {
      this.maxZoom = 0;
    }
    /** BASEMAPS */
    if (typeof this.defaultBasemapStyle.styleFile === 'string') {
      this.defaultBasemapStyle.url = this.defaultBasemapStyle.styleFile;
    }
    this.basemapStyles.forEach(bm => {
      if (typeof bm.styleFile === 'string') {
        bm.url = (bm.styleFile as string);
      }
    });
    this.basemapService.setBasemaps(new ArlasBasemaps(this.defaultBasemapStyle, this.basemapStyles));
    this.basemapService.fetchSources$()
      .pipe(finalize(() => this.declareMap()))
      .subscribe();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.map && this.map.getMapProvider() !== undefined) {
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
      if (changes['featureToHightLight'] !== undefined
        && changes['featureToHightLight'].currentValue !== changes['featureToHightLight'].previousValue) {
        const featureToHightLight = changes['featureToHightLight'].currentValue;
        this.highlightFeature(featureToHightLight);
      }
      if (changes['featuresToSelect'] !== undefined
        && changes['featuresToSelect'].currentValue !== changes['featuresToSelect'].previousValue) {
        const featuresToSelect = changes['featuresToSelect'].currentValue;
        this.selectFeatures(featuresToSelect);
      }
    }
  }

  /** ------------------------------------------------------- VISUAL SEPERATOR - MAP ----------------------------------------- */

  /** If transformRequest' @Input was not set, set a default value : a function that maintains the same url */
  public initTransformRequest() {
    if (!this.transformRequest) {
      this.transformRequest = this.mapService.getInitTransformRequest();
    }
  }

  /** Zooms on clicked feature from map event e. */
  public zoomOnClick(e) {
    if (e.features[0].properties.cluster_id !== undefined) {
      // TODO: should check the this.index is set with good value
      const expansionZoom = this.index.getClusterExpansionZoom(e.features[0].properties.cluster_id);
      this.mapService.flyTo(e.lngLat.lat, e.lngLat.lng, expansionZoom, this.map);
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
      this.mapService.flyTo(e.lngLat.lat, e.lngLat.lng, newZoom, this.map);
    }
  }

  protected queryRender(e) {
    const hasCrossOrDrawLayer = this.mapService.queryFeatures(e, this.map, CROSS_LAYER_PREFIX);
    if (!this.drawService.isDrawingBbox && !this.drawService.isDrawingPolygon
      && !this.drawService.isDrawingCircle && !this.drawService.isInSimpleDrawMode && !hasCrossOrDrawLayer) {
      this.onFeatureClick.next({ features: e.features, point: [e.lngLat.lng, e.lngLat.lat] });
    }
  }

  /** Adds the custom icons given in the component's input */
  public addIcons() {
    if (this.icons) {
      this.icons.forEach(icon => {
        const iconName = icon.path.split('.')[0];
        const iconPath = this.ICONS_BASE_PATH + icon.path;
        const iconErrorMessage = 'The icon "' + this.ICONS_BASE_PATH + icon.path + '" is not found';
        this.mapService.addImage(iconName, iconPath, this.map, iconErrorMessage, { 'sdf': icon.recolorable });
      });

    }
  }

  public declareMap() {
    this.initTransformRequest();
    const config: MapConfig<unknown> = {
      displayCurrentCoordinates: this.displayCurrentCoordinates,
      fitBoundsPadding: this.fitBoundsPadding,
      margePanForLoad: this.margePanForLoad,
      margePanForTest: this.margePanForTest,
      offset: this.offset,
      wrapLatLng: this.wrapLatLng,
      maxWidthScale: this.maxWidthScale,
      unitScale: this.unitScale,
      mapProviderOptions: {
        container: this.id,
        style: this.basemapService.getInitStyle(this.basemapService.basemaps.getSelected()),
        center: this.initCenter,
        zoom: this.initZoom,
        maxZoom: this.maxZoom,
        minZoom: this.minZoom,
        renderWorldCopies: true,
        preserveDrawingBuffer: this.preserveDrawingBuffer,
        locale: {
          'NavigationControl.ZoomIn': this.translate.instant(ZOOM_IN),
          'NavigationControl.ZoomOut': this.translate.instant(ZOOM_OUT),
          'NavigationControl.ResetBearing': this.translate.instant(RESET_BEARING)
        },
        pitchWithRotate: false,
        transformRequest: this.transformRequest,
        attributionControl: false,
      },
      controls: {
        mapAttribution: {
          enable: true,
          position: this.mapAttributionPosition
        },
        scale: {
          enable: this.displayScale
        },
        navigationControl: {
          enable: true
        },
        pitchToggle: {
          enable: true,
          config: { bearing: -20, pitch: 70, minpitchzoom: 11 }
        }
      }
    };
    this.map = this.mapService.createMap(config);
    fromEvent(window, 'beforeunload').subscribe(() => {
      this.onMapClosed.next(this.map.getMapExtend());
    });



    /**
     *  The other on load initialisation releated with the map are in
     *  ArlasMapgl in initOnLoad method
     *  the code below can be executed in as the method executed in
     *  this part do not need to be executed in specific order
     *
     *  !! If you see a better approche let me know.
     */

    this.map.onCustomEvent('beforeOnLoadInit', () => {
      this.basemapService.declareProtomapProtocol(this.map);
      this.basemapService.addProtomapBasemap(this.map);
      this.addIcons();
      this.mapLogicService.declareArlasDataSources(this.dataSources, this.emptyData, this.map);
      this.mapLogicService.declareBasemapSources(this.mapSources, this.map);
      this.mapLogicService.addArlasDataLayers(this.visualisationSetsConfig, this.mapLayers, this.map);
      this.listenToLayersEvents();
    });

    this.mapService.onMapEvent('load', this.map, () => {
      if (this.mapLayers !== null) {
        this.visibilityUpdater.subscribe(visibilityStatus => {
          this.mapLogicService.updateVisibility(visibilityStatus, this.visualisationSetsConfig, this.map);
        });
      }
      this.onMapLoaded.next(true);
    });

    this.map.onMoveEnd(this.mapLogicService.visualisationsSets).subscribe((moveResult => {
      this.onMove.next(moveResult);
    }));

    if (!!this.redrawSource) {
      this.redrawSource.subscribe(sd => {
        this.mapService.setDataToGeojsonSource(this.mapService.getSource(sd.source, this.map), {
          'type': 'FeatureCollection',
          'features': sd.data
        });
      });
    }
  }

  /**
   * Listens to events on mapLayers input (configured layers).
   */
  public listenToLayersEvents() {
    /** Zooms on the clicked feature of the given layers. */
    this.mapLayers.events.zoomOnClick.forEach(layerId => {
      this.mapService.onLayerEvent('click', this.map, layerId, (e) => this.zoomOnClick(e));
    });
    this.mapLayers.events.onHover.forEach(layerId => {
      /** Emits the hovered feature on mousemove. */
      this.mapService.onLayerEvent('mousemove', this.map, layerId, (e) =>
        this.onFeatureHover.next({ features: e.features, point: [e.lngLat.lng, e.lngLat.lat] }));
      /** Emits an empty object on mouse leaving a feature. */
      this.mapService.onLayerEvent('mouseleave', this.map, layerId, (e) =>
        this.onFeatureHover.next({}));
    });
    /** Emits the clicked on feature. */
    this.mapLayers.events.emitOnClick.forEach(layerId => {
      this.mapService.onLayerEvent('click', this.map, layerId, (e) =>
        this.queryRender(e));
    });
    const drawPolygonLayers = [
      'gl-draw-polygon-stroke-inactive',
      'gl-draw-polygon-stroke-active',
      'gl-draw-polygon-stroke-static'
    ].map(layer => ['.cold', '.hot']
      .map(id => layer.concat(id)))
      .reduce((p, ac) => ac.concat(p), []);
    /** Sets mouse cursor on drawn features */
    drawPolygonLayers.forEach(layerId => {
      this.mapService.onLayerEvent('mousemove', this.map, layerId, (e) =>
        this.mapService.setMapCursor(this.map, 'pointer'));
      this.mapService.onLayerEvent('mouseleave', this.map, layerId, (e) =>
        this.mapService.setMapCursor(this.map, ''));
    });
  }

  /** ------------------------------------------------------- VISUAL SEPERATOR - LAYERS ----------------------------------------- */

  /** Sets the layers order according to the order of `visualisationSetsConfig` list*/
  public reorderLayers() {
    this.mapLogicService.reorderLayers(this.visualisationSetsConfig, this.map);
  }

  /** ------------------------------------------------------- VISUAL SEPERATOR - DRAWING ----------------------------------------- */



  /**
 * @description Display the basemapswitcher
 */
  public showBasemapSwitcher() {
    this.showBasemapsList = true;
  }

  public onChangeBasemapStyle() {
    this.onBasemapChanged.next(true);
  }

  /**
   * Return the polygons geometry in WKT or GeoJson given the mode
   * @param mode : string
   */
  public getAllPolygon(mode: 'wkt' | 'geojson') {
    let polygon;
    if (mode === 'wkt') {
      polygon = latLngToWKT(this.draw.getAll().features.filter(f => this.drawService.isPolygon(f) ||
        this.drawService.isCircle(f)).map(f => cleanCoords(f)));
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getAll().features.filter(f => this.drawService.isPolygon(f) ||
          this.drawService.isCircle(f)).map(f => cleanCoords(f))
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
      polygon = latLngToWKT(this.draw.getSelected().features.filter(f => this.drawService.isPolygon(f) ||
        this.drawService.isCircle(f)));
    } else {
      polygon = {
        'type': 'FeatureCollection',
        'features': this.draw.getSelected().features.filter(f => this.drawService.isPolygon(f) ||
          this.drawService.isCircle(f))
      };
    }
    return polygon;
  }


  /**
   * Update the visibility status of the layer and emit that update
   * @param visualisation visualisation set name
   * @param l layer id
   * @param visible whether the layer is enabled and visible in the visualisation set
   */
  public emitLegendVisibility(visualisation: string, l: string, visible: boolean): void {
    // Copy the map so the pipe updates the values
    this.visibilityStatus = new Map(this.visibilityStatus);
    this.visibilityStatus.set(visualisation + ARLAS_VSET + l, visible);
    this.legendVisibiltyStatus.next(this.visibilityStatus);
  }

  public emitVisualisations(visualisationName: string) {
    const layers = this.mapLogicService.updateLayoutVisibility(visualisationName, this.visualisationSetsConfig, this.map);
    this.visualisations.emit(layers);
    this.reorderLayers();
  }

  public downloadLayerSource(downaload: { layer: any; downloadType: string; }): void {
    const downlodedSource = {
      layerId: downaload.layer.id,
      layerName: getLayerName(downaload.layer.id),
      collection: downaload.layer.metadata.collection,
      sourceName: downaload.layer.source as string,
      downloadType: downaload.downloadType
    };
    this.downloadSourceEmitter.next(downlodedSource);
  }

  /** puts the visualisation set list in the new order after dropping */
  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.visualisationSetsConfig, event.previousIndex, event.currentIndex);
    this.reorderLayers();
  }

  /** puts the layers list in the new order after dropping */
  public dropLayer(event: CdkDragDrop<string[]>, visuName: string) {
    const layers = Array.from(this.mapLogicService.findVisualisationSetLayer(visuName, this.visualisationSetsConfig));
    moveItemInArray(layers, event.previousIndex, event.currentIndex);
    this.mapLogicService.setVisualisationSetLayers(visuName, layers, this.visualisationSetsConfig);
    this.reorderLayers();
  }
  public hideBasemapSwitcher() {
    this.showBasemapsList = false;
  }
  /**
   * Fit to given bounds. Options are for padding.
   * @param bounds Bounds of the map to fit to.
   */
  public fitToPaddedBounds(bounds: any) {
    this.map.fitToPaddedBounds(bounds);
  }
  /**
   * Centers the map to the given latitude/longitude coordinates.
   * @param lngLat Latitude/longitude coordinates.
   */
  public moveToCoordinates(lngLat: [number, number]) {
    this.map.setCenter(lngLat);
  }
  /** Highlights, in all data sources,the feature(s) having the given elementIdentifier */
  private highlightFeature(featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; }) {
    this.mapLogicService.highlightFeature(this.mapLayers, this.map, featureToHightLight);
  }
  /** Selects, in all data sources,the feature(s) having the given elementIdentifier */
  private selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    this.mapLogicService.selectFeatures(this.mapLayers, this.map, elementToSelect);
  }
  /** Selects, in all data sources, all the features having the given elementIdentifiers and under the given collection.
   * @param features list of features identifiers.
   * @param collection data collection (metadata of the data source).
  */
  public selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string) {
    this.mapLogicService.selectFeaturesByCollection(this.mapLayers, this.map, features, collection);
  }
  /** Destroys all the components subscriptions. */
  public ngOnDestroy(): void {
    if (!!this.offlineBasemapChangeSubscription) {
      this.offlineBasemapChangeSubscription.unsubscribe();
    }
    if (!!this.map) {
      this.map.unsubscribeEvents();
    }
  }
}

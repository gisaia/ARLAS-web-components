import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { Feature, FeatureCollection, Geometry, Polygon, polygon } from '@turf/helpers';
import { BasemapStyle } from './basemaps/basemap.config';
import { ArlasMapOffset, AbstractArlasMapGL, ElementIdentifier, MapConfig, ZOOM_IN, ZOOM_OUT, RESET_BEARING } from './map/AbstractArlasMapGL';
import { IconConfig, ControlPosition, DrawControlsOption } from './map/model/controls';
import { AoiDimensions, BboxDrawCommand } from './draw/draw.models';
import { LegendData } from './legend/legend.config';
import { MapExtent } from './map/model/extent';
import { ArlasMapSource } from './map/model/sources';
import { getLayerName, MapLayers } from './map/model/layers';
import { AbstractDraw } from './draw/AbstractDraw';
import { finalize, fromEvent, Subject, Subscription } from 'rxjs';
import { VisualisationSetConfig } from './map/model/visualisationsets';
import { HttpClient } from '@angular/common/http';
import { MapboxAoiDrawService } from './draw/draw.service';
import { BasemapService } from './basemaps/basemap.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { ArlasBasemaps } from './basemaps/basemaps.model';
import { ArlasMapService } from './arlas-map.service';
import * as styles from './draw/themes/default-theme'
import limitVertexDirectSelectMode from './draw/modes/LimitVertexDirectSelectMode';
import validGeomDrawPolygonMode from './draw/modes/ValidGeomDrawPolygonMode';
import { circleMode } from './draw/modes/circles/circle.mode';
import radiusCircleMode from './draw/modes/circles/radius.circle.mode';
import stripMode from './draw/modes/strip/strip.mode';
import { stripDirectSelectMode } from './draw/modes/strip/strip.direct.mode';
import directModeOverride from './draw/modes/directSelectOverride';
import simpleSelectModeOverride from './draw/modes/simpleSelectOverride';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import cleanCoords from '@turf/clean-coords';
import centroid from '@turf/centroid';
import { ARLAS_VSET } from './map/model/layers';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { OnMoveResult } from './map/model/map';
import { MapLayerMouseEvent } from './map/model/events';

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
  private emptyData: FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  };
  /** Set to true when the user is drawing a bbox. */
  protected isDrawingBbox = false;
  /** Set to true when the user is drawing a circle. */
  protected isDrawingCircle = false;
  /** Set to true when the user is drawing a strip. */
  protected isDrawingStrip = false;
  /** Set to true when the user is drawing a polygon. */
  protected isDrawingPolygon = false;
  /** Set to true when the user is in simple draw mode. */
  protected isInSimpleDrawMode = false;
  /** Set to true when the drawn geometry is selected. */
  public isDrawSelected = false;
  /** Set to true when the selected drawn geometry is changed. */
  protected drawSelectionChanged = false;
  /** Number of drawn vertices (incremented in draw mode). Reset to 0 when the drawing has finished. */
  public nbPolygonVertice = 0;
  /** Number of clicks while drawing !! How is it different from the var above ??? */
  public drawClickCounter = 0;
  /**  !! TODO description */
  public polygonlabeldata: FeatureCollection<GeoJSON.Geometry> = Object.assign({}, this.emptyData);
  /** Whether the list of basemaps is shown. */
  public showBasemapsList = false;
  /** Drawn geometry's state when editing/updating. */
  protected savedEditFeature = null;
  /** Map container Html element? */
  protected canvas: HTMLElement;
  /** Canvas of the bbox while being drawn. This variable is set to undefined when the draw ends. */
  private box: HTMLElement;
  /** Point coordinates when the bbox drawing starts*/
  protected start: any /** it's either mapbox or maplibre Point */;
  /** Point coordinates when the bbox drawing is being drawn. Changes at move.*/
  protected current: any;
  /** Message shown to explain how to end drawing. */
  public FINISH_DRAWING = marker('Double click to finish drawing');
  /** Html element that holds the FINISH_DRAWING message. */
  protected finishDrawTooltip: HTMLElement;

  /** Visibility status of each visualisation set*. */
  public visibilityStatus = new Map<string, boolean>();
  /** Subscribtion to protomaps basemaps change. Should be unsbscribed when this component is destroyed. */
  protected offlineBasemapChangeSubscription!: Subscription;
  /** Subscribtion to draw changes in order to display the dimensions. Should be unsbscribed when this component is destroyed. */
  private aoiEditSubscription: Subscription;
  /** Subscribtion to bbox drawing. Should be unsbscribed when this component is destroyed. */
  private drawBboxSubscription: Subscription;



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

  /** @description Margin applied to the map extent. Before loading data, the components checks first if there are features already loaded in this extent. */
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

  /** @description Emits the visualisations !!! TODO description !!! */
  @Output() public visualisations: EventEmitter<Set<string>> = new EventEmitter();

  /** @description Emits the event of clicking on a feature. !!! TODO : fix spelling !!!*/
  @Output() public onFeatureClic = new EventEmitter<{ features: Array<GeoJSON.Feature<GeoJSON.Geometry>>; point: [number, number]; }>();

  /** @description Emits the event of hovering feature. !!! TODO : fix spelling !!! */
  @Output() public onFeatureOver = new EventEmitter<{ features: Array<GeoJSON.Feature<GeoJSON.Geometry>>; point: [number, number]; } | {}>();

  /** @description Emits the geojson of an aoi added to the map. */
  @Output() public onAoiChanged: EventEmitter<FeatureCollection<GeoJSON.Geometry>> = new EventEmitter();

  /** @description Emits the the dimensions of the polygon/bbox that is being drawn. */
  @Output() public onAoiEdit: EventEmitter<AoiDimensions> = new EventEmitter();

  /** @description Emits the geojson of an aoi added to the map. */
  @Output() public onBasemapChanged: Subject<boolean> = new Subject();

  /** @description Emits which layers are displayed in the Legend. */
  @Output() public legendVisibiltyStatus: Subject<Map<string, boolean>> = new Subject();

  /** @description !!! todo !!! */
  @Output() public downloadSourceEmitter: Subject<{
    layerId: string;
    layerName: string;
    collection: string;
    sourceName: string;
    downloadType: string;
  }> = new Subject();





  /** ------------------------------------------------------- VISUAL SEPERATOR - INIT ----------------------------------------- */







  public constructor(private http: HttpClient, private drawService: MapboxAoiDrawService,
    private basemapService: BasemapService, private _snackBar: MatSnackBar, private translate: TranslateService,
    protected mapService: ArlasMapService) {
    console.log('ummm');
    this.aoiEditSubscription = this.drawService.editAoi$.subscribe(ae => this.onAoiEdit.emit(ae));
    this.drawBboxSubscription = this.drawService.drawBbox$.subscribe({
      next: (bboxDC: BboxDrawCommand) => {
        this.drawBbox(bboxDC.east, bboxDC.south, bboxDC.west, bboxDC.north);
      }
    });

  }

  public ngOnInit() {
    this.offlineBasemapChangeSubscription = this.basemapService.protomapBasemapAdded$.subscribe(() => this.reorderLayers());
    console.log('ummm init');
  }

  public ngAfterViewInit() {
    /** init values */
    console.log('ummm after');
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
      if (changes['drawData'] !== undefined) {
        this.drawData = changes['drawData'].currentValue;
        const centroides = new Array();
        this.drawData.features.forEach(feature => {
          const poly = polygon((feature.geometry as Polygon).coordinates);
          const cent = centroid(poly);
          cent.properties.arlas_id = feature.properties.arlas_id;
          centroides.push(cent);
        });
        this.polygonlabeldata = {
          type: 'FeatureCollection',
          features: centroides
        };
        if (!this.drawSelectionChanged) {
          this.drawService.addFeatures(this.drawData, /** deleteOld */ true);
        }
        this.drawSelectionChanged = false;
        if (this.map.getSource(this.map.POLYGON_LABEL_SOURCE) !== undefined) {
          (this.map.getSource(this.map.POLYGON_LABEL_SOURCE) as any).setData(this.polygonlabeldata);
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

  /** TODO comment */
  public defaultOnZoom(e) {
    if (e.features[0].properties.cluster_id !== undefined) {
      // TODO: should check the this.index is set with good value
      const expansionZoom = this.index.getClusterExpansionZoom(e.features[0].properties.cluster_id);
      this.map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat] }, expansionZoom);
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
      this.map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: newZoom },);
    }
  }

  protected queryRender(e, map: AbstractArlasMapGL, ) {
    const hasCrossOrDrawLayer = map.hasCrossOrDrawLayer(e);
    if (!this.isDrawingBbox && !this.isDrawingPolygon && !this.isDrawingCircle && !this.isInSimpleDrawMode && !hasCrossOrDrawLayer) {
      map.onEvent(e);
    }
  }

  public declareMap() {
    console.log('declaaaring')
    this.initTransformRequest();
    console.log('traaans')
    const config: MapConfig<unknown> = {
      displayCurrentCoordinates: this.displayCurrentCoordinates,
      fitBoundsPadding: this.fitBoundsPadding,
      margePanForLoad: this.margePanForLoad,
      margePanForTest: this.margePanForTest,
      visualisationSetsConfig: this.visualisationSetsConfig,
      offset: this.offset,
      wrapLatLng: this.wrapLatLng,
      mapLayers: this.mapLayers,
      dataSources: this.dataSources,
      icons: this.icons,
      maxWidthScale: this.maxWidthScale,
      mapSources: this.mapSources,
      unitScale: this.unitScale,
      mapLayersEventBind: {
        zoomOnClick: [{ event: 'click', fn: this.defaultOnZoom }],
        onHover: [
          {
            event: 'mousemove',
            fn: (e) => {
              this.onFeatureOver.next({ features: e.features, point: [e.lngLat.lng, e.lngLat.lat] });
            }
          },
          {
            event: 'mouseleave',
            fn: (e) => {
              this.onFeatureOver.next({});
            }
          }
        ],
        emitOnClick: [
          {
            event: 'click',
            fn: this.queryRender
          }],
      },
      customEventBind: (m: AbstractArlasMapGL) => this.mapService.getCustomEventsToDrawLayers(m),
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
    console.log('declare');
    this.map = this.mapService.createMap(config);
    console.log(this.map);
    this.map.eventEmitter$.subscribe({
      next: (e: MapLayerMouseEvent) => {
        if (e.type === 'click') {
          this.onFeatureClic.next({ features: e.features, point: [e.lngLat.lng, e.lngLat.lat] });
        }
      }
    })
    fromEvent(window, 'beforeunload').subscribe(() => {
      this.onMapClosed.next(this.map.getMapExtend());
    });

    this.finishDrawTooltip = document.getElementById('polygon-finish-draw-tooltip');

    const drawStyles = styles.default;
    const drawOptions = {
      ...this.drawOption,
      ...{
        styles: drawStyles,
        modes: {
          static: StaticMode,
          limit_vertex: limitVertexDirectSelectMode,
          draw_polygon: validGeomDrawPolygonMode,
          draw_circle: circleMode,
          draw_radius_circle: radiusCircleMode,
          draw_strip: stripMode,
          direct_strip: stripDirectSelectMode,
          direct_select: directModeOverride,
          simple_select: simpleSelectModeOverride
        }
      }
    };
    this.draw = this.mapService.createDraw(drawOptions, this.drawButtonEnabled, this.map);
    this.draw.setMode('DRAW_CIRCLE', 'draw_circle');
    this.draw.setMode('DRAW_RADIUS_CIRCLE', 'draw_radius_circle');
    this.draw.setMode('DRAW_STRIP', 'draw_strip');
    this.draw.setMode('DIRECT_STRIP', 'direct_strip');

    // TODO : to have to add event override
    const drawControlConfig: DrawControlsOption = {
      draw: { control: this.draw },
      addGeoBox: {
        enable: true,
        overrideEvent:
        {
          event: 'click',
          fn: this.addGeoBox
        }
      },
      removeAois: {
        enable: true,
        overrideEvent: { event: 'click', fn: this.removeAois }
      }
    };
    this.map.initDrawControls(drawControlConfig);
    this.drawService.setDraw(this.draw);
    /**
     *  The other on load initialisation releated with the map are in
     *  ArlasMapgl in initOnLoad method
     *  the code below can be executed in as the method executed in
     *  this part do not need to be executed in specific order
     *
     *  !! If you see a better approche let me know.
     */

    this.map.onCustomEvent('beforeOnLoadInit', () => {
      // TODO: should change the
      this.basemapService.declareProtomapProtocol(this.map);
      this.basemapService.addProtomapBasemap(this.map);
    });

    this.map.on('load', () => {

      this.draw.changeMode('static');
      if (this.mapLayers !== null) {
        this.visibilityUpdater.subscribe(visibilityStatus => {
          this.map.updateVisibility(visibilityStatus);
        });
      }

      this.canvas = this.map.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);
      this.draw.on('draw.create', (e) => {
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAllFeatures().filter(fc =>
              this.drawService.isValidPolygon(fc) ||
              this.drawService.isValidCircle(fc)
            ).map(f => cleanCoords(f))
          });
      });

      this.draw.on('draw.update', (e) => {
        if (e) {
          const features = e.features;
          if (features && features.length > 0) {
            this.savedEditFeature = Object.assign({}, features[0]);
            this.savedEditFeature.coordinates = [[]];
            features[0].geometry.coordinates[0].forEach(f => this.savedEditFeature.coordinates[0].push(f));
          }
        }
      });
      this.draw.on('draw.delete', (e) => {
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAllFeatures().filter(fc =>
              this.drawService.isPolygon(fc) ||
              this.drawService.isCircle(fc)
            ).map(f => cleanCoords(f))
          });
      });

      const mouseMoveForDraw = (e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        this.finishDrawTooltip.style.top = (y + 20) + 'px';
        this.finishDrawTooltip.style.left = (x + 20) + 'px';
      };

      this.draw.onDrawOnClick((e) => {
        console.log('the fuck', e)
        if (this.drawClickCounter === 0) {
          window.addEventListener('mousemove', mouseMoveForDraw);
        }
        this.drawClickCounter++;
      });
      this.draw.onDrawOnStart((e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.map.setCursorStyle('');
      });
      this.draw.onDrawOnStop((e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.map.setCursorStyle('');
      });

      this.draw.onDrawInvalidGeometry((e) => {
        if (this.savedEditFeature) {
          const featureCoords = this.savedEditFeature.coordinates[0].slice();
          if (featureCoords[0][0] !== featureCoords[featureCoords.length - 1][0] ||
            featureCoords[0][1] !== featureCoords[featureCoords.length - 1][1]) {
            featureCoords.push(featureCoords[0]);
          }
          const currentFeature = {
            id: '',
            type: 'Feature',
            geometry: {
              'type': 'Polygon',
              'coordinates': [featureCoords]
            },
            properties: {}
          };
          currentFeature.id = this.savedEditFeature.id;
          currentFeature.properties = this.savedEditFeature.properties;
          this.draw.add(currentFeature);
        }
        this.openInvalidGeometrySnackBar();
        this.map.setCursorStyle('');
      });

      this.draw.onDrawEditSaveInitialFeature((edition) => {
        console.log('onDrawEditSaveInitialFeature', edition)
        this.savedEditFeature = Object.assign({}, edition.feature);
        this.savedEditFeature.coordinates = [[]];
        edition.feature.coordinates[0].forEach(c => this.savedEditFeature.coordinates[0].push(c));
      });

      this.draw.onDrawSelectionchange((e) => {
        console.log('onDrawSelectionchange', e)
        this.drawSelectionChanged = true;
        if (e.features.length > 0) {
          this.isDrawSelected = true;
        } else {
          this.savedEditFeature = null;
          this.isDrawSelected = false;
          this.onAoiChanged.next(
            {
              'type': 'FeatureCollection',
              'features': this.draw.getAllFeatures().filter(fc =>
                this.drawService.isValidPolygon(fc) ||
                this.drawService.isValidCircle(fc)
              ).map(f => cleanCoords(f))
            });
          this.isDrawingBbox = false;
          this.isDrawingPolygon = false;
          this.isDrawingCircle = false;
          this.isDrawingStrip = false;
          this.isInSimpleDrawMode = false;
          this.draw.changeMode('static');
          this.map.setCursorStyle('');
        }
      });
      this.draw.onDrawModeChange((e) => {
        this.isDrawingPolygon = e.mode === this.draw.getMode('DRAW_POLYGON');
        this.isDrawingStrip = e.mode === this.draw.getMode('DIRECT_STRIP');
        this.isDrawingCircle = e.mode === this.draw.getMode('DRAW_CIRCLE') || e.mode === this.draw.getMode('DRAW_RADIUS_CIRCLE');
        if (this.isDrawingPolygon || this.isDrawingCircle || this.isDrawingStrip || e.mode === 'static') {
          this.isInSimpleDrawMode = false;
        }
        if (e.mode === 'simple_select') {
          this.isInSimpleDrawMode = true;
        } else if (e.mode === 'static') {
          this.map.setCursorStyle('');
        } else if (e.mode === 'direct_select') {
          const selectedFeatures = this.draw.getSelectedFeatures();
          const selectedIds = this.draw.getSelectedIds();
          if (selectedFeatures && selectedIds && selectedIds.length > 0) {
            if (selectedFeatures[0].properties.source === 'bbox') {
              this.draw.changeMode('simple_select', {
                featureIds: [selectedIds[0]]
              });
              this.isInSimpleDrawMode = true;
            } else if (this.drawPolygonVerticesLimit && selectedFeatures[0].properties.meta !== 'strip') {
              this.draw.changeMode('limit_vertex', {
                featureId: selectedIds[0],
                maxVertexByPolygon: this.drawPolygonVerticesLimit,
                selectedCoordPaths: (selectedFeatures[0] as Feature<Geometry>).geometry.coordinates
              });
              this.isInSimpleDrawMode = false;
            } else if (this.drawPolygonVerticesLimit && selectedFeatures[0].properties.meta === 'strip') {
              this.draw.changeMode('direct_strip', {
                featureId: selectedIds[0],
                maxLength: selectedFeatures[0].properties.maxLength,
                halfSwath: selectedFeatures[0].properties.halfSwath,
              });
              this.isInSimpleDrawMode = false;
            }
          } else {
            this.isInSimpleDrawMode = false;
            this.map.setCursorStyle('');
          }
        }
      });

      this.map.on('click', (e) => {
        if (this.isDrawingCircle) {
          return;
        }

        if (this.isDrawingPolygon) {
          this.nbPolygonVertice++;
          if (this.nbPolygonVertice === this.drawPolygonVerticesLimit) {
            this.draw.changeMode('static');
            this.isDrawingPolygon = false;
            this.nbPolygonVertice = 0;
          }
        } else {
          this.nbPolygonVertice = 0;
          const features = this.map.queryRenderedFeatures(e.point);
          // edit polygon condition : no arlas feature && mapbox-gl-draw source present
          const editCondition = features.filter(f => f.layer.id?.indexOf('arlas') >= 0).length === 0 &&
            features.filter(f => f.source.startsWith('mapbox-gl-draw')).length > 0;
          if (editCondition) {
            const candidates = features.filter(f => f.source.startsWith('mapbox-gl-draw'));
            // edit only on click on the border of the polygon
            const candidatesProperties = candidates.filter(f => f.layer.id?.indexOf('stroke') >= 0)[0]?.properties;
            if (candidatesProperties && !!candidatesProperties.id) {
              if (candidatesProperties.user_meta === 'strip') {
                this.draw.changeMode('direct_strip', {
                  featureId: candidatesProperties.id,
                  maxLength: candidatesProperties.user_maxLength,
                  halfSwath: candidatesProperties.user_halfSwath
                });
                this.isInSimpleDrawMode = false;
              } else {
                this.draw.changeMode('simple_select', {
                  featureIds: [candidatesProperties.id]
                });
                this.isInSimpleDrawMode = true;
              }

            }
          }
        }
      });
      this.onMapLoaded.next(true);
    });

    this.map.onMoveEnd().subscribe((moveResult => {
      this.onMove.next(moveResult);
    }));

    // Mouse events
    this.map.on('mousedown', (e: mapboxgl.MapMouseEvent) => {
      this.drawService.startBboxDrawing();
    });
    this.map.on('mouseup', (e: mapboxgl.MapMouseEvent) => {
      this.drawService.stopBboxDrawing();
    });

    this.map.on('mousemove', (e: mapboxgl.MapMouseEvent) => {
      const lngLat = e.lngLat;
      if (this.isDrawingBbox || this.isDrawingPolygon) {
        this.map.setCursorStyle('crosshair');
        this.map.movelngLat = lngLat;
      }
      if (this.drawService.bboxEditionState.isDrawing) {
        const startlng: number = this.map.startlngLat.lng;
        const endlng: number = this.map.movelngLat.lng;
        const startlat: number = this.map.startlngLat.lat;
        const endlat: number = this.map.movelngLat.lat;
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
            source: 'bbox'
          },
          geometry: {
            type: 'Polygon',
            coordinates: coordinates
          }
        };
        this.drawService.emitDimensions(polygonGeojson as Feature);
      }
    });

    if (!!this.redrawSource) {
      this.redrawSource.subscribe(sd => {
        this.map.redrawSource(sd.source, sd.data);
      });
    }
  }











  /** ------------------------------------------------------- VISUAL SEPERATOR - LAYERS ----------------------------------------- */





  /** Sets the layers order according to the order of `visualisationSetsConfig` list*/
  public reorderLayers() {
    this.map.reorderLayers();
  }






  /** ------------------------------------------------------- VISUAL SEPERATOR - DRAWING ----------------------------------------- */




  private mousedown = (e) => {
    // Continue the rest of the function if we add a geobox.
    if (!this.isDrawingBbox) {
      return;
    }
    // Disable default drag zooming when we add a geobox.
    this.map.disableDragPan();
    // Call functions for the following events
    document.addEventListener('mousemove', this.mousemove);
    document.addEventListener('mouseup', this.mouseup);
    // Capture the first xy coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.start = this.mapService.getPointFromScreen(e, this.canvas);
  };

  private mousemove = (e) => {
    // Capture the ongoing xy coordinates
    this.current = this.mapService.getPointFromScreen(e, this.canvas)
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
  };

  private mouseup = (e) => {
    const f = this.mapService.getPointFromScreen(e, this.canvas);
    document.removeEventListener('mousemove', this.mousemove);
    document.removeEventListener('mouseup', this.mouseup);
    this.map.setCursorStyle('');
    this.map.enableDragPan();
    // Capture xy coordinates
    if (this.start.x !== f.x && this.start.y !== f.y) {
      this.finish([[this.start, f], [e.lngLat]]);
    } else {
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
    this.drawService.endDimensionsEmission();
  };

  private finish(bbox?) {
    if (bbox) {
      const startlng: number = this.map.startlngLat.lng;
      const endlng: number = this.map.endlngLat.lng;
      const startlat: number = this.map.startlngLat.lat;
      const endlat: number = this.map.endlngLat.lat;
      const west = Math.min(startlng, endlng);
      const north = Math.max(startlat, endlat);
      const east = Math.max(startlng, endlng);
      const south = Math.min(startlat, endlat);
      this.drawBbox(east, south, west, north);
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    }
  }


  /**
   * Emits the newly drawn bbox. It completes the drawBbox event emitted by the drawService.
   * @param east 
   * @param south 
   * @param west 
   * @param north 
   */
  protected drawBbox(east, south, west, north) {
    const coordinates = [[
      [east, south],
      [east, north],
      [west, north],
      [west, south],
      [east, south],
    ]];
    const polygonGeojson: Feature<GeoJSON.Geometry> = {
      type: 'Feature',
      properties: {
        source: 'bbox'
      },
      geometry: {
        type: 'Polygon',
        coordinates: coordinates
      }
    };
    const geoboxdata = Object.assign({}, this.emptyData);
    geoboxdata.features = [];
    if (this.drawData && this.drawData.features && this.drawData.features.length > 0) {
      this.drawData.features.forEach(df => geoboxdata.features.push(df));
    }
    geoboxdata.features.push(polygonGeojson);
    /** This allows to keep the drawn box on the map. It will be overriden in ngOnChanges `changes['drawData']` */
    this.drawService.addFeatures(geoboxdata, /** deleteOld */ true);
    this.onAoiChanged.next(geoboxdata);
    this.isDrawingBbox = false;
    this.drawService.disableBboxEdition();
    this.drawService.endDimensionsEmission();
  }

  /** @description Displays the geobox */
  public addGeoBox() {
    this.map.setCursorStyle('crosshair');
    this.drawService.enableBboxEdition();
    this.isDrawingBbox = true;
  }

  /**
   * @description Removes all the aois if none of them is selected. Otherwise it removes the selected one only
   */
  public removeAois() {
    this.map.setCursorStyle('');
    this.isDrawingBbox = false;
    this.deleteSelectedItem();
  }

  /** Deletes the selected draw geometry. If no drawn geometry is selected. All geometries are deteleted */
  public deleteSelectedItem() {
    if (this.isDrawSelected) {
      this.draw.trash();
    } else {
      this.drawService.deleteAll();
    }
    this.isDrawSelected = false;
    this.onAoiChanged.next(this.draw.getAll() as FeatureCollection<GeoJSON.Geometry>);
  }

  public openInvalidGeometrySnackBar() {
    this._snackBar.open(this.translate.instant('Invalid geometry'), this.translate.instant('Ok'), {
      duration: 3 * 1000,
      verticalPosition: 'top',
      panelClass: 'invalid-geo-toast'
    });
  }

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
      polygon = this.latLngToWKT(this.draw.getAll().features.filter(f => this.drawService.isPolygon(f) ||
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
      polygon = this.latLngToWKT(this.draw.getSelected().features.filter(f => this.drawService.isPolygon(f) ||
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

  public switchToDrawMode(mode?: string, option?: any) {
    const selectedMode = mode ?? this.draw.getMode('DRAW_POLYGON');
    this.isDrawingCircle = selectedMode === this.draw.getMode('DRAW_CIRCLE') || selectedMode === this.draw.getMode('DRAW_RADIUS_CIRCLE');
    this.isDrawingPolygon = selectedMode === this.draw.getMode('DRAW_POLYGON');
    this.isInSimpleDrawMode = false;
    this.draw.changeMode(selectedMode, option ?? {});
  }

  public switchToDirectSelectMode(option?: { featureIds: Array<string>; allowCircleResize: boolean; }
    | { featureId: string; allowCircleResize: boolean; }) {
    this.draw.changeMode('direct_select', option);
    this.isInSimpleDrawMode = false;
    this.isDrawingCircle = false;
    this.isDrawingStrip = false;
    this.isDrawingPolygon = false;
  }

  public switchToEditMode() {
    this.draw.changeMode('simple_select', {
      featureIds: this.draw.getAll().features.map(f => f.id)
    });
    this.isInSimpleDrawMode = true;
    this.isDrawingCircle = false;
    this.isDrawingStrip = false;
    this.isDrawingPolygon = false;
  }

  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isDrawingBbox) {
      this.map.setCursorStyle('');
      this.isDrawingBbox = false;
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.map.setCursorStyle('');
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
      this.map.enableDragPan();
      this.drawService.endDimensionsEmission();
    }
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
    const layers = this.map.updateLayoutVisibility(visualisationName);
    this.visualisations.emit(layers);
    this.map.reorderLayers();
  }

  // Todo: replace layer any by unique type
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
    moveItemInArray(this.map.visualisationSetsConfig, event.previousIndex, event.currentIndex);
    this.reorderLayers();
  }

  /** puts the layers list in the new order after dropping */
  public dropLayer(event: CdkDragDrop<string[]>, visuName: string) {
    const layers = Array.from(this.map.findVisualisationSetLayer(visuName));
    moveItemInArray(layers, event.previousIndex, event.currentIndex);
    this.map.setVisualisationSetLayers(visuName, layers);
    this.reorderLayers();
  }


  public ngOnDestroy(): void {
    if (!!this.aoiEditSubscription) {
      this.aoiEditSubscription.unsubscribe();
    }
    if (!!this.offlineBasemapChangeSubscription) {
      this.offlineBasemapChangeSubscription.unsubscribe();
    }
    if (!!this.drawBboxSubscription) {
      this.drawBboxSubscription.unsubscribe();
    }

    if (!!this.map) {
      this.map.unsubscribeEvents();
    }
  }

  public selectFeaturesByCollection(features: Array<ElementIdentifier>, collection: string) {
    this.map.selectFeaturesByCollection(features, collection);
  }

  public hideBasemapSwitcher() {
    this.showBasemapsList = false;
  }

  /**
   * Wrapper method to fit the map to the given bounds with enough padding to properly visualize the area
   */
  public paddedFitBounds(bounds: any, options?: any) {
    this.map.paddedFitBounds(bounds, options);
  }

  public moveToCoordinates(lngLat: [number, number]) {
    this.map.setCenter(lngLat);
  }

  // TODO: put into utils class.
  private latLngToWKT(features) {
    let wktType = 'POLYGON[###]';
    if (features.length > 1) {
      wktType = 'MULTIPOLYGON([###])';
    }

    let polygons = '';
    features.forEach((feat, indexFeature) => {
      if (feat) {
        const currentFeat: Array<any> = feat.geometry.coordinates;
        polygons += (indexFeature === 0 ? '' : ',') + '((';
        currentFeat[0].forEach((coord, index) => {
          polygons += (index === 0 ? '' : ',') + coord[0] + ' ' + coord[1];
        });
        polygons += '))';
      }
    });

    let wkt = '';
    if (polygons !== '') {
      wkt = wktType.replace('[###]', polygons);
    }
    return wkt;
  }

  private highlightFeature(featureToHightLight: { isleaving: boolean; elementidentifier: ElementIdentifier; }) {
    this.map.highlightFeature(featureToHightLight);
  }

  private selectFeatures(elementToSelect: Array<ElementIdentifier>) {
    this.map.selectFeatures(elementToSelect);
  }




}

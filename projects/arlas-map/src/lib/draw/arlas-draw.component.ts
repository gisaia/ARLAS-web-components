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

import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import { TranslateService } from '@ngx-translate/core';
import centroid from '@turf/centroid';
import cleanCoords from '@turf/clean-coords';
import { Feature, FeatureCollection, Geometry, Polygon, polygon } from '@turf/helpers';
import { ArlasMapFrameworkService } from '../arlas-map-framework.service';
import { AbstractArlasMapService } from '../arlas-map.service';
import { AbstractArlasMapGL } from '../map/AbstractArlasMapGL';
import { DrawControlsOption } from '../map/model/controls';
import { MapMouseEvent } from '../map/model/events';
import { ArlasPoint } from '../map/model/geometry';
import { latLngToWKT } from '../map/tools';
import { AbstractDraw } from './AbstractDraw';
import { AoiDimensions, BboxDrawCommand } from './draw.models';
import { MapboxAoiDrawService } from './draw.service';
import limitVertexDirectSelectMode from './modes/LimitVertexDirectSelectMode';
import validGeomDrawPolygonMode from './modes/ValidGeomDrawPolygonMode';
import { circleMode } from './modes/circles/circle.mode';
import radiusCircleMode from './modes/circles/radius.circle.mode';
import directModeOverride from './modes/directSelectOverride';
import simpleSelectModeOverride from './modes/simpleSelectOverride';
import { stripDirectSelectMode } from './modes/strip/strip.direct.mode';
import stripMode from './modes/strip/strip.mode';
import * as styles from './themes/default-theme';
@Component({
  selector: 'arlas-draw',
  templateUrl: './arlas-draw.component.html',
  styleUrls: ['./arlas-draw.component.scss'],
  encapsulation: ViewEncapsulation.None
})
/** L: a layer class/interface.
 *  S: a source class/interface.
 *  M: a Map configuration class/interface.
 */
export class ArlasDrawComponent<L, S, M> implements OnInit {

  @Input() public map: AbstractArlasMapGL;

  @Input() private emptyData: FeatureCollection<GeoJSON.Geometry> = {
    'type': 'FeatureCollection',
    'features': []
  };
  /**  @description Options object for draw tools : https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/API.md#options */
  @Input() public drawOption: any = {};
  /** Draw instance. */
  public draw: AbstractDraw;
  /** @description Features drawn at component start */
  @Input() public drawData: FeatureCollection<GeoJSON.Geometry> = ({ ...this.emptyData });
  /** @description Whether the draw tools are activated. */
  @Input() public drawButtonEnabled = false;
  /** @description Maximum number of vertices allowed for a polygon. */
  @Input() public drawPolygonVerticesLimit: number;
  /** @description Whether the drawing buffer is activated */
  /** If true, the map's canvas can be exported to a PNG using map.getCanvas().toDataURL(). Default: false */
  @Input() public preserveDrawingBuffer = false;

  /** @description Emits the geojson of an aoi added to the map. */
  @Output() public onAoiChanged: EventEmitter<FeatureCollection<GeoJSON.Geometry>> = new EventEmitter();

  /** @description Emits the the dimensions of the polygon/bbox that is being drawn. */
  @Output() public onAoiEdit: EventEmitter<AoiDimensions> = new EventEmitter();


  /** Set to true when the selected drawn geometry is changed. */
  protected drawnSelectionChanged = false;
  /** Number of drawn vertices (incremented in draw mode). Reset to 0 when the drawing is finished. */
  public nbPolygonVertices = 0;
  /** Number of clicks while drawing a geometry. */
  public drawClickCounter = 0;

  /** List of drawn polygons centroid */
  public polygonlabeldata: FeatureCollection<GeoJSON.Geometry> = ({ ...this.emptyData });


  /** Drawn geometry's state when editing/updating. */
  protected savedEditFeature = null;
  /** Map container Html element */
  protected canvas: HTMLElement;
  /** Canvas of the bbox while being drawn. This variable is set to undefined when the draw ends. */
  private box: HTMLElement;
  /** Point coordinates when the bbox drawing starts*/
  protected start: ArlasPoint;
  /** Point coordinates when the bbox drawing is being drawn. Changes on move.*/
  protected current: ArlasPoint;
  /** Message shown to explain how to end drawing. */
  public FINISH_DRAWING = marker('Double click to finish drawing');
  /** Html element that holds the FINISH_DRAWING message. */
  protected finishDrawTooltip: HTMLElement;


  public constructor(private readonly drawService: MapboxAoiDrawService, private readonly _snackBar: MatSnackBar,
    private readonly translate: TranslateService,
    protected mapFrameworkService: ArlasMapFrameworkService<L, S, M>,
    protected mapService: AbstractArlasMapService<L, S, M>) {
    this.drawService.editAoi$.pipe(takeUntilDestroyed()).subscribe(ae => this.onAoiEdit.emit(ae));
    this.drawService.drawBbox$.pipe(takeUntilDestroyed()).subscribe({
      next: (bboxDC: BboxDrawCommand) => {
        this.drawBbox(bboxDC.east, bboxDC.south, bboxDC.west, bboxDC.north);
      }
    });
  }

  /**
   * @description Stops the drawing mode by changing to static mode.
   */
  private stopDrawingAtVerticeLimit() {
    if (this.nbPolygonVertices === this.drawPolygonVerticesLimit) {
      this.draw.changeMode('static');
      this.drawService.isDrawingPolygon = false;
      this.nbPolygonVertices = 0;
    }
  }

  private listenToDrawOnCreate() {
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
  }

  private listenToDrawUpdate() {
    this.draw.on('draw.update', (e) => {
      if (e) {
        const features = e.features;
        if (features && features.length > 0) {
          this.savedEditFeature = { ...features[0] };
          this.savedEditFeature.coordinates = [[]];
          features[0].geometry.coordinates[0].forEach(f => this.savedEditFeature.coordinates[0].push(f));
        }
      }
    });
  }

  private listenToDrawDelete() {
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
  }

  private listenToDrawInvalidGeometry() {
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
        this.draw.add(currentFeature as Feature<Polygon>);
      }
      this.openInvalidGeometrySnackBar();
      this.mapFrameworkService.setMapCursor(this.map, '');
    });
  }

  private listenToDrawSelectionChange() {
    this.draw.onDrawSelectionchange((e) => {
      this.drawnSelectionChanged = true;
      if (e.features.length > 0) {
        this.drawService.isDrawSelected = true;
      } else {
        this.savedEditFeature = null;
        this.drawService.isDrawSelected = false;
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAllFeatures().filter(fc =>
              this.drawService.isValidPolygon(fc) ||
              this.drawService.isValidCircle(fc)
            ).map(f => cleanCoords(f))
          });
        this.drawService.isDrawingBbox = false;
        this.drawService.isDrawingPolygon = false;
        this.drawService.isDrawingCircle = false;
        this.drawService.isDrawingStrip = false;
        this.drawService.isInSimpleDrawMode = false;
        this.draw.changeMode('static');
        this.mapFrameworkService.setMapCursor(this.map, '');
      }
    });
  }

  private listenToDrawModeChange() {
    this.draw.onDrawModeChange((e) => {
      this.drawService.isDrawingPolygon = e.mode === this.draw.getMode('DRAW_POLYGON');
      this.drawService.isDrawingStrip = e.mode === this.draw.getMode('DIRECT_STRIP');
      this.drawService.isDrawingCircle = e.mode === this.draw.getMode('DRAW_CIRCLE') || e.mode === this.draw.getMode('DRAW_RADIUS_CIRCLE');
      if (this.drawService.isDrawingPolygon || this.drawService.isDrawingCircle || this.drawService.isDrawingStrip || e.mode === 'static') {
        this.drawService.isInSimpleDrawMode = false;
      }
      if (e.mode === 'simple_select') {
        this.drawService.isInSimpleDrawMode = true;
      } else if (e.mode === 'static') {
        this.mapFrameworkService.setMapCursor(this.map, '');
      } else if (e.mode === 'direct_select') {
        const selectedFeatures = this.draw.getSelectedFeatures();
        const selectedIds = this.draw.getSelectedIds();
        if (selectedFeatures && selectedIds && selectedIds.length > 0) {
          if (selectedFeatures[0].properties.source === 'bbox') {
            this.draw.changeMode('simple_select', {
              featureIds: [selectedIds[0]]
            });
            this.drawService.isInSimpleDrawMode = true;
          } else if (this.drawPolygonVerticesLimit && selectedFeatures[0].properties.meta !== 'strip') {
            this.draw.changeMode('limit_vertex', {
              featureId: selectedIds[0],
              maxVertexByPolygon: this.drawPolygonVerticesLimit,
              selectedCoordPaths: (selectedFeatures[0] as Feature<Geometry>).geometry.coordinates
            });
            this.drawService.isInSimpleDrawMode = false;
          } else if (this.drawPolygonVerticesLimit && selectedFeatures[0].properties.meta === 'strip') {
            this.draw.changeMode('direct_strip', {
              featureId: selectedIds[0],
              maxLength: selectedFeatures[0].properties.maxLength,
              halfSwath: selectedFeatures[0].properties.halfSwath,
            });
            this.drawService.isInSimpleDrawMode = false;
          }
        } else {
          this.drawService.isInSimpleDrawMode = false;
          this.mapFrameworkService.setMapCursor(this.map, '');
        }
      }
    });

  }

  public ngOnInit(): void {
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
    this.draw = this.mapFrameworkService.createDraw(drawOptions, this.drawButtonEnabled, this.map);
    this.draw.setMode('DRAW_CIRCLE', 'draw_circle');
    this.draw.setMode('DRAW_RADIUS_CIRCLE', 'draw_radius_circle');
    this.draw.setMode('DRAW_STRIP', 'draw_strip');
    this.draw.setMode('STATIC', 'static');
    this.draw.setMode('DIRECT_STRIP', 'direct_strip');
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
    this.mapFrameworkService.onMapEvent('load', this.map, () => {
      this.mapService.declareLabelSources('', this.polygonlabeldata, this.map);
      this.draw.changeMode('static');
      this.canvas = this.map.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);
      this.listenToDrawOnCreate();
      this.listenToDrawUpdate();
      this.listenToDrawDelete();
      const mouseMoveForDraw = (e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        this.finishDrawTooltip.style.top = (y + 20) + 'px';
        this.finishDrawTooltip.style.left = (x + 20) + 'px';
      };

      this.draw.onDrawOnClick((e) => {
        if (this.drawClickCounter === 0) {
          window.addEventListener('mousemove', mouseMoveForDraw);
        }
        this.drawClickCounter++;
      });
      this.draw.onDrawOnStart((e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.mapFrameworkService.setMapCursor(this.map, '');
      });
      this.draw.onDrawOnStop((e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.mapFrameworkService.setMapCursor(this.map, '');
      });

      this.listenToDrawInvalidGeometry();

      this.draw.onDrawEditSaveInitialFeature((edition) => {
        this.savedEditFeature = { ...edition.feature };
        this.savedEditFeature.coordinates = [[]];
        edition.feature.coordinates[0].forEach(c => this.savedEditFeature.coordinates[0].push(c));
      });

      this.listenToDrawSelectionChange();
      this.listenToDrawModeChange();
      this.mapFrameworkService.onMapEvent('click', this.map, (e) => {
        if (this.drawService.isDrawingCircle) {
          return;
        }
        if (this.drawService.isDrawingPolygon) {
          this.nbPolygonVertices++;
          this.stopDrawingAtVerticeLimit();
        } else {
          this.nbPolygonVertices = 0;
          const features = this.map.queryRenderedFeatures(e.point);
          // edit polygon condition : no arlas feature && mapbox-gl-draw source present
          const editCondition = features.filter(f => f.layer.id?.indexOf('arlas') >= 0).length === 0 &&
            features.filter(f => f.source.startsWith('mapbox-gl-draw')).length > 0;
          if (editCondition) {
            const candidates = features.filter(f => f.source.startsWith('mapbox-gl-draw'));
            // edit only on click on the border of the polygon
            const candidatesProperties = candidates.filter(f => f.layer.id?.indexOf('stroke') >= 0)[0]?.properties;
            if (candidatesProperties?.id) {
              if (candidatesProperties.user_meta === 'strip') {
                this.draw.changeMode('direct_strip', {
                  featureId: candidatesProperties.id,
                  maxLength: candidatesProperties.user_maxLength,
                  halfSwath: candidatesProperties.user_halfSwath
                });
                this.drawService.isInSimpleDrawMode = false;
              } else {
                this.draw.changeMode('simple_select', {
                  featureIds: [candidatesProperties.id]
                });
                this.drawService.isInSimpleDrawMode = true;
              }

            }
          }
        }
      });
    });

    // Mouse events
    this.mapFrameworkService.onMapEvent('mousedown', this.map, (e: MapMouseEvent) => {
      this.drawService.startBboxDrawing();
    });
    this.mapFrameworkService.onMapEvent('mouseup', this.map, (e: MapMouseEvent) => {
      this.drawService.stopBboxDrawing();
    });

    this.mapFrameworkService.onMapEvent('mousemove', this.map, (e: MapMouseEvent) => {
      const lngLat = e.lngLat;
      if (this.drawService.isDrawingBbox || this.drawService.isDrawingPolygon) {
        this.mapFrameworkService.setMapCursor(this.map, 'crosshair');
        this.map.moveLngLat = lngLat;
      }
      if (this.drawService.bboxEditionState.isDrawing) {
        const startlng: number = this.map.startLngLat.lng;
        const endlng: number = this.map.moveLngLat.lng;
        const startlat: number = this.map.startLngLat.lat;
        const endlat: number = this.map.moveLngLat.lat;
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

  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.map && this.map.getMapProvider() !== undefined) {
      if (changes['drawData'] !== undefined && this.drawService.isReady) {
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
        if (!this.drawnSelectionChanged) {
          this.drawService.addFeatures(this.drawData, /** deleteOld */ true);
        }
        this.drawnSelectionChanged = false;
        this.mapService.updateLabelSources(this.map.POLYGON_LABEL_SOURCE, this.polygonlabeldata, this.map);
      }

    }
  }

  /**
   * @description Triggered when drawing a bbox has started:
   * - It disables the map drag pan.
   * - It stores in the component's scope the start's cooordinates.
   */
  private readonly mousedown = (e) => {
    // Continue the rest of the function if we add a geobox.
    if (!this.drawService.isDrawingBbox) {
      return;
    }
    // Disable default drag zooming when we add a geobox.
    this.map.disableDragPan();
    // Call functions for the following events
    document.addEventListener('mousemove', this.mousemove);
    document.addEventListener('mouseup', this.mouseup);
    // Capture the first xy coordinates
    this.start = this.mapFrameworkService.getPointFromScreen(e, this.canvas);
  };

  /**
   * @description Triggered while moving the mouse when drawing the bbox:
   * - It draws on the map a bbox canvas.
   * - It stores in the component's scope the current mouse's cooordinates.
   */
  private readonly mousemove = (e) => {
    // Capture the ongoing xy coordinates
    this.current = this.mapFrameworkService.getPointFromScreen(e, this.canvas);
    // Append the box element if it doesn't exist
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

  /**
   * @description Triggerd on the second click to end drawing the bbox.
   * - Restores the drag pan on the map.
   * - Removes the bbox canvas.
   * - Draws the bbox feature on the map.
   * @param e Mouse event
   */
  private readonly mouseup = (e) => {
    const f = this.mapFrameworkService.getPointFromScreen(e, this.canvas);
    document.removeEventListener('mousemove', this.mousemove);
    document.removeEventListener('mouseup', this.mouseup);
    this.mapFrameworkService.setMapCursor(this.map, '');
    this.map.enableDragPan();
    // Capture xy coordinates
    if (this.start.x !== f.x && this.start.y !== f.y) {
      this.finish([[this.start, f], [e.lngLat]]);
    } else if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
    this.drawService.endDimensionsEmission();
  };

  /**
   * @description Draws the bbox feature on the map and removes the bbox canvas.
   * @param bbox Start/End coordinates of the bbox.
   */
  private finish(bbox?) {
    if (bbox) {
      const startlng: number = this.map.startLngLat.lng;
      const endlng: number = this.map.endLngLat.lng;
      const startlat: number = this.map.startLngLat.lat;
      const endlat: number = this.map.endLngLat.lat;
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
   * @description Emits the newly drawn bbox. It completes the drawBbox event emitted by the drawService.
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
    const geoboxdata = { ...this.emptyData};
    geoboxdata.features = [];
    if (this.drawData?.features && this.drawData.features.length > 0) {
      this.drawData.features.forEach(df => geoboxdata.features.push(df));
    }
    geoboxdata.features.push(polygonGeojson);
    /** This allows to keep the drawn box on the map. It will be overriden in ngOnChanges `changes['drawData']` */
    this.drawService.addFeatures(geoboxdata, /** deleteOld */ true);
    this.onAoiChanged.next(geoboxdata);
    this.drawService.isDrawingBbox = false;
    this.drawService.disableBboxEdition();
    this.drawService.endDimensionsEmission();
  }

  /** @description Enables bbox drawing mode.*/
  public addGeoBox() {
    this.mapFrameworkService.setMapCursor(this.map, 'crosshair');
    this.drawService.enableBboxEdition();
    this.drawService.isDrawingBbox = true;
  }

  /**
   * @description Removes all the aois if none of them is selected. Otherwise it removes the selected one only
   */
  public removeAois() {
    this.mapFrameworkService.setMapCursor(this.map, '');
    this.drawService.isDrawingBbox = false;
    this.deleteSelectedItem();
  }

  /** @description Deletes the selected drawn geometry. If no drawn geometry is selected, all geometries are deteleted */
  public deleteSelectedItem() {
    if (this.drawService.isDrawSelected) {
      this.draw.trash();
    } else {
      this.drawService.deleteAll();
    }
    this.drawService.isDrawSelected = false;
    this.onAoiChanged.next(this.draw.getAll() as FeatureCollection<GeoJSON.Geometry>);
  }

  /**
   * @description Shows an invalid-geometry error on a snack bar.
   */
  public openInvalidGeometrySnackBar() {
    this._snackBar.open(this.translate.instant('Invalid geometry'), this.translate.instant('Ok'), {
      duration: 3 * 1000,
      verticalPosition: 'top',
      panelClass: 'invalid-geo-toast'
    });
  }

  /**
   * @description Switches to a drawing mode of a polygon, circle or radisu circle.
   * @param mode Draw mode (DRAW_POLYGON, DRAW_CIRCLE or DRAW_RADIUS_CIRCLE). Default to DRAW_POLYGON
   * @param option Mapboxdraw option.
   */
  public switchToDrawMode(mode?: string, option?: any) {
    const selectedMode = mode ?? this.draw.getMode('DRAW_POLYGON');
    this.drawService.isDrawingCircle = selectedMode === this.draw.getMode('DRAW_CIRCLE')
      || selectedMode === this.draw.getMode('DRAW_RADIUS_CIRCLE');
    this.drawService.isDrawingPolygon = selectedMode === this.draw.getMode('DRAW_POLYGON');
    this.drawService.isInSimpleDrawMode = false;
    this.draw.changeMode(selectedMode, option ?? {});
  }

  /**
   * @description Switches to direct_select mode.
   * @param option Mapboxdraw option.
   */
  public switchToDirectSelectMode(option?: { featureIds: Array<string>; allowCircleResize: boolean; }
    | { featureId: string; allowCircleResize: boolean; }) {
    this.draw.changeMode('direct_select', option);
    this.drawService.isInSimpleDrawMode = false;
    this.drawService.isDrawingCircle = false;
    this.drawService.isDrawingStrip = false;
    this.drawService.isDrawingPolygon = false;
  }

  /**
   * @description Switches to simple_select mode.
   * @param option Mapboxdraw option.
   */
  public switchToEditMode() {
    this.draw.changeMode('simple_select', {
      featureIds: this.draw.getAll().features.map(f => f.id)
    });
    this.drawService.isInSimpleDrawMode = true;
    this.drawService.isDrawingCircle = false;
    this.drawService.isDrawingStrip = false;
    this.drawService.isDrawingPolygon = false;
  }

  /**
   * @description Returns all the drawn polygons as wkt or geojson.
   * @param mode 'wkt' | 'geojson'
   * @returns
   */
  public getAllPolygon(mode: 'wkt' | 'geojson'): string | Object {
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
   * @returns the selected polygon geometry in WKT or GeoJson given the mode
   * @param mode : 'wkt' | 'geojson'
   * @returns Wkt string or Geojson object.
   */
  public getSelectedPolygon(mode: 'wkt' | 'geojson'): string | Object {
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

  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.drawService.isDrawingBbox) {
      this.mapFrameworkService.setMapCursor(this.map, '');
      this.drawService.isDrawingBbox = false;
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.mapFrameworkService.setMapCursor(this.map, '');
      if (this.box) {
        this.box.parentNode.removeChild(this.box);
        this.box = undefined;
      }
      this.map.enableDragPan();
      this.drawService.endDimensionsEmission();
    }
  }

}


import {Component, OnInit} from '@angular/core';
import {MapglMapCommonComponent} from '../mapgl-map-common.component';
import mapboxgl, {AnySourceData, LngLatLike} from 'mapbox-gl';
import {
  CROSS_LAYER_PREFIX,
  GEOJSON_SOURCE_TYPE,
  OnMoveResult,
  RESET_BEARING,
  ZOOM_IN,
  ZOOM_OUT
} from "../../mapgl.interface";
import {fromEvent} from "rxjs";
import {MapExtend, paddedBounds} from "../../mapgl.component.util";
import {ControlButton, DrawControl, PitchToggle} from "../../mapgl.component.control";
import limitVertexDirectSelectMode from "../../model/LimitVertexDirectSelectMode";
import validGeomDrawPolygonMode from "../../model/ValidGeomDrawPolygonMode";
import {debounceTime} from "rxjs/operators";
import * as styles from "../../model/theme";
import {Feature} from "@turf/helpers";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';

@Component({
  selector: 'arlas-mapgl-mapbox',
  templateUrl: '../mapgl-map-common.html',
  styleUrls: ['../mapgl-map-common.css']
})
export class MapglMapboxComponent extends MapglMapCommonComponent implements OnInit {
  public map: mapboxgl.Map;

  public ngOnInit(): void {
  }

  public declareMap() {
    this.map = new mapboxgl.Map({
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
      transformRequest: this.transformRequest,
      attributionControl: false
    });
    (<mapboxgl.Map>this.map).addControl(new mapboxgl.AttributionControl(), this.mapAttributionPosition);
    this.drawService.setMap(this.map);
    fromEvent(window, 'beforeunload').subscribe(() => {
      const bounds = (<mapboxgl.Map>this.map).getBounds();
      const mapExtend: MapExtend = { bounds: bounds.toArray(), center: bounds.getCenter().toArray(), zoom: this.map.getZoom() };
      this.onMapClosed.next(mapExtend);
    });

    this.finishDrawTooltip = document.getElementById('polygon-finish-draw-tooltip');


    /** Whether to display scale */
    if (this.displayScale) {
      const scale = new mapboxgl.ScaleControl({
        maxWidth: this.maxWidthScale,
        unit: this.unitScale,
      });
      this.map.addControl(scale, 'bottom-right');
    }

    const navigationControllButtons = new mapboxgl.NavigationControl();
    const addGeoBoxButton = new ControlButton('addgeobox');
    const removeAoisButton = new ControlButton('removeaois');


    this.map.addControl(navigationControllButtons, 'top-right');
    this.map.addControl(new PitchToggle(-20, 70, 11), 'top-right');
    this.map.addControl(addGeoBoxButton, 'top-right');
    this.map.addControl(removeAoisButton, 'top-right');
    const drawOptions = {
      ...this.drawOption, ...{
        styles: styles.default,
        modes: Object.assign(
          MapboxDraw.modes,
          {
            static: StaticMode,
            limit_vertex: limitVertexDirectSelectMode,
            draw_polygon: validGeomDrawPolygonMode
          })
      }
    };

    const drawControl = new DrawControl(drawOptions, this.drawButtonEnabled);
    this.map.addControl(drawControl, 'top-right');
    this.draw = drawControl.mapboxDraw;
    this.drawService.setMapboxDraw(this.draw);
    addGeoBoxButton.btn.onclick = () => {
      this.addGeoBox();
    };
    removeAoisButton.btn.onclick = () => {
      this.removeAois();
    };
    this.map.boxZoom.disable();
    this.map.on('load', () => {
      this.basemapService.declareProtomapProtocol(this.map);
      this.basemapService.addProtomapBasemap(this.map);
      this.draw.changeMode('static');
      if (this.icons) {
        this.icons.forEach(icon => {
          this.map.loadImage(
            this.ICONS_BASE_PATH + icon.path,
            (error, image) => {
              if (error) {
                console.warn('The icon "' + this.ICONS_BASE_PATH + icon.path + '" is not found');
              } else {
                this.map.addImage(icon.path.split('.')[0], image, { 'sdf': icon.recolorable });
              }
            });
        });
      }
      this.firstDrawLayer = this.map.getStyle().layers
        .map(layer => layer.id)
        .filter(id => id.indexOf('.cold') >= 0 || id.indexOf('.hot') >= 0)[0];
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();

      // Add Data_source
      if (this.dataSources) {
        this.dataSources.forEach(source => {
          this.map.addSource(source, {
            type: GEOJSON_SOURCE_TYPE,
            data: Object.assign({}, this.emptyData)
          } as AnySourceData);
        });
      }
      this.map.addSource(this.POLYGON_LABEL_SOURCE, {
        'type': GEOJSON_SOURCE_TYPE,
        'data': this.polygonlabeldata
      } as AnySourceData);
      this.addSourcesToMap(this.mapSources, this.map);
      if (this.mapLayers !== null) {
        const layersMap = new Map();
        this.mapLayers.layers.forEach(layer => layersMap.set(layer.id, layer));
        this.layersMap = layersMap;
        this.addVisuLayers();
        this.addExternalEventLayers();

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
            const features = (this.map as mapboxgl.Map).queryRenderedFeatures(e.point);
            const hasCrossOrDrawLayer = (!!features && !!features.find(f => f.layer.id.startsWith(CROSS_LAYER_PREFIX)));
            if (!this.isDrawingBbox && !this.isDrawingPolygon && !this.isInSimpleDrawMode && !hasCrossOrDrawLayer) {
              this.onFeatureClic.next({ features: e.features, point: [e.lngLat.lng, e.lngLat.lat] });
            }
          });
        });

        [
          'gl-draw-polygon-stroke-inactive',
          'gl-draw-polygon-stroke-active',
          'gl-draw-polygon-stroke-static'
        ].forEach(layer =>
          ['.cold', '.hot'].forEach(layerId =>
            this.map.on('mousemove', layer.concat(layerId), (e) => {
              this.map.getCanvas().style.cursor = 'pointer';
            })
          )
        );
        [
          'gl-draw-polygon-stroke-inactive',
          'gl-draw-polygon-stroke-active',
          'gl-draw-polygon-stroke-static'
        ].forEach(layer =>
          ['.cold', '.hot'].forEach(layerId =>
            this.map.on('mouseleave', layer.concat(layerId), (e) => {
              this.map.getCanvas().style.cursor = '';
            })));

        this.mapLayers.events.onHover.forEach(layerId => {
          this.map.on('mousemove', layerId, (e) => {
            this.onFeatureOver.next({ features: e.features, point: [e.lngLat.lng, e.lngLat.lat] });
          });

          this.map.on('mouseleave', layerId, (e) => {
            this.onFeatureOver.next([]);
          });
        });

        this.visibilityUpdater.subscribe(visibilityStatus => {
          visibilityStatus.forEach((visibilityStatus, l) => {
            let layerInVisualisations = false;
            if (!visibilityStatus) {
              this.visualisationSetsConfig.forEach(v => {
                const ls = new Set(v.layers);
                if (!layerInVisualisations) {
                  layerInVisualisations = ls.has(l);
                }
              });
              if (layerInVisualisations) {
                (this.map as mapboxgl.Map).setLayoutProperty(l, 'visibility', 'none');
                this.setStrokeLayoutVisibility(l, 'none');
                this.setScrollableLayoutVisibility(l, 'none');
              }
            } else {
              let oneVisualisationEnabled = false;
              this.visualisationSetsConfig.forEach(v => {
                const ls = new Set(v.layers);
                if (!layerInVisualisations) {
                  layerInVisualisations = ls.has(l);
                }
                if (ls.has(l) && v.enabled) {
                  oneVisualisationEnabled = true;
                  (this.map).setLayoutProperty(l, 'visibility', 'visible');
                  this.setStrokeLayoutVisibility(l, 'visible');
                  this.setScrollableLayoutVisibility(l, 'visible');
                }
              });
              if (!oneVisualisationEnabled && layerInVisualisations) {
                (this.map).setLayoutProperty(l, 'visibility', 'none');
                this.setStrokeLayoutVisibility(l, 'none');
                this.setScrollableLayoutVisibility(l, 'none');
              }
            }
          });
        });
      }
      this.map.showTileBoundaries = false;
      this.canvas = this.map.getCanvasContainer();
      this.canvas.addEventListener('mousedown', this.mousedown, true);
      this.map.on('draw.create', (e) => {
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAll().features.filter(fc => {
              const coordinates = fc.geometry.coordinates;
              return fc.geometry.type === 'Polygon' && coordinates && coordinates[0] !== (null && undefined)
                && coordinates[0][0] !== (null && undefined);
            })
          });
      });

      this.map.on('draw.update', (e) => {
        if (e) {
          const features = e.features;
          if (features && features.length > 0) {
            this.savedEditFeature = Object.assign({}, features[0]);
            this.savedEditFeature.coordinates = [[]];
            features[0].geometry.coordinates[0].forEach(f => this.savedEditFeature.coordinates[0].push(f));
          }
        }
      });
      this.map.on('draw.delete', (e) => {
        this.onAoiChanged.next(
          {
            'type': 'FeatureCollection',
            'features': this.draw.getAll().features.filter(fc => fc.geometry.type === 'Polygon')
          });
      });

      const mouseMoveForDraw = (e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        this.finishDrawTooltip.style.top = (y + 20) + 'px';
        this.finishDrawTooltip.style.left = (x + 20) + 'px';
      };

      this.map.on('draw.onClick', (e) => {
        if (this.drawClickCounter === 0) {
          window.addEventListener('mousemove', mouseMoveForDraw);
        }
        this.drawClickCounter++;
      });
      this.map.on('draw.onStart', (e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.map.getCanvas().style.cursor = '';
      });
      this.map.on('draw.onStop', (e) => {
        window.removeEventListener('mousemove', mouseMoveForDraw);
        this.drawClickCounter = 0;
        this.map.getCanvas().style.cursor = '';
      });

      this.map.on('draw.invalidGeometry', (e) => {
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
        this.map.getCanvas().style.cursor = '';
      });

      this.map.on('draw.edit.saveInitialFeature', (edition) => {
        this.savedEditFeature = Object.assign({}, edition.feature);
        this.savedEditFeature.coordinates = [[]];
        edition.feature.coordinates[0].forEach(c => this.savedEditFeature.coordinates[0].push(c));
      });

      this.map.on('draw.selectionchange', (e) => {
        this.drawSelectionChanged = true;
        if (e.features.length > 0) {
          this.isDrawPolyonSelected = true;
        } else {
          this.savedEditFeature = null;
          this.isDrawPolyonSelected = false;
          this.onAoiChanged.next(
            {
              'type': 'FeatureCollection',
              'features': this.draw.getAll().features.filter(fc => {
                const coordinates = fc.geometry.coordinates;
                return fc.geometry.type === 'Polygon' && coordinates && coordinates[0] !== (null && undefined)
                  && coordinates[0][0] !== (null && undefined);
              })
            });
          this.isDrawingBbox = false;
          this.isDrawingPolygon = false;
          this.isInSimpleDrawMode = false;
          this.draw.changeMode('static');
          this.map.getCanvas().style.cursor = '';
        }
      });
      this.map.on('draw.modechange', (e) => {
        if (e.mode === 'draw_polygon') {
          this.isDrawingPolygon = true;
          this.isInSimpleDrawMode = false;
        }
        if (e.mode === 'simple_select') {
          this.isInSimpleDrawMode = true;
        }
        if (e.mode === 'static') {
          this.isDrawingPolygon = false;
          this.isInSimpleDrawMode = false;
          this.map.getCanvas().style.cursor = '';
        }
        if (e.mode === 'direct_select') {
          const selectedFeatures = this.draw.getSelected().features;
          const selectedIds = this.draw.getSelectedIds();
          if (selectedFeatures && selectedIds && selectedIds.length > 0) {
            if (selectedFeatures[0].properties.source === 'bbox') {
              this.draw.changeMode('simple_select', {
                featureIds: [selectedIds[0]]
              });
              this.isInSimpleDrawMode = true;
            } else if (this.drawPolygonVerticesLimit) {
              this.draw.changeMode('limit_vertex', {
                featureId: selectedIds[0],
                maxVertexByPolygon: this.drawPolygonVerticesLimit,
                selectedCoordPaths: selectedFeatures[0].geometry.coordinates
              });
            }
          } else {
            this.isDrawingPolygon = false;
            this.isInSimpleDrawMode = false;
            this.map.getCanvas().style.cursor = '';
          }
        }
      });

      this.map.on('click', (e) => {
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
            const id = candidates.filter(f => f.layer.id?.indexOf('stroke') >= 0)[0]?.properties?.id;
            if (!!id) {
              this.draw.changeMode('simple_select', {
                featureIds: [id]
              });
              this.isInSimpleDrawMode = true;

            }
          }
        }
      });
      this.onMapLoaded.next(true);
    });

    const zoomstart = fromEvent(this.map, 'zoomstart')
      .pipe(debounceTime(750));

    zoomstart.subscribe(e => {
      this.zoomStart = this.map.getZoom();
    });

    const dragstart = fromEvent(this.map, 'dragstart')
      .pipe(debounceTime(750));
    dragstart.subscribe(e => {
      this.dragStartX = (<any>e).originalEvent.clientX;
      this.dragStartY = (<any>e).originalEvent.clientY;
    });
    const dragend = fromEvent(this.map, 'dragend')
      .pipe(debounceTime(750));
    dragend.subscribe(e => {
      this.dragEndX = (<any>e).originalEvent.clientX;
      this.dragEndY = (<any>e).originalEvent.clientY;
      this.xMoveRatio = Math.abs(this.dragEndX - this.dragStartX) / (<any>e).target._canvas.clientWidth;
      this.yMoveRatio = Math.abs(this.dragEndY - this.dragStartY) / (<any>e).target._canvas.clientHeight;
    });

    this.visualisationsSets = {
      visualisations: new Map(),
      status: new Map()
    };
    if (this.visualisationSetsConfig) {
      this.visualisationSetsConfig.forEach(visu => {
        this.visualisationsSets.visualisations.set(visu.name, new Set(visu.layers));
        this.visualisationsSets.status.set(visu.name, visu.enabled);
      });
    }
    const moveend = fromEvent(this.map, 'moveend')
      .pipe(debounceTime(750));
    moveend.subscribe(e => {
      this.west = this.map.getBounds().getWest();
      this.south = this.map.getBounds().getSouth();
      this.east = this.map.getBounds().getEast();
      this.north = this.map.getBounds().getNorth();
      this.zoom = this.map.getZoom();
      const offsetPoint = new mapboxgl.Point((this.offset.east + this.offset.west) / 2, (this.offset.north + this.offset.south) / 2);
      const centerOffsetPoint = this.map.project(this.map.getCenter()).add(offsetPoint);
      const centerOffSetLatLng = this.map.unproject(centerOffsetPoint);

      const southWest = this.map.getBounds().getSouthWest();
      const northEast = this.map.getBounds().getNorthEast();
      const bottomLeft = this.map.project(southWest as  LngLatLike);
      const topRght = this.map.project(northEast);
      const height = bottomLeft.y;
      const width = topRght.x;

      const bottomLeftOffset = bottomLeft.add(new mapboxgl.Point(this.offset.west, this.offset.south));
      const topRghtOffset = topRght.add(new mapboxgl.Point(this.offset.east, this.offset.north));

      const bottomLeftOffsetLatLng = this.map.unproject(bottomLeftOffset);
      const topRghtOffsetLatLng = this.map.unproject(topRghtOffset);

      const wrapWestOffset = bottomLeftOffsetLatLng.wrap().lng;
      const wrapSouthOffset = bottomLeftOffsetLatLng.wrap().lat;
      const wrapEastOffset = topRghtOffsetLatLng.wrap().lng;
      const wrapNorthOffset = topRghtOffsetLatLng.wrap().lat;

      const rawWestOffset = bottomLeftOffsetLatLng.lng;
      const rawSouthOffset = bottomLeftOffsetLatLng.lat;
      const rawEastOffset = topRghtOffsetLatLng.lng;
      const rawNorthOffset = topRghtOffsetLatLng.lat;
      const visibleLayers = new Set<string>();
      this.visualisationsSets.status.forEach((b, vs) => {
        if (b) {
          this.visualisationsSets.visualisations.get(vs).forEach(l => visibleLayers.add(l));
        }
      });
      const onMoveData: OnMoveResult = {
        zoom: this.zoom,
        zoomStart: this.zoomStart,
        center: this.map.getCenter(),
        centerWithOffset: [centerOffSetLatLng.lng, centerOffSetLatLng.lat],
        extendWithOffset: [wrapNorthOffset, wrapWestOffset, wrapSouthOffset, wrapEastOffset],
        rawExtendWithOffset: [rawNorthOffset, rawWestOffset, rawSouthOffset, rawEastOffset],
        extend: [this.north, this.west, this.south, this.east],
        extendForLoad: [],
        extendForTest: [],
        rawExtendForLoad: [],
        rawExtendForTest: [],
        xMoveRatio: this.xMoveRatio,
        yMoveRatio: this.yMoveRatio,
        visibleLayers: visibleLayers
      } as OnMoveResult;

      const panLoad = this.margePanForLoad * Math.max(height, width) / 100;
      const panTest = this.margePanForTest * Math.max(height, width) / 100;
      const extendForLoadLatLng = paddedBounds(panLoad, panLoad, panLoad, panLoad, this.map, southWest, northEast);
      const extendForTestdLatLng = paddedBounds(panTest, panTest, panTest, panTest, this.map, southWest, northEast);
      onMoveData.extendForLoad = [
        extendForLoadLatLng[1].wrap().lat,
        extendForLoadLatLng[0].wrap().lng,
        extendForLoadLatLng[0].wrap().lat,
        extendForLoadLatLng[1].wrap().lng
      ];
      onMoveData.extendForTest = [
        extendForTestdLatLng[1].wrap().lat,
        extendForTestdLatLng[0].wrap().lng,
        extendForTestdLatLng[0].wrap().lat,
        extendForTestdLatLng[1].wrap().lng
      ];
      onMoveData.rawExtendForLoad = [
        extendForLoadLatLng[1].lat,
        extendForLoadLatLng[0].lng,
        extendForLoadLatLng[0].lat,
        extendForLoadLatLng[1].lng,
      ];
      onMoveData.rawExtendForTest = [
        extendForTestdLatLng[1].lat,
        extendForTestdLatLng[0].lng,
        extendForTestdLatLng[0].lat,
        extendForTestdLatLng[1].lng,
      ];
      this.onMove.next(onMoveData);
    });
    // Fit bounds on current bounds to emit init position in moveend bus
    this.map.fitBounds(this.map.getBounds());

    // Mouse events
    this.map.on('mousedown', (e: mapboxgl.MapMouseEvent) => {
      this.startlngLat = e.lngLat;
      this.drawService.startBboxDrawing();
    });
    this.map.on('mouseup', (e: mapboxgl.MapMouseEvent) => {
      this.endlngLat = e.lngLat;
      this.drawService.stopBboxDrawing();
    });
    this.map.on('mousemove', (e: mapboxgl.MapMouseEvent) => {
      const lngLat = e.lngLat;
      if (this.displayCurrentCoordinates) {
        const displayedLngLat = this.wrapLatLng ? lngLat.wrap() : lngLat;
        this.currentLng = String(Math.round(displayedLngLat.lng * 100000) / 100000);
        this.currentLat = String(Math.round(displayedLngLat.lat * 100000) / 100000);
      }
      if (this.isDrawingBbox || this.isDrawingPolygon) {
        this.map.getCanvas().style.cursor = 'crosshair';
        this.movelngLat = lngLat;
      }
      if (this.drawService.bboxEditionState.isDrawing) {
        const startlng: number = this.startlngLat.lng;
        const endlng: number = this.movelngLat.lng;
        const startlat: number = this.startlngLat.lat;
        const endlat: number = this.movelngLat.lat;
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
        if (this.map.getSource(sd.source) !== undefined) {
          (<any>this.map.getSource(sd.source)).setData({
            'type': 'FeatureCollection',
            'features': sd.data
          });
        }
      });
    }
  }

}

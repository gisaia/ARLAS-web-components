
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
/*
 * Public API Surface of arlas-map
 */

export {
  MapSettingsComponent, MapSettingsService, GeoQuery, GeometrySelectModel, OperationSelectModel, MapSettingsDialogComponent,
  GeoQueryOperator
} from './lib/map-settings/map-settings.component';
export {
  AllowedImportGeometry, MapImportComponent, MapImportDialogComponent
} from './lib/map-import/map-import.component';
export { MapSettingsModule } from './lib/map-settings/map-settings.module';
export { MapImportModule } from './lib/map-import/map-import.module';
export { GetCollectionPipe } from './lib/arlas-map.pipe';
export { LayerIdToName } from './lib/legend/layer-name.pipe';
export { LegendService } from './lib/legend/legend.service';
export { ArlasMapModule } from './lib/arlas-map.module';
export { LegendItemComponent } from './lib/legend/legend-item/legend-item.component';
export { LegendComponent } from './lib/legend/legend.component';
export { LayerIconComponent } from './lib/legend/legend-icon/layer-icon.component';
export * from './lib/arlas-map-framework.service';
export * from './lib/arlas-map.component';
export * from './lib/arlas-map.module';
export { CoordinatesComponent } from './lib/coordinates/coordinates.component';
export { CoordinatesErrorPipe } from './lib/coordinates/coordinates.pipe';
export { BasemapComponent } from './lib/basemaps/basemap.component';
export { BasemapStyle } from './lib/basemaps/basemap.config';
export { BasemapService } from './lib/basemaps/basemap.service';
export { ArlasBasemaps } from './lib/basemaps/basemaps.model';
export { BboxFormErrorPipe } from './lib/bbox-generator/bbox-form-error.pipe';
export { BboxGeneratorComponent } from './lib/bbox-generator/bbox-generator.component';
export { BboxGeneratorModule } from './lib/bbox-generator/bbox-generator.module';
export { BboxFormGroup } from './lib/bbox-generator/bbox-generator.utils';
export { Coordinate } from './lib/bbox-generator/coordinates.tools';
export { AbstractDraw } from './lib/draw/AbstractDraw';
export { AoiDimensions as AoiEdition, Corner, EditionState } from './lib/draw/draw.models';
export { MapboxAoiDrawService } from './lib/draw/draw.service';
export { limitVertexDirectSelectMode } from './lib/draw/modes/LimitVertexDirectSelectMode';
export { validGeomDrawPolygonMode } from './lib/draw/modes/ValidGeomDrawPolygonMode';
export { directModeOverride } from './lib/draw/modes/directSelectOverride';
export { simpleSelectModeOverride } from './lib/draw/modes/simpleSelectOverride';
export { circleMode } from './lib/draw/modes/circles/circle.mode';
export { radiusCircleMode } from './lib/draw/modes/circles/radius.circle.mode';
export { createSupplementaryPointsForCircle, dragPan } from './lib/draw/modes/circles/utils';
export { stripDirectSelectMode } from './lib/draw/modes/strip/strip.direct.mode';
export { stripMode } from './lib/draw/modes/strip/strip.mode';
export { rectangleMode } from './lib/draw/modes/rectangleMode';
export {
  AbstractArlasMapGL, ArlasMapOffset, CROSS_LAYER_PREFIX,
  GEOJSON_SOURCE_TYPE, LAYER_SWITCHER_TOOLTIP,
  MapConfig, RESET_BEARING, ZOOM_IN, ZOOM_OUT
} from './lib/map/AbstractArlasMapGL';
export {
  ConfigControls, ControlButton, ControlPosition, ControlsOption, DrawConfigControl,
  DrawControlsOption, IconConfig, PitchToggle, PitchToggleConfigControls
} from './lib/map/model/controls';
export { MapExtent } from './lib/map/model/extent';
export {
  ARLAS_ID, ARLAS_VSET, ExternalEvent, ExternalEventLayer, FILLSTROKE_LAYER_PREFIX, FillStroke, HOVER_LAYER_PREFIX,
  LayerEvents, LayerMetadata, MapLayers, MetadataHiddenProps, PaintColor, PaintValue, SCROLLABLE_ARLAS_ID, SELECT_LAYER_PREFIX,
  getLayerName, ArlasDataLayer, ArlasPaint
} from './lib/map/model/layers';
export { ArlasMapSource } from './lib/map/model/sources';
export { VisualisationSetConfig } from './lib/map/model/visualisationsets';
export {
  Legend, LegendData, PROPERTY_SELECTOR_SOURCE, CircleLegend, LineLegend,
  FillLegend, HeatmapLegend, LabelLegend
} from './lib/legend/legend.config';
export { getMax, MAX_CIRLE_RADIUS, MAX_LINE_WIDTH } from './lib/legend/legend.tools';
export { FormatLegendPipe } from './lib/legend/format-legend.pipe';
export * as styles from './lib/draw/themes/default-theme';
export { ArlasMapComponent } from './lib/arlas-map.component';
export { ArlasLngLat, OnMoveResult, ArlasLngLatBounds, } from './lib/map/model/map';
export { VectorStyle, VectorStyleEnum } from './lib/map/model/vector-style';
/** Map component logic */
export { AbstractArlasMapService } from './lib/arlas-map.service';
/** Map framework logic */
export { ArlasMapFrameworkService } from './lib/arlas-map-framework.service';
export { GET, HEATMAP_DENSITY, IN, INTERPOLATE, MATCH, NOT_IN, OTHER } from './lib/map/model/filters';
export { MapLayerMouseEvent, MapMouseEvent} from './lib/map/model/events';

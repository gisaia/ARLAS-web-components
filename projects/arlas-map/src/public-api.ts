
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

export { ArlasMapFrameworkService } from './lib/arlas-map-framework.service';
export { ArlasMapComponent } from './lib/arlas-map.component';
export { GetCollectionPipe } from './lib/arlas-map.pipe';
export { AbstractArlasMapService } from './lib/arlas-map.service';
export { BasemapComponent } from './lib/basemaps/basemap.component';
export { BasemapStyle } from './lib/basemaps/basemap.config';
export { BasemapService } from './lib/basemaps/basemap.service';
export { ArlasBasemaps } from './lib/basemaps/basemaps.model';
export { BboxFormErrorPipe } from './lib/bbox-generator/bbox-form-error.pipe';
export { BboxGeneratorComponent } from './lib/bbox-generator/bbox-generator.component';
export { BboxFormGroup } from './lib/bbox-generator/bbox-generator.utils';
export { Coordinate } from './lib/bbox-generator/coordinates.tools';
export { CoordinatesComponent } from './lib/coordinates/coordinates.component';
export { CoordinatesErrorPipe } from './lib/coordinates/coordinates.pipe';
export { AbstractDraw } from './lib/draw/AbstractDraw';
export { AoiEdition, Corner } from './lib/draw/draw.models';
export { MapboxAoiDrawService } from './lib/draw/draw.service';
export { circleMode } from './lib/draw/modes/circles/circle.mode';
export { radiusCircleMode } from './lib/draw/modes/circles/radius.circle.mode';
export { createSupplementaryPointsForCircle, dragPan } from './lib/draw/modes/circles/utils';
export { directModeOverride } from './lib/draw/modes/directSelectOverride';
export { limitVertexDirectSelectMode } from './lib/draw/modes/LimitVertexDirectSelectMode';
export { rectangleMode } from './lib/draw/modes/rectangleMode';
export { simpleSelectModeOverride } from './lib/draw/modes/simpleSelectOverride';
export { stripDirectSelectMode } from './lib/draw/modes/strip/strip.direct.mode';
export { stripMode } from './lib/draw/modes/strip/strip.mode';
export { validGeomDrawPolygonMode } from './lib/draw/modes/ValidGeomDrawPolygonMode';
export * as styles from './lib/draw/themes/default-theme';
export { FormatLegendPipe } from './lib/legend/format-legend.pipe';
export { LayerIdToName } from './lib/legend/layer-name.pipe';
export { LayerIconComponent } from './lib/legend/legend-icon/layer-icon.component';
export { LegendItemComponent } from './lib/legend/legend-item/legend-item.component';
export { LegendComponent } from './lib/legend/legend.component';
export {
  CircleLegend, FillLegend, HeatmapLegend, LabelLegend, Legend, LegendData, LineLegend, PROPERTY_SELECTOR_SOURCE
} from './lib/legend/legend.config';
export { LegendService } from './lib/legend/legend.service';
export { getMax, MAX_CIRLE_RADIUS, MAX_LINE_WIDTH } from './lib/legend/legend.tools';
export { AllowedImportGeometry, MapImportComponent, MapImportDialogComponent } from './lib/map-import/map-import.component';
export {
  GeometrySelectModel, GeoQuery, GeoQueryOperator, MapSettingsComponent, MapSettingsDialogComponent, MapSettingsService, OperationSelectModel
} from './lib/map-settings/map-settings.component';
export {
  AbstractArlasMapGL, ArlasMapOffset, ArlasMapOption, CROSS_LAYER_PREFIX,
  GEOJSON_SOURCE_TYPE, HILLSHADE_SOURCE, LAYER_SWITCHER_TOOLTIP, MapConfig,
  OPACITY_SUFFIX, RESET_BEARING, TERRAIN_SOURCE, ZOOM_IN, ZOOM_OUT
} from './lib/map/AbstractArlasMapGL';
export {
  ConfigControls, ControlButton, ControlPosition, ControlsOption, DrawConfigControl, DrawControlsOption, IconConfig
} from './lib/map/model/controls';
export { MapLayerMouseEvent, MapMouseEvent } from './lib/map/model/events';
export { MapExtent } from './lib/map/model/extent';
export { GET, HEATMAP_DENSITY, IN, INTERPOLATE, MATCH, NOT_IN, OTHER } from './lib/map/model/filters';
export * from './lib/map/model/layers';
export {
  ARLAS_ID, ARLAS_VSET, ArlasDataLayer, ArlasPaint, ExternalEvent, ExternalEventLayer, FillStroke, FILLSTROKE_LAYER_PREFIX, getLayerName,
  HOVER_LAYER_PREFIX, LayerEvents, LayerMetadata, MapLayers, MetadataHiddenProps, PaintColor, PaintValue, SCROLLABLE_ARLAS_ID, SELECT_LAYER_PREFIX
} from './lib/map/model/layers';
export { ArlasLngLat, ArlasLngLatBounds, OnMoveResult } from './lib/map/model/map';
export { ArlasMapSource } from './lib/map/model/sources';
export { TerrainConfiguration } from './lib/map/model/terrain';
export { VectorStyle, VectorStyleEnum } from './lib/map/model/vector-style';
export { VisualisationSetConfig } from './lib/map/model/visualisationsets';
export { getAdditionalFillLayers, latLngToWKT } from './lib/map/tools';


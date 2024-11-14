/*
 * Public API Surface of arlas-map
 */

export { LegendItemComponent } from './lib/legend/legend-item/legend-item.component';
export { LegendComponent } from './lib/legend/legend.component';
export { LayerIconComponent } from './lib/legend/legend-icon/layer-icon.component';
export * from './lib/arlas-map.service';
export * from './lib/arlas-map.component';
export * from './lib/arlas-map.module';
export { CoordinatesComponent } from './lib/coordinates/coordinates.component';
export { BasemapComponent } from './lib/basemaps/basemap.component';
export { BasemapStyle } from './lib/basemaps/basemap.config';
export { BasemapService } from './lib/basemaps/basemap.service';
export { ArlasBasemaps } from './lib/basemaps/basemaps.model';
export { BboxFormErrorPipe } from './lib/bbox-generator/bbox-form-error.pipe';
export { BboxGeneratorComponent } from './lib/bbox-generator/bbox-generator.component';
export { BboxGeneratorModule } from './lib/bbox-generator/bbox-generator.module';
export { BboxFormGroup } from './lib/bbox-generator/bbox-generator.utils';
export { Coordinate } from './lib/bbox-generator/coordinates.tools';
export { AbstractDraw } from './lib/draw/AbstractDraw'
export { AoiDimensions, BboxDrawCommand, Corner, EditionState } from './lib/draw/draw.models'
export { MapboxAoiDrawService } from './lib/draw/draw.service'
export { limitVertexDirectSelectMode } from './lib/draw/modes/LimitVertexDirectSelectMode'
export { validGeomDrawPolygonMode } from './lib/draw/modes/ValidGeomDrawPolygonMode'
export { directModeOverride } from './lib/draw/modes/directSelectOverride'
export { simpleSelectModeOverride } from './lib/draw/modes/simpleSelectOverride'
export { circleMode } from './lib/draw/modes/circles/circle.mode'
export { radiusCircleMode } from './lib/draw/modes/circles/radius.circle.mode'
export { createSupplementaryPointsForCircle, dragPan } from './lib/draw/modes/circles/utils'
export { stripDirectSelectMode } from './lib/draw/modes/strip/strip.direct.mode'
export { stripMode } from './lib/draw/modes/strip/strip.mode'
export { AbstractArlasMapGL, ArlasMapOffset, CROSS_LAYER_PREFIX,
  BindLayerToEvent, ElementIdentifier, GEOJSON_SOURCE_TYPE, LAYER_SWITCHER_TOOLTIP, LngLat,
  MapConfig, MapEventBinds, OnMoveResult, RESET_BEARING, ZOOM_IN, ZOOM_OUT
 } from './lib/map/AbstractArlasMapGL'
export { MapInterface } from './lib/map/interface/map.interface'
export {
  ConfigControls, ControlButton, ControlPosition, ControlsOption, DrawConfigControl,
  DrawControlsOption, IconConfig, PitchToggle, PitchToggleConfigControls
} from './lib/map/model/controls'
export { MapExtent } from './lib/map/model/extent'
export {
  ARLAS_ID, ARLAS_VSET, ExternalEvent, ExternalEventLayer, FILLSTROKE_LAYER_PREFIX, FillStroke, HOVER_LAYER_PREFIX,
  LayerEvents, LayerMetadata, MapLayers, MetadataHiddenProps, PaintColor, PaintValue, SCROLLABLE_ARLAS_ID, SELECT_LAYER_PREFIX,
  getLayerName
} from './lib/map/model/layers'
export { ArlasMapSource } from './lib/map/model/sources'
export { VisualisationSetConfig } from './lib/map/model/visualisationsets'
export { Legend, LegendData, PROPERTY_SELECTOR_SOURCE, CircleLegend, LineLegend, FillLegend, HeatmapLegend, LabelLegend } from './lib/legend/legend.config'
export { getMax, MAX_CIRLE_RADIUS, MAX_LINE_WIDTH } from './lib/legend/legend.tools'
export * as styles from './lib/draw/themes/default-theme'
export { ArlasMapComponent } from './lib/arlas-map.component'
export { ArlasMapService } from './lib/arlas-map.service'

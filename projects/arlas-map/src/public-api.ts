/*
 * Public API Surface of arlas-map
 */

export * from './lib/arlas-map.service';
export * from './lib/arlas-map.component';
export * from './lib/arlas-map.module';
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
export { AbstractArlasMapGL } from './lib/map/AbstractArlasMapGL'
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


/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
*/

/*
 * Public API Surface of arlas-web-components
 */
export { ChartType, DataType, HistogramTooltip, Position, SimpleNode, SwimlaneMode, TreeNode, TimelineData } from 'arlas-d3';
export { ArlasComponentsService } from './lib/arlas-components.service';
export { AwcColorGeneratorLoader, ColorGeneratorLoader, numberToShortValue } from './lib/components/componentsUtils';
export { DonutComponent } from './lib/components/donut/donut.component';
export { DonutModule } from './lib/components/donut/donut.module';
export { HistogramComponent } from './lib/components/histogram/histogram.component';
export { HistogramModule } from './lib/components/histogram/histogram.module';
export { MapglImportComponent, MapglImportDialogComponent } from './lib/components/mapgl-import/mapgl-import.component';
export { CoordinatesComponent } from './lib/components/mapgl/coordinates/coordinates.component';
export { Coordinate, PointFormGroup } from './lib/tools/coordinates.tools';
export { MapglImportModule } from './lib/components/mapgl-import/mapgl-import.module';
export { MapglLayerIconComponent } from './lib/components/mapgl-layer-icon/mapgl-layer-icon.component';
export { MapglLayerIconModule } from './lib/components/mapgl-layer-icon/mapgl-layer-icon.module';
export {
  MapLayers, ARLAS_VSET, LayerEvents, FILLSTROKE_LAYER_PREFIX, ARLAS_ID, PaintValue,
  ExternalEventLayer, ExternalEvent, SCROLLABLE_ARLAS_ID, FillStroke, LayerMetadata, PaintColor, HOVER_LAYER_PREFIX, SELECT_LAYER_PREFIX
} from './lib/components/mapgl/model/mapLayers';
export { BasemapStyle } from './lib/components/mapgl/basemaps/basemap.config';
export { MapboxBasemapService } from './lib/components/mapgl/basemaps/basemap.service';
export { ArlasBasemaps } from './lib/components/mapgl/basemaps/basemaps';
export { MapSource } from './lib/components/mapgl/model/mapSource';
export { MapExtend, LegendData, Legend, PROPERTY_SELECTOR_SOURCE, ArlasAnyLayer } from './lib/components/mapgl/mapgl.component.util';
export { AoiDimensions as AoiEdition } from './lib/components/mapgl/draw/draw.models';
export { MapboxAoiDrawService } from './lib/components/mapgl/draw/draw.service';
export { PowerBar } from './lib/components/powerbars/model/powerbar';
export { PageEnum } from './lib/components/results/utils/enumerations/pageEnum';
export { ThumbnailFitEnum } from './lib/components/results/utils/enumerations/thumbnailFitEnum';
export { CellBackgroundStyleEnum } from './lib/components/results/utils/enumerations/cellBackgroundStyleEnum';
export { DetailedDataRetriever } from './lib/components/results/utils/detailed-data-retriever';
export {
  Action, ElementIdentifier, FieldsConfiguration, DescribedUrl, ResultListOptions,
  Attachment, AdditionalInfo, Field, PageQuery, PROTECTED_IMAGE_HEADER
} from './lib/components/results/utils/results.utils';
export { Item } from './lib/components/results/model/item';
export { Column } from './lib/components/results/model/column';
export { MapglComponent, VisualisationSetConfig, IconConfig, OnMoveResult, CROSS_LAYER_PREFIX } from './lib/components/mapgl/mapgl.component';
export { MapglModule } from './lib/components/mapgl/mapgl.module';
export { ResultListComponent } from './lib/components/results/result-list/result-list.component';
export { ResultItemComponent } from './lib/components/results/result-item/result-item.component';
export { ResultDetailedItemComponent } from './lib/components/results/result-detailed-item/result-detailed-item.component';
export { ResultsModule } from './lib/components/results/results.module';
export { ColorGeneratorModule, ColorGeneratorModuleConfig } from './lib/services/color.generator.module';
export { ArlasColorService } from './lib/services/color.generator.service';
export { LayerIdToName } from './lib/components/mapgl-legend/layer-name.pipe';
export { MapglLegendComponent } from './lib/components/mapgl-legend/mapgl-legend.component';
export { MapglLegendModule } from './lib/components/mapgl-legend/mapgl-legend.module';
export { MapglSettingsModule } from './lib/components/mapgl-settings/mapgl-settings.module';
export { MetricComponent } from './lib/components/metric/metric.component';
export { MetricModule } from './lib/components/metric/metric.module';
export { BboxGeneratorComponent } from './lib/components/bbox-generator/bbox-generator.component';
export { BboxFormErrorPipe } from './lib/components/bbox-generator/bbox-form-error.pipe';
export { BboxGeneratorModule } from './lib/components/bbox-generator/bbox-generator.module';
export { PowerbarsComponent } from './lib/components/powerbars/powerbars.component';
export { PowerbarsModule } from './lib/components/powerbars/powerbars.module';
export { PowerbarComponent } from './lib/components/powerbars/powerbar/powerbar.component';
export { PowerbarModule } from './lib/components/powerbars/powerbar/powerbar.module';
export {
  MapglSettingsComponent, MapSettingsService, GeoQuery, GeometrySelectModel, OperationSelectModel, MapglSettingsDialogComponent,
} from './lib/components/mapgl-settings/mapgl-settings.component';
export { WmtsLayerManagerModule } from './lib/components/wmts-layer-manager/wmts-layer-manager.module';
export { WmtsLayerManagerComponent, GetTilesInfo, LayerParam, Dimension } from './lib/components/wmts-layer-manager/wmts-layer-manager.component';
export { WmtsLayerManagertDialogComponent } from './lib/components/wmts-layer-manager/wmts-layer-manager.component';
export { ResultDetailedGridComponent } from './lib/components/results/result-detailed-grid/result-detailed-grid.component';
export { ResultScrollDirective } from './lib/components/results/result-directive/result-scroll.directive';
export { ResultFilterComponent } from './lib/components/results/result-filter/result-filter.component';
export { ResultGridTileComponent } from './lib/components/results/result-grid-tile/result-grid-tile.component';
export { ModeEnum } from './lib/components/results/utils/enumerations/modeEnum';
export { SortEnum } from './lib/components/results/utils/enumerations/sortEnum';
export { FormatNumberModule } from './lib/pipes/format-number/format-number.module';
export { FormatNumberPipe } from './lib/pipes/format-number/format-number.pipe';
export { ShortenNumberModule } from './lib/pipes/shorten-number/shorten-number.module';
export { ShortenNumberPipe } from './lib/pipes/shorten-number/shorten-number.pipe';
export { CalendarTimelineComponent, TranslationDirection } from './lib/components/calendar-timeline/calendar-timeline.component';
export { CalendarTimelineModule } from './lib/components/calendar-timeline/calendar-timeline.module';
export { GetValueModule } from './lib/pipes/get-value/get-value.module';
export { GetValuePipe } from './lib/pipes/get-value/get-value.pipe';
export { GetColorModule } from './lib/pipes/get-color/get-color.module';
export { GetColorPipe } from './lib/pipes/get-color/get-color.pipe';

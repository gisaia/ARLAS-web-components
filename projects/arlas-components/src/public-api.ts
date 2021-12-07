/*
 * Public API Surface of arlas-components
 */




export { ColorGeneratorLoader, AwcColorGeneratorLoader } from './lib/components/componentsUtils';
export { MapLayers, BasemapStyle } from './lib/components/mapgl/model/mapLayers';
export { MapSource } from './lib/components/mapgl/model/mapSource';
export { MapExtend } from './lib/components/mapgl/mapgl.component.util';
export { PowerbarsComponent } from './lib/components/powerbars/powerbars.component';
export { PowerbarsModule } from './lib/components/powerbars/powerbars.module';
export { MetricComponent } from './lib/components/metric/metric.component';
export { MetricModule } from './lib/components/metric/metric.module';
export { ChartType, DataType, Position, SimpleNode, TreeNode, SwimlaneMode, HistogramTooltip } from 'arlas-d3';
export { SortEnum } from './lib/components/results/utils/enumerations/sortEnum';
export { ModeEnum } from './lib/components/results/utils/enumerations/modeEnum';
export { CellBackgroundStyleEnum } from './lib/components/results/utils/enumerations/cellBackgroundStyleEnum';
export { DetailedDataRetriever } from './lib/components/results/utils/detailed-data-retriever';
export { Action, ElementIdentifier, FieldsConfiguration, ResultListOptions } from './lib/components/results/utils/results.utils';
export { Item } from './lib/components/results/model/item';
export { Column } from './lib/components/results/model/column';
export { HistogramComponent } from './lib/components/histogram/histogram.component';
export { HistogramModule } from './lib/components/histogram/histogram.module';
export { DonutComponent } from './lib/components/donut/donut.component';
export { DonutModule } from './lib/components/donut/donut.module';
export { MapglComponent, VisualisationSetConfig, IconConfig } from './lib/components/mapgl/mapgl.component';
export { MapglModule } from './lib/components/mapgl/mapgl.module';
export { ResultListComponent } from './lib/components/results/result-list/result-list.component';
export { ResultItemComponent } from './lib/components/results/result-item/result-item.component';
export { ResultDetailedItemComponent } from './lib/components/results/result-detailed-item/result-detailed-item.component';
export { ResultsModule } from './lib/components/results/results.module';
export { ColorGeneratorModule } from './lib/services/color.generator.module';
export { ArlasColorService } from './lib/services/color.generator.service';
export { MapglImportModule } from './lib/components/mapgl-import/mapgl-import.module';
export { MapglImportComponent } from './lib/components/mapgl-import/mapgl-import.component';
export { MapglLegendModule } from './lib/components/mapgl-legend/mapgl-legend.module';
export { LayerIdToName } from './lib/components/mapgl-legend/layer-name.pipe';
export { MapglLegendComponent } from './lib/components/mapgl-legend/mapgl-legend.component';
export { MapglLayerIconModule } from './lib/components/mapgl-layer-icon/mapgl-layer-icon.module';
export { MapglLayerIconComponent } from './lib/components/mapgl-layer-icon/mapgl-layer-icon.component';
export { FormatNumberModule } from './lib/pipes/format-number/format-number.module';
export { FormatNumberPipe } from './lib/pipes/format-number/format-number.pipe';
export { MapglSettingsModule } from './lib/components/mapgl-settings/mapgl-settings.module';
export { MapglSettingsComponent, MapSettingsService, GeoQuery,
  GeometrySelectModel, OperationSelectModel } from './lib/components/mapgl-settings/mapgl-settings.component';
export { WmtsLayerManagerModule } from './lib/components/wmts-layer-manager/wmts-layer-manager.module';
export { WmtsLayerManagerComponent } from './lib/components/wmts-layer-manager/wmts-layer-manager.component';
export { WmtsLayerManagertDialogComponent } from './lib/components/wmts-layer-manager/wmts-layer-manager.component';

export { ResultDetailedGridComponent } from './lib/components/results/result-detailed-grid/result-detailed-grid.component';
export { ResultScrollDirective } from './lib/components/results/result-directive/result-scroll.directive';
export { ResultFilterComponent } from './lib/components/results/result-filter/result-filter.component';
export { ResultGridTileComponent } from './lib/components/results/result-grid-tile/result-grid-tile.component';

export * from './lib/arlas-components.service';
export * from './lib/arlas-components.component';
export * from './lib/arlas-components.module';

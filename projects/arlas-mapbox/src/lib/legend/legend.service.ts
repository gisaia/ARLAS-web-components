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

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';
import {
  CircleLegend,
  FillLegend,
  getMax, HEATMAP_DENSITY,
  HeatmapLegend,
  INTERPOLATE,
  LabelLegend,
  LayerMetadata,
  Legend, LegendData,
  LegendService,
  LineLegend,
  MATCH,
  MAX_CIRLE_RADIUS,
  MAX_LINE_WIDTH,
  OTHER, PaintValue, PROPERTY_SELECTOR_SOURCE
} from 'arlas-map';
import { CirclePaint, Expression, FillPaint, HeatmapPaint, Layer, LinePaint, StyleFunction, SymbolPaint } from 'mapbox-gl';
import tinycolor from 'tinycolor2';


@Injectable({
  providedIn: 'root'
})
export class MapboxLegendService extends LegendService {

  public constructor(public translate: TranslateService) {
    super();
  }

  public static filterLegend(colorLegendValues: Map<string, {color: string | number; highlight: boolean;}>, filter: any[], field: string) {
    LegendService.filterLegend(colorLegendValues, filter, field);
  }

  public static buildColorLegend(colorExpression: string | StyleFunction | Expression | PaintValue,
    visibleMode: boolean, legendData: Map<string, LegendData>,
    filter?: any, translate?: TranslateService): [Legend, string] {

    return LegendService.buildColorLegend(colorExpression, visibleMode, legendData, filter, translate);
  };

  public static buildRadiusLegend(radiusExpression: string | any, legendData: Map<string, LegendData>): Legend {
    return LegendService.buildRadiusLegend(radiusExpression, legendData);
  };

  protected static buildWidthLegend(lineWidth: number | mapboxgl.StyleFunction | mapboxgl.Expression,
    legendData: Map<string, LegendData>): Legend {
    return LegendService.buildWidthLegend(lineWidth, legendData);
  }

  public getCircleLegend(paint: CirclePaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: Layer): CircleLegend {
    const p: CirclePaint = paint;
    const colors = MapboxLegendService.buildColorLegend(p['circle-color'], visibileMode, legendData, layer.filter, this.translate);
    const strokeColors = MapboxLegendService.buildColorLegend(p['circle-stroke-color'], visibileMode, legendData,
      layer.filter, this.translate);
    const radius = MapboxLegendService.buildRadiusLegend(p['circle-radius'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      strokeColor: strokeColors[0],
      strokeColorPalette: strokeColors[1],
      radius: radius
    });
  }

  public getLineLegend(paint: LinePaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: Layer): LineLegend {
    const p: LinePaint = paint;
    const colors = MapboxLegendService.buildColorLegend(p['line-color'], visibileMode, legendData, layer.filter, this.translate);
    const width = MapboxLegendService.buildWidthLegend(p['line-width'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      width: width,
      dashes: p['line-dasharray']
    });
  }

  public getFillLegend(paint: FillPaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: Layer): FillLegend {
    const p: FillPaint = paint;
    const colors = MapboxLegendService.buildColorLegend(p['fill-color'], visibileMode, legendData, layer.filter, this.translate);
    const metadata = layer.metadata as LayerMetadata;
    let strokeColors: [Legend, string] = [undefined, ''];
    if (!!layer.metadata && !!metadata.stroke) {
      strokeColors = MapboxLegendService.buildColorLegend(metadata.stroke.color, visibileMode, legendData,
        layer.filter, this.translate);

    }
    return ({
      color: colors[0],
      colorPalette: colors[1],
      strokeColor: strokeColors[0],
      strokeColorPalette: strokeColors[1],
    });
  }


  public getHeatmapLegend(paint: HeatmapPaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: Layer): HeatmapLegend {
    const p: HeatmapPaint = paint;
    const colors = MapboxLegendService.buildColorLegend(p['heatmap-color'], visibileMode, legendData, layer.filter, this.translate);
    const radius = MapboxLegendService.buildRadiusLegend(p['heatmap-radius'], legendData);
    if (layer.source.toString().startsWith('feature-metric')) {
      colors[0].visible = false;
    }
    return ({
      color: colors[0],
      colorPalette: colors[1],
      radius: radius
    });
  }


  public getLabelLegend(paint: SymbolPaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: Layer): LabelLegend {
    const p: SymbolPaint = paint;
    const colors = MapboxLegendService.buildColorLegend(p['text-color'], visibileMode, legendData, layer.filter, this.translate);
    const size = MapboxLegendService.buildWidthLegend(p['text-size'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      size: size
    });
  }

  public getColorField(paint: CirclePaint | LinePaint | FillPaint | HeatmapPaint | SymbolPaint, layerType: string): string {
    const key = (layerType === 'symbol' ? 'text' : layerType) + '-color';
    return paint[key]?.[1]?.[1];
  }
}

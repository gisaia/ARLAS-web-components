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
  CircleLegend, FillLegend, getMax, HeatmapLegend, INTERPOLATE,
  LabelLegend, LayerMetadata, Legend, LegendData, LegendService, LineLegend, MATCH,
  MAX_CIRLE_RADIUS, MAX_LINE_WIDTH, PROPERTY_SELECTOR_SOURCE
} from 'arlas-map';
import {
  CirclePaintProps, FillPaintProps, HeatmapPaintProps,
  LinePaintProps, SymbolPaintProps, TypedStyleLayer
} from 'maplibre-gl';

@Injectable({
  providedIn: 'root'
})
export class MaplibreLegendService extends LegendService {

  public constructor(public translate: TranslateService) {
    super();
  }

  public static filterLegend(colorLegendValues: Map<string, string | number>, filter: any[], field: string) {
    LegendService.filterLegend(colorLegendValues, filter, field);
  }

  public static buildColorLegend(colorExpression: string | any, visibleMode: boolean, legendData: Map<string, LegendData>,
    filter?: any, translate?: TranslateService): [Legend, string] {
    return LegendService.buildColorLegend(colorExpression, visibleMode, legendData, filter, translate);

  };

  public static buildRadiusLegend(radiusExpression: string | any, legendData: Map<string, LegendData>): Legend {
    return LegendService.buildRadiusLegend(radiusExpression, legendData);
  };

  protected static buildWidthLegend(lineWidth: number | any,
    legendData: Map<string, LegendData>): Legend {
    return LegendService.buildWidthLegend(lineWidth, legendData);
  }

  public getCircleLegend(paint: CirclePaintProps, visibileMode: boolean, legendData:
    Map<string, LegendData>, layer: TypedStyleLayer): CircleLegend {
    const p: CirclePaintProps = paint;
    const colors = MaplibreLegendService.buildColorLegend(p['circle-color'], visibileMode,
      legendData, layer.filter, this.translate);
    const strokeColors = MaplibreLegendService.buildColorLegend(p['circle-stroke-color'], visibileMode, legendData,
      layer.filter, this.translate);
    const radius = MaplibreLegendService.buildRadiusLegend(p['circle-radius'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      strokeColor: strokeColors[0],
      strokeColorPalette: strokeColors[1],
      radius: radius
    });
  }

  public getLineLegend(paint: LinePaintProps, visibileMode: boolean, legendData: Map<string, LegendData>, layer: TypedStyleLayer): LineLegend {
    const p: LinePaintProps = paint;
    const colors = MaplibreLegendService.buildColorLegend(p['line-color'], visibileMode, legendData, layer.filter, this.translate);
    const width = MaplibreLegendService.buildWidthLegend(p['line-width'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      width: width,
      // todo check dashes
      dashes: p['line-dasharray'] as any
    });
  }

  public getFillLegend(paint: FillPaintProps, visibileMode: boolean, legendData: Map<string, LegendData>, layer: TypedStyleLayer): FillLegend {
    const p: FillPaintProps = paint;
    const colors = MaplibreLegendService.buildColorLegend(p['fill-color'], visibileMode, legendData, layer.filter, this.translate);
    const metadata = layer.metadata as LayerMetadata;
    let strokeColors: [Legend, string] = [undefined, ''];
    if (!!layer.metadata && !!metadata.stroke) {
      strokeColors = MaplibreLegendService.buildColorLegend(metadata.stroke.color, visibileMode, legendData,
        layer.filter, this.translate);
    }
    return ({
      color: colors[0],
      colorPalette: colors[1],
      strokeColor: strokeColors[0],
      strokeColorPalette: strokeColors[1],
    });
  }


  public getHeatmapLegend(paint: HeatmapPaintProps, visibileMode: boolean, legendData: Map<string, LegendData>,
    layer: TypedStyleLayer): HeatmapLegend {
    const p: HeatmapPaintProps = paint;
    const colors = MaplibreLegendService.buildColorLegend(p['heatmap-color'], visibileMode, legendData, layer.filter, this.translate);
    const radius = MaplibreLegendService.buildRadiusLegend(p['heatmap-radius'], legendData);
    if (layer.source.toString().startsWith('feature-metric')) {
      colors[0].visible = false;
    }
    return ({
      color: colors[0],
      colorPalette: colors[1],
      radius: radius
    });
  }

  public getLabelLegend(paint: SymbolPaintProps, visibileMode: boolean, legendData: Map<string, LegendData>,
    layer: TypedStyleLayer): LabelLegend {
    const p: SymbolPaintProps = paint;
    const colors = MaplibreLegendService.buildColorLegend(p['text-color'], visibileMode, legendData, layer.filter, this.translate);
    const size = MaplibreLegendService.buildWidthLegend(p['text-size'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      size: size
    });
  }

  public getColorField(paint: CirclePaintProps | LinePaintProps | FillPaintProps | HeatmapPaintProps | SymbolPaintProps,
      layerType: string): string {
    const key = (layerType === 'symbol' ? 'text' : layerType) + '-color';
    return paint[key]?.[1]?.[1];
  }
}

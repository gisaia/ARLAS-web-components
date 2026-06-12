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
import {
  ArlasDataLayer, CircleLegend, FillLegend, HeatmapLegend, LabelLegend,
  Legend, LegendData, LegendService, LineLegend, PaintValue
} from 'arlas-map';
import { CirclePaint, Expression, FillPaint, HeatmapPaint, LinePaint, StyleFunction, SymbolLayout, SymbolPaint } from 'mapbox-gl';


@Injectable({
  providedIn: 'root'
})
export class MapboxLegendService extends LegendService {

  public constructor(private readonly translate: TranslateService) {
    super();
  }

  public static filterLegend(colorLegendValues: Map<string, {color: string | number; highlight: boolean;}>, filter: any[], field: string) {
    LegendService.filterLegend(colorLegendValues, filter, field);
  }

  public static buildColorLegend(colorExpression: string | StyleFunction | Expression | PaintValue | undefined,
    visibleMode: boolean, legendData: Map<string, LegendData>, filter: any, translate: TranslateService
  ): [Legend, string] {
    return LegendService.buildColorLegend(colorExpression, visibleMode, legendData, filter, translate);
  };

  public static buildRadiusLegend(radiusExpression: string | any, legendData: Map<string, LegendData>): Legend {
    return LegendService.buildRadiusLegend(radiusExpression, legendData);
  };

  protected static buildWidthLegend(lineWidth: number | mapboxgl.StyleFunction | mapboxgl.Expression | undefined,
    legendData: Map<string, LegendData>): Legend {
    return LegendService.buildWidthLegend(lineWidth, legendData);
  }

  public getCircleLegend(paint: CirclePaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): CircleLegend {
    const colors = MapboxLegendService.buildColorLegend(paint['circle-color'], visibileMode, legendData, layer.filter, this.translate);
    const strokeColors = MapboxLegendService.buildColorLegend(paint['circle-stroke-color'], visibileMode, legendData,
      layer.filter, this.translate);
    const radius = MapboxLegendService.buildRadiusLegend(paint['circle-radius'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      strokeColor: strokeColors[0],
      strokeColorPalette: strokeColors[1],
      radius: radius
    });
  }

  public getLineLegend(paint: LinePaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): LineLegend {
    const colors = MapboxLegendService.buildColorLegend(paint['line-color'], visibileMode, legendData, layer.filter, this.translate);
    const width = MapboxLegendService.buildWidthLegend(paint['line-width'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      width: width,
      dashes: paint['line-dasharray'] as number[]
    });
  }

  public getFillLegend(paint: FillPaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): FillLegend {
    const colors = MapboxLegendService.buildColorLegend(paint['fill-color'], visibileMode, legendData, layer.filter, this.translate);
    let strokeColors: [Legend, string] = [{}, ''];
    if (layer.metadata?.stroke) {
      strokeColors = MapboxLegendService.buildColorLegend(layer.metadata.stroke.color, visibileMode, legendData,
        layer.filter, this.translate);

    }
    return ({
      color: colors[0],
      colorPalette: colors[1],
      strokeColor: strokeColors[0],
      strokeColorPalette: strokeColors[1],
    });
  }


  public getHeatmapLegend(paint: HeatmapPaint, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): HeatmapLegend {
    const colors = MapboxLegendService.buildColorLegend(paint['heatmap-color'], visibileMode, legendData, layer.filter, this.translate);
    const radius = MapboxLegendService.buildRadiusLegend(paint['heatmap-radius'], legendData);
    if (layer.source.toString().startsWith('feature-metric')) {
      colors[0].visible = false;
    }
    return ({
      color: colors[0],
      colorPalette: colors[1],
      radius: radius
    });
  }


  public getLabelLegend(paint: SymbolPaint, layout: SymbolLayout,
    visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer
  ): LabelLegend {
    const colors = MapboxLegendService.buildColorLegend(paint['text-color'], visibileMode, legendData, layer.filter, this.translate);
    const size = MapboxLegendService.buildWidthLegend(layout['text-size'], legendData);
    return ({
      color: colors[0],
      colorPalette: colors[1],
      size: size
    });
  }

  public getColorField(paint: CirclePaint | LinePaint | FillPaint | HeatmapPaint | SymbolPaint, layerType: string): string {
    const key = (layerType === 'symbol' ? 'text' : layerType) + '-color';
    return (paint as any)[key]?.[1]?.[1];
  }
}

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
import tinycolor from 'tinycolor2';

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';
import {
  CircleLegend, FillLegend, getMax, HEATMAP_DENSITY, HeatmapLegend, INTERPOLATE,
  LabelLegend, LayerMetadata, Legend, LegendData, LegendService, LineLegend, MATCH,
  MAX_CIRLE_RADIUS, MAX_LINE_WIDTH, OTHER, PROPERTY_SELECTOR_SOURCE
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
    const colorLegend: Legend = { visible: true };
    let colorPalette = '';
    if (typeof colorExpression === 'string') {
      colorLegend.type = PROPERTY_SELECTOR_SOURCE.fix;
      colorLegend.fixValue = colorExpression;
    } else if (Array.isArray(colorExpression)) {
      if (colorExpression.length === 2) {
        /** color = ["get", "field"]  ==> Generated or Provided */
        const field = colorExpression[1];
        colorLegend.title = field;
        LegendService.setProvidedColorLegend(colorLegend, field, legendData, filter, translate);
      } else if (colorExpression.length >= 3) {
        if (colorExpression[0] === MATCH) {
          LegendService.setMatchColorLegend(colorLegend, colorExpression, legendData, filter, translate);
        } else if (colorExpression[0] === INTERPOLATE) {
          colorPalette = LegendService.setInterpolatedColorLegend(colorLegend, colorExpression, legendData, visibleMode);
        }
      }
    }

    colorLegend.visible = visibleMode;
    return [colorLegend, colorPalette];
  };

  public static buildRadiusLegend(radiusExpression: string | any, legendData: Map<string, LegendData>): Legend {
    const radiusLegend: Legend = {};
    const circleRadiusEvolution: Array<HistogramData> = new Array();
    if (Array.isArray(radiusExpression)) {
      if (radiusExpression.length >= 3) {
        if (radiusExpression[0] === INTERPOLATE) {
          const field = radiusExpression[2][1];
          radiusExpression.filter((w, i) => i >= 3).forEach((w, i) => {
            if (i % 2 === 0) {
              circleRadiusEvolution.push({ key: w, value: radiusExpression[i + 1 + 3] });
            }
          });
          radiusLegend.title = field;
          if (legendData?.get(field)) {
            radiusLegend.minValue = legendData.get(field).minValue;
            radiusLegend.maxValue = legendData.get(field).maxValue;
          } else {
            radiusLegend.minValue = circleRadiusEvolution[0].key + '';
            radiusLegend.maxValue = circleRadiusEvolution[circleRadiusEvolution.length - 1].key + '';
          }
          radiusLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
          const maxCircleRadius = getMax(circleRadiusEvolution);
          if (maxCircleRadius > MAX_CIRLE_RADIUS) {
            circleRadiusEvolution.forEach(lw => lw.value = lw.value * MAX_CIRLE_RADIUS / maxCircleRadius);
          }
          radiusLegend.histogram = circleRadiusEvolution;
        }
      }
    }
    return radiusLegend;

  };

  private static buildWidthLegend(width: number | any,
    data: Map<string, LegendData>): Legend {
    /** if the line width is fix then it is not added to the legend*/
    const legend: Legend = {};
    if (Array.isArray(width)) {
      if (width.length >= 3) {
        if (width[0] === INTERPOLATE) {
          const field = width[2][1];
          legend.title = field;
          if (data?.get(field)) {
            legend.minValue = data.get(field).minValue;
            legend.maxValue = data.get(field).maxValue;
          }
          legend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
          const lineWidthEvolution: Array<HistogramData> = new Array();
          width.filter((w, i) => i >= 3).forEach((w, i) => {
            if (i % 2 === 0) {
              lineWidthEvolution.push({ key: w, value: width[i + 1 + 3] });
            }
          });
          const maxLineWidth = getMax(lineWidthEvolution);
          if (maxLineWidth > MAX_LINE_WIDTH) {
            lineWidthEvolution.forEach(lw => lw.value = lw.value * MAX_LINE_WIDTH / maxLineWidth);
          }
          legend.histogram = lineWidthEvolution;
        }
      }
    }
    return legend;
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

}

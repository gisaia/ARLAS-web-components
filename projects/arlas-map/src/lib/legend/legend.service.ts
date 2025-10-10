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
import { HistogramData } from 'arlas-d3';
import { Subject } from 'rxjs';
import tinycolor from 'tinycolor2';
import { HEATMAP_DENSITY, IN, INTERPOLATE, MATCH, NOT_IN, OTHER } from '../map/model/filters';
import { ArlasDataLayer } from '../map/model/layers';
import { CircleLegend, FillLegend, HeatmapLegend, LabelLegend, Legend, LegendData, LineLegend, PROPERTY_SELECTOR_SOURCE } from './legend.config';
import { getMax, MAX_CIRLE_RADIUS, MAX_LINE_WIDTH } from './legend.tools';


@Injectable({
  providedIn: 'root'
})
export abstract class LegendService {
  /** Emits for each layerId that was hovered the properties associated to the features in order to highlight the right ones in the legend */
  protected highlightSource = new Subject<{layerId: string; properties: Array<{[name: string]: any;}>; }>();
  public highlight$ = this.highlightSource.asObservable();

  public abstract getCircleLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): CircleLegend;

  public abstract getLineLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): LineLegend;

  public abstract getFillLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): FillLegend;

  public abstract getHeatmapLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): HeatmapLegend;

  public abstract getLabelLegend(paint: any, visibileMode: boolean, legendData: Map<string, LegendData>, layer: ArlasDataLayer): LabelLegend;

  /** Based on the paint of a layer and its type, returns the field used for the color matching */
  public abstract getColorField(paint: any, layerType: string): string;

  public highlightFeatures(layerId: string, features: Array<GeoJSON.Feature<GeoJSON.Geometry>>) {
    this.highlightSource.next({layerId, properties: features.map(f => f.properties)});
  }

  public static setProvidedColorLegend(colorLegend: Legend, field: string,
    legendData: Map<string, LegendData>, filter, translate: TranslateService) {
    colorLegend.title = field;
    if (!Array.isArray(field)) {
      colorLegend.type = PROPERTY_SELECTOR_SOURCE.provided;
      if (field.endsWith('_arlas__color')) {
        colorLegend.type = PROPERTY_SELECTOR_SOURCE.generated;
      }
      colorLegend.manualValues = new Map();
      if (legendData?.get(field)) {
        const keysToColors = legendData.get(field).keysColorsMap;
        const colorList = Array.from(keysToColors.keys()).map(k => [k, keysToColors.get(k)]).flat();
        for (let i = 0; i < colorList.length; i += 2) {
          colorLegend.manualValues.set(translate ? translate.instant(colorList[i]) : colorList[i], { color: colorList[i + 1], highlight: false});
        }
        if (colorList.length === 0) {
          colorLegend.manualValues.set('', { color: '#eee', highlight: false });
        }
      } else {
        colorLegend.manualValues.set('', { color: '#eee', highlight: false });
      }
      if (filter) {
        LegendService.filterLegend(colorLegend.manualValues, filter,
          (field).endsWith('_arlas__color') ? (field).slice(0, -13) : field);
      }
    }
  }


  public static setMatchColorLegend(colorLegend: Legend, colorExpression: any[], legendData: Map<string, LegendData>,
    filter, translate: TranslateService) {
    /** color = ["match", ["get", "field"], .... ]**/
    colorLegend.type = PROPERTY_SELECTOR_SOURCE.manual;
    const colorsLength = colorExpression.length;
    let hasDefaultColor = false;
    if (colorsLength % 2 !== 0) {
      hasDefaultColor = true;
    }
    const field = colorExpression[1].length === 2 ? colorExpression[1][1] : '';
    colorLegend.title = field;
    colorLegend.manualValues = new Map();
    let keysToColors: Map<string, string>;
    if (legendData?.get(field + '_color')) {
      // If there is a legendData, use only the colors in the keysToColors
      keysToColors = legendData.get(field + '_color').keysColorsMap;
    } else {
      // If no legendData for this field, use all the colors of colorExpression
      keysToColors = new Map();
      for (let i = 2; i < colorExpression.length; i += 2) {
        if (hasDefaultColor && i === colorsLength - 3) {
          keysToColors.set(colorExpression[i] + '', colorExpression[i + 1]);
          keysToColors.set(OTHER, colorExpression[i + 2]);
          break;
        } else {
          keysToColors.set(colorExpression[i] + '', colorExpression[i + 1]);
        }
      }
    }
    for (let i = 2; i < colorExpression.length; i += 2) {
      if (hasDefaultColor && i === colorsLength - 3) {
        if (keysToColors.has(colorExpression[i] + '')) {
          colorLegend.manualValues.set(translate ? translate.instant(colorExpression[i] + '') : colorExpression[i],
            {color: colorExpression[i + 1], highlight: false});
        }
        colorLegend.manualValues.set(translate ? translate.instant(OTHER) : OTHER, {color: colorExpression[i + 2], highlight: false});
        break;
      } else if (keysToColors.has(colorExpression[i] + '')) {
        colorLegend.manualValues.set(translate ? translate.instant(colorExpression[i] + '') : colorExpression[i],
          {color: colorExpression[i + 1], highlight: false});
      }
    }

    if (filter) {
      LegendService.filterLegend(colorLegend.manualValues, filter, field);
    }
  }


  public static setInterpolatedColorLegend(colorLegend: Legend, colorExpression: any[],
    legendData: Map<string, LegendData>,
    visibleMode: boolean) {
    colorLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
    /** color = ["interplate", ['linear'], ["get", "field"], 0, 1... ]**/
    // todo throw exception if interpolation is not linear
    const field = colorExpression[2].length === 2 ? colorExpression[2][1] : HEATMAP_DENSITY;
    colorLegend.title = field;
    colorLegend.interpolatedValues = [];
    const palette = [];
    const colors = colorExpression.slice(3);
    colors.forEach((c, i) => {
      if (i % 2 === 0) {
        palette.push({
          proportion: c,
          value: colors[i + 1]
        });
      }
    });
    const minimum = palette[0].proportion;
    const maximum = palette.slice(-1)[0].proportion;
    palette.forEach(c => colorLegend.interpolatedValues.push(c.value));
    const colorValues = colorExpression.filter((c, i) => i > 2 && i % 2 !== 0);
    if (legendData?.get(field) && field !== 'count') {
      colorLegend.minValue = legendData.get(field).minValue;
      colorLegend.maxValue = legendData.get(field).maxValue;
      // For heatmaps, the count is used to fetch data, so we use it for the legend
    } else if (field === HEATMAP_DENSITY && legendData?.get('count')) {
      colorLegend.minValue = legendData.get('count').minValue;
      colorLegend.maxValue = legendData.get('count').maxValue;
    } else {
      colorLegend.minValue = colorValues[0] + '';
      colorLegend.maxValue = colorValues[colorValues.length - 1] + '';
    }
    if (!visibleMode) {
      /** apply greyscale because the layer is not visible */
      colorLegend.interpolatedValues = colorLegend.interpolatedValues
        .map((c) => tinycolor(c.toString()).greyscale().lighten(20).toHexString());
      palette.forEach(p => {
        p.value = tinycolor(p.value.toString()).greyscale().lighten(20).toHexString();
      });
    }
    return palette.map(c => c.value + ' ' + (100 * (c.proportion - minimum) / (maximum - minimum)) + '%').join(',');

  }

  public static filterLegend(colorLegendValues: Map<string, {color: string | number; highlight: boolean;}>, filter: any[], field: string) {
    filter.forEach((f, idx) => {
      if (idx !== 0 && idx !== filter.length - 1) {
        switch (f[0]) {
          case IN: {
            if (f[1][1] === field) {
              const valuesToKeep: Array<string> = f[2][1];
              colorLegendValues.forEach((val, key) => {
                if (!(valuesToKeep.includes(key))) {
                  colorLegendValues.delete(key);
                }
              });
            }
            break;
          }
          case NOT_IN: {
            if (f[1][0] === IN && f[1][1][1] === field) {
              const valuesToExclude: Array<string> = f[1][2][1];
              valuesToExclude.forEach(value => {
                colorLegendValues.delete(value);
              });
            }
            break;
          }
        }
      }
    });
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
        // Filter out the zoom-dependent radius layers (circle-heatmap)
        if (radiusExpression[0] === INTERPOLATE && radiusExpression[2].length > 1) {
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

  protected static buildWidthLegend(lineWidth: number | any,
    legendData: Map<string, LegendData>): Legend {
    /** if the line width is fix then it is not added to the legend*/
    const widthLegend: Legend = {};
    if (Array.isArray(lineWidth)) {
      if (lineWidth.length >= 3) {
        if (lineWidth[0] === INTERPOLATE) {
          const field = lineWidth[2][1];
          widthLegend.title = field;
          if (legendData?.get(field)) {
            widthLegend.minValue = legendData.get(field).minValue;
            widthLegend.maxValue = legendData.get(field).maxValue;
          }
          widthLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
          const lineWidthEvolution: Array<HistogramData> = new Array();
          lineWidth.filter((w, i) => i >= 3).forEach((w, i) => {
            if (i % 2 === 0) {
              lineWidthEvolution.push({ key: w, value: lineWidth[i + 1 + 3] });
            }
          });
          const maxLineWidth = getMax(lineWidthEvolution);
          if (maxLineWidth > MAX_LINE_WIDTH) {
            lineWidthEvolution.forEach(lw => lw.value = lw.value * MAX_LINE_WIDTH / maxLineWidth);
          }
          widthLegend.histogram = lineWidthEvolution;
        }
      }
    }
    return widthLegend;
  }

}

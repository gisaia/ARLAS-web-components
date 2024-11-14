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
import { CircleLegend, getMax, Legend, LegendData, PROPERTY_SELECTOR_SOURCE } from 'arlas-map';
import { TranslateService } from '@ngx-translate/core';
import { CirclePaint, FillPaint, HeatmapPaint, Layer, LinePaint, SymbolPaint } from 'mapbox-gl';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';
import { MAX_CIRLE_RADIUS } from 'arlas-map';
import { LineLegend } from 'arlas-map';
import { MAX_LINE_WIDTH } from 'arlas-map';
import { LayerMetadata } from 'arlas-map';
import { FillLegend, HeatmapLegend } from 'arlas-map';
import { LabelLegend } from 'arlas-map';

export const GET = 'get';
export const MATCH = 'match';
export const INTERPOLATE = 'interpolate';
export const OTHER = marker('other_color');
export const IN = 'in';
export const NOT_IN = '!';
export const HEATMAP_DENSITY = 'Heatmap-density';

@Injectable({
    providedIn: 'root'
})
export class MapboxLegendService {

    public constructor(public translate: TranslateService) {

    }
    public static buildColorLegend(colorExpression: string | any, visibleMode: boolean, legendData: Map<string, LegendData>,
        filter?: any, translate?: TranslateService): [Legend, string] {

        return [undefined, '']
    };

    public static buildRadiusLegend(radiusExpression: string | any, legendData: Map<string, LegendData>): Legend {
        const radiusLegend: Legend = {}
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
                    if (legendData && legendData.get(field)) {
                        radiusLegend.minValue = legendData.get(field).minValue;
                        radiusLegend.maxValue = legendData.get(field).maxValue;
                    } else {
                        radiusLegend.minValue = circleRadiusEvolution[0].key + '';
                        radiusLegend.maxValue = circleRadiusEvolution[circleRadiusEvolution.length - 1].key + '';
                    }
                    radiusLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
                    const maxCircleRadius = getMax(circleRadiusEvolution);
                    if (maxCircleRadius > MAX_CIRLE_RADIUS) {
                        circleRadiusEvolution.map(lw => {
                            lw.value = lw.value * MAX_CIRLE_RADIUS / maxCircleRadius;
                            return lw;
                        });
                    }
                    radiusLegend.histogram = circleRadiusEvolution;
                    // if (!!this.circleRadiusLegend.interpolatedElement) {
                    //   drawCircleSupportLine(this.circleRadiusLegend.interpolatedElement.nativeElement, circleRadiusEvolution, this.colorLegend,
                    //     this.LEGEND_WIDTH, Math.min(this.MAX_CIRLE_RADIUS, maxCircleRadius) * 2);
                    // }
                }
            }
        }
        return radiusLegend

    };

    private static buildWidthLegend(lineWidth: number | mapboxgl.StyleFunction | mapboxgl.Expression,
        legendData: Map<string, LegendData>): Legend {
        /** if the line width is fix then it is not added to the legend*/
        const widthLegend: Legend = {};
        if (Array.isArray(lineWidth)) {
            if (lineWidth.length >= 3) {
                if (lineWidth[0] === INTERPOLATE) {
                    const field = lineWidth[2][1];
                    widthLegend.title = field;
                    if (legendData && legendData.get(field)) {
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
                        lineWidthEvolution.map(lw => {
                            lw.value = lw.value * MAX_LINE_WIDTH / maxLineWidth;
                            return lw;
                        });
                    }
                    widthLegend.histogram = lineWidthEvolution;
                }
            }
        }
        return widthLegend;
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
        })
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

}

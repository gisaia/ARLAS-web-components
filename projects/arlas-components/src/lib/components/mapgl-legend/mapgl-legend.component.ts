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

import { AfterViewInit, Component, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';
import { scaleLinear, ScaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { area, curveLinear, line } from 'd3-shape';
import * as mapboxgl from 'mapbox-gl';
import { Subject, takeUntil } from 'rxjs';
import * as tinycolor from 'tinycolor2';
import { ArlasColorService } from '../../services/color.generator.service';
import { Legend, LegendData, PROPERTY_SELECTOR_SOURCE } from '../mapgl/mapgl.component.util';
import { ARLAS_ID, FILLSTROKE_LAYER_PREFIX, HOVER_LAYER_PREFIX, SELECT_LAYER_PREFIX } from '../mapgl/model/mapLayers';
import { MapglLegendItemComponent } from './mapgl-legend-item/mapgl-legend-item.component';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const GET = 'get';
export const MATCH = 'match';
export const INTERPOLATE = 'interpolate';
export const OTHER = marker('other_color');

export const IN = 'in';
export const NOT_IN = '!';

export const HEATMAP_DENSITY = 'Heatmap-density';

@Component({
  selector: 'arlas-mapgl-legend',
  templateUrl: './mapgl-legend.component.html',
  styleUrls: ['./mapgl-legend.component.scss']
})
export class MapglLegendComponent implements OnInit, AfterViewInit, OnChanges {
  /**
   * @Input : Angular
   * @description Layer object
   */
  @Input() public layer: mapboxgl.Layer;
  /**
   * @Input : Angular
   * @description Collection of the layer
   */
  @Input() public collection: string;
  /**
   * @Input : Angular
   * @description Current zoom level of the map
   */
  @Input() public zoom: number;
  /**
   * @Input : Angular
   * @description Whether the layer is enabled or disabled.
   */
  @Input() public enabled: boolean;
  /**
   * @Input : Angular
   * @description Subject of [collection, [field, legendData]] map. The map subscribes to it to keep
   * the legend updated with the data displayed on the map.
   */
  @Input() public legendUpdater: Subject<Map<string, Map<string, LegendData>>> = new Subject();
  /**
   * @Input : Angular
   * @description Subject of [field, boolean] map. The map subscribes to it to keep
   * the legend updated with the visibility of the layer.
   */
  @Input() public visibilityUpdater: Subject<Map<string, boolean>> = new Subject();

  /**
   * @Output : Angular
   * @description Notifies the parent component that this layer is visible or not
   */
  @Output() public visibilityStatus: Subject<boolean> = new Subject();

  /**
   * @Output : Angular
   * @description Notifies the parent component that the user wants to download the layer
   */
  @Output() public downloadSourceEmitter: Subject<{ layer: mapboxgl.Layer; downloadType: string; }> = new Subject();

  @ViewChild('width_legend', { static: false }) public lineWidthLegend: MapglLegendItemComponent;
  @ViewChild('radius_legend', { static: false }) public circleRadiusLegend: MapglLegendItemComponent;

  public colorLegend: Legend = {};
  public lineDasharray: Array<number>;
  public strokeColorLegend: Legend = {};
  public widthLegend: Legend = {};
  public radiusLegend: Legend = {};
  public detail = false;
  public visibleMode = false;
  public PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;

  private legendData: Map<string, LegendData> = new Map();
  private MAX_LINE_WIDTH = 10;
  private MAX_CIRLE_RADIUS = 7;
  private LEGEND_WIDTH = 210;
  public colorPalette = '';
  public strokeColorPalette = '';

  private _onDestroy$ = new Subject<boolean>();

  public constructor(
    public translate: TranslateService,
    public colorService: ArlasColorService) { }

  public ngOnInit() {
    this.legendUpdater
      .pipe(takeUntil(this._onDestroy$))
      .subscribe(legendDataPerCollection => {
        this.legendData = legendDataPerCollection.get(this.collection);
        if (!!this.layer) {
          this.drawLegends(this.visibleMode);
        }
      });
    this.visibilityUpdater
      .pipe(takeUntil(this._onDestroy$))
      .subscribe(visibilityUpdater => {
        /** check legend visibility according to Data source status (mapcontirbutor) */
        if (!!this.layer) {
          /** if the visibility updater contains the layer we pick the visibility status otherwise we keep it unchaged */
          this.visibleMode = visibilityUpdater.get(this.layer.id) !== undefined ? visibilityUpdater.get(this.layer.id) : this.visibleMode;
        } else {
          this.visibleMode = false;
        }
        /** check legend visibility according to VisibilityRules */
        if (this.visibleMode && this.layer && !!this.layer.minzoom && !!this.layer.maxzoom) {
          this.visibleMode = (this.zoom <= this.layer.maxzoom && this.zoom >= this.layer.minzoom);
        }
        /** check legend visibility according to legend enabled or not */
        if (!this.enabled) {
          this.visibleMode = false;
        }
        if (!this.visibleMode) {
          this.detail = this.visibleMode;
        }
        /** check legend visibility for external layers that are not set by config nor map contributors */
        if (this.layer && !this.layer.id.startsWith(ARLAS_ID) &&
          !this.layer.id.startsWith(FILLSTROKE_LAYER_PREFIX) && !this.layer.id.startsWith(HOVER_LAYER_PREFIX)
          && !this.layer.id.startsWith(SELECT_LAYER_PREFIX)) {
          this.visibleMode = this.enabled;
          if (!!this.layer.metadata && this.layer.metadata.showLegend === false) {
            this.visibleMode = false;
          }
        }
        if (!!this.layer) {
          this.drawLegends(this.visibleMode);
        }
        this.visibilityStatus.next(this.visibleMode);
      });
  }

  public ngAfterViewInit() {
    if (!!this.layer) {
      this.drawLegends(this.visibleMode);
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['layer'] !== undefined) {
      if (!!this.layer) {
        this.drawLegends(this.visibleMode);
      }
    }
  }

  public ngOnDestroy() {
    this._onDestroy$.next(true);
    this._onDestroy$.complete();
  }

  public downloadLayerSource(layer: mapboxgl.Layer, downloadType: string): void {
    const download = {
      layer,
      downloadType
    };
    this.downloadSourceEmitter.next(download);
  }

  public showDetail(event: Event) {
    this.detail = !this.detail;
    event.stopPropagation();
  }

  /** Parses the `paint` attribute of a layer and draws the legend elements such as
   * - color palette
   * - line width evolution
   * - circle radius evolution
   */
  private drawLegends(visibileMode: boolean): void {
    const type = this.layer.type;
    const paint = this.layer.paint;
    const metadata = this.layer.metadata;
    switch (type) {
      case 'circle': {
        const p: mapboxgl.CirclePaint = (paint as mapboxgl.CirclePaint);
        const colors = MapglLegendComponent.buildColorLegend(p['circle-color'], visibileMode, this.legendData, this.layer.filter, this.translate);
        const strokeColors = MapglLegendComponent.buildColorLegend(p['circle-stroke-color'], visibileMode, this.legendData,
          this.layer.filter, this.translate);
        this.buildCircleRadiusLegend(p['circle-radius']);
        this.colorLegend = colors[0];
        this.strokeColorLegend = strokeColors[0];
        this.colorPalette = colors[1];
        this.strokeColorPalette = strokeColors[1];
        break;
      }
      case 'line': {
        const p: mapboxgl.LinePaint = (paint as mapboxgl.LinePaint);
        const colors = MapglLegendComponent.buildColorLegend(p['line-color'], visibileMode, this.legendData, this.layer.filter, this.translate);
        this.buildWidthLegend(p['line-width']);
        this.lineDasharray = p['line-dasharray'];
        this.colorLegend = colors[0];
        this.colorPalette = colors[1];
        break;
      }
      case 'fill': {
        const p: mapboxgl.FillPaint = (paint as mapboxgl.FillPaint);
        const colors = MapglLegendComponent.buildColorLegend(p['fill-color'], visibileMode, this.legendData, this.layer.filter, this.translate);
        this.colorLegend = colors[0];
        this.colorPalette = colors[1];
        if (!!metadata && !!metadata.stroke) {
          const strokeColors = MapglLegendComponent.buildColorLegend(metadata.stroke.color, visibileMode, this.legendData,
            this.layer.filter, this.translate);
          this.strokeColorLegend = strokeColors[0];
          this.strokeColorPalette = strokeColors[1];
        }
        break;
      }
      case 'heatmap': {
        const p: mapboxgl.HeatmapPaint = (paint as mapboxgl.HeatmapPaint);
        const colors = MapglLegendComponent.buildColorLegend(
          p['heatmap-color'], visibileMode, this.legendData, this.layer.filter, this.translate
        );
        this.buildCircleRadiusLegend(p['heatmap-radius']);
        this.colorLegend = colors[0];
        this.colorPalette = colors[1];
        if (this.layer.source.toString().startsWith('feature-metric')) {
          this.colorLegend.visible = false;
        }
        break;
      }
      case 'symbol': {
        const p: mapboxgl.SymbolPaint = (paint as mapboxgl.SymbolPaint);
        const colors = MapglLegendComponent.buildColorLegend(p['text-color'], visibileMode, this.legendData, this.layer.filter, this.translate);
        this.colorLegend = colors[0];
        this.colorPalette = colors[1];
        const l: mapboxgl.SymbolLayout = (paint as mapboxgl.SymbolLayout);
        this.buildWidthLegend(l['text-size']);
        break;
      }
    }
    if (!this.colorLegend.fixValue) {
      this.colorLegend.fixValue = visibileMode ? '#444' : '#d3d3d3';
    }
    const layer = Object.assign({}, this.layer);
    this.layer = null;
    this.layer = Object.assign({}, layer);
  }

  public static filterLegend(colorLegendValues: Map<string, string | number>, filter: any[], field: string) {
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

  public static buildColorLegend(colorExpression: string | mapboxgl.StyleFunction | mapboxgl.Expression, visibleMode: boolean,
    legendData: Map<string, LegendData>, filter?: any[], translate?: TranslateService): [Legend, string] {
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
        if (!Array.isArray(field)) {
          if ((field as string).endsWith('_arlas__color')) {
            colorLegend.type = PROPERTY_SELECTOR_SOURCE.generated;
          } else {
            colorLegend.type = PROPERTY_SELECTOR_SOURCE.provided;
          }
          colorLegend.manualValues = new Map();
          if (legendData && legendData.get(field)) {
            const keysToColors = legendData.get(field).keysColorsMap;
            const colorList = Array.from(keysToColors.keys()).map(k => [k, keysToColors.get(k)]).flat();
            for (let i = 0; i < colorList.length; i += 2) {
              colorLegend.manualValues.set(translate ? translate.instant(colorList[i]) : colorList[i], colorList[i + 1]);
            }
            if (colorList.length === 0) {
              colorLegend.manualValues.set('', '#eee');
            }
          } else {
            colorLegend.manualValues.set('', '#eee');
          }

          if (!!filter) {
            MapglLegendComponent.filterLegend(colorLegend.manualValues, filter,
              (field as string).endsWith('_arlas__color') ? (field as string).slice(0, -13) : field);
          }
        }
      } else if (colorExpression.length >= 3) {
        if (colorExpression[0] === MATCH) {
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
          if (legendData && legendData.get(field + '_color')) {
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
                  colorExpression[i + 1]);
              }
              colorLegend.manualValues.set(translate ? translate.instant(OTHER) : OTHER, colorExpression[i + 2]);
              break;
            } else {
              if (keysToColors.has(colorExpression[i] + '')) {
                colorLegend.manualValues.set(translate ? translate.instant(colorExpression[i] + '') : colorExpression[i],
                  colorExpression[i + 1]);
              }
            }
          }

          if (!!filter) {
            MapglLegendComponent.filterLegend(colorLegend.manualValues, filter, field);
          }
        } else if (colorExpression[0] === INTERPOLATE) {
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
          if (legendData && legendData.get(field) && field !== 'count') {
            colorLegend.minValue = legendData.get(field).minValue;
            colorLegend.maxValue = legendData.get(field).maxValue;
            // For heatmaps, the count is used to fetch data, so we use it for the legend
          } else if (field === HEATMAP_DENSITY && legendData && legendData.get('count')) {
            colorLegend.minValue = legendData.get('count').minValue;
            colorLegend.maxValue = legendData.get('count').maxValue;
          } else {
            colorLegend.minValue = colorValues[0] + '';
            colorLegend.maxValue = colorValues[colorValues.length - 1] + '';
          }
          if (!visibleMode) {
            /** apply greyscale because the layer is not visible */
            colorLegend.interpolatedValues = colorLegend.interpolatedValues
              .map((c) => tinycolor.default(c.toString()).greyscale().lighten(20).toHexString());
            palette.forEach(p => {
              p.value = tinycolor.default(p.value.toString()).greyscale().lighten(20).toHexString();
            });
          }
          colorPalette = palette.map(c => c.value + ' ' + (100 * (c.proportion - minimum) / (maximum - minimum)) + '%').join(',');
        }
      }
    }

    colorLegend.visible = visibleMode;
    return [colorLegend, colorPalette];
  }

  private buildWidthLegend(lineWidth: number | mapboxgl.StyleFunction | mapboxgl.Expression): void {
    /** if the line width is fix then it is not added to the legend*/
    if (Array.isArray(lineWidth)) {
      if (lineWidth.length >= 3) {
        if (lineWidth[0] === INTERPOLATE) {
          const field = lineWidth[2][1];
          this.widthLegend.title = field;
          if (this.legendData && this.legendData.get(field)) {
            this.widthLegend.minValue = this.legendData.get(field).minValue;
            this.widthLegend.maxValue = this.legendData.get(field).maxValue;
          }
          this.widthLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
          const lineWidthEvolution: Array<HistogramData> = new Array();
          lineWidth.filter((w, i) => i >= 3).forEach((w, i) => {
            if (i % 2 === 0) {
              lineWidthEvolution.push({ key: w, value: lineWidth[i + 1 + 3] });
            }
          });
          const maxLineWidth = getMax(lineWidthEvolution);
          if (maxLineWidth > this.MAX_LINE_WIDTH) {
            lineWidthEvolution.map(lw => {
              lw.value = lw.value * this.MAX_LINE_WIDTH / maxLineWidth;
              return lw;
            });
          }
          if (!!this.lineWidthLegend.interpolatedElement) {
            drawLineWidth(this.lineWidthLegend.interpolatedElement.nativeElement, lineWidthEvolution, this.colorLegend,
              this.LEGEND_WIDTH, this.MAX_LINE_WIDTH);
          }
        }
      }
    }
  }

  private buildCircleRadiusLegend(circleRadius: number | mapboxgl.StyleFunction | mapboxgl.Expression): void {
    if (Array.isArray(circleRadius)) {
      if (circleRadius.length >= 3) {
        if (circleRadius[0] === INTERPOLATE) {
          const field = circleRadius[2][1];
          const circleRadiusEvolution: Array<HistogramData> = new Array();
          circleRadius.filter((w, i) => i >= 3).forEach((w, i) => {
            if (i % 2 === 0) {
              circleRadiusEvolution.push({ key: w, value: circleRadius[i + 1 + 3] });
            }
          });
          this.radiusLegend.title = field;
          if (this.legendData && this.legendData.get(field)) {
            this.radiusLegend.minValue = this.legendData.get(field).minValue;
            this.radiusLegend.maxValue = this.legendData.get(field).maxValue;
          } else {
            this.radiusLegend.minValue = circleRadiusEvolution[0].key + '';
            this.radiusLegend.maxValue = circleRadiusEvolution[circleRadiusEvolution.length - 1].key + '';
          }
          this.radiusLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
          const maxCircleRadius = getMax(circleRadiusEvolution);
          if (maxCircleRadius > this.MAX_CIRLE_RADIUS) {
            circleRadiusEvolution.map(lw => {
              lw.value = lw.value * this.MAX_CIRLE_RADIUS / maxCircleRadius;
              return lw;
            });
          }
          if (!!this.circleRadiusLegend.interpolatedElement) {
            drawCircleSupportLine(this.circleRadiusLegend.interpolatedElement.nativeElement, circleRadiusEvolution, this.colorLegend,
              this.LEGEND_WIDTH, Math.min(this.MAX_CIRLE_RADIUS, maxCircleRadius) * 2);
          }
        }
      }
    }
  }
}

/**
 * draws the line width legend
 * @param svgNode SVG element on which we append the line using d3.
 * @param lineWidths List of {key, linewidth}
 * @param cLegend Color legend, to give the drawn legend lines the same color on the map
 * @param legendWidth The width that the svg will take to draw the legend
 * @param legendHeight The height that the svg will take to draw the legend
 */
export function drawLineWidth(svgNode: SVGElement, lineWidths: Array<HistogramData>,
    cLegend: Legend, legendWidth: number, legendHeight: number) {
  const maxHeight = getMax(lineWidths);
  const xDomain: any = (scaleLinear()).range([0, legendWidth]);
  const xDomainExtent = [lineWidths[0].key, lineWidths[lineWidths.length - 1].key];
  xDomain.domain(xDomainExtent);
  const yDomain: ScaleLinear<number, number> = scaleLinear().range([maxHeight, 0]);
  yDomain.domain([0, maxHeight]);
  const svg = select(svgNode).attr('width', legendWidth).attr('height', legendHeight);
  svg.selectAll('g').remove();
  const context = svg.append('g').attr('class', 'context');
  const ar = area()
    .curve(curveLinear)
    .x((d: any) => xDomain(d.key))
    .y0(maxHeight)
    .y1((d: any) => yDomain(d.value));

  const widthLineColor = getMiddleColor(cLegend);
  context.append('path')
    .datum(lineWidths)
    .style('fill', widthLineColor)
    .style('fill-opacity', 0.6)
    .style('stroke', widthLineColor)
    .style('stroke-opacity', 0.6)
    .style('stroke-width', 0.5)
    .attr('d', <any>ar);
}

export function getMiddleColor(colorLegend: Legend): string {
  let color = '';
  if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.fix) {
    color = colorLegend.fixValue as string;
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues as Array<string>;
    if (iv.length === 1 || iv.length === 2) {
      color = iv[0];
    } else if (iv.length >= 3) {
      color = iv[Math.trunc(iv.length / 2)];
    }
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.manual || colorLegend.type === PROPERTY_SELECTOR_SOURCE.generated
    || colorLegend.type === PROPERTY_SELECTOR_SOURCE.provided) {
    const iv = colorLegend.manualValues as Map<string, string>;
    if (iv) {
      if (iv.size === 1) {
        color = iv.keys().next().value;
      } else if (iv.size >= 2) {
        color = Array.from(iv.values())[Math.trunc(Array.from(iv.keys()).length / 2)];
      }
    }
  }
  return color;
}
/**
 * draws the circle radius legend
 * @param svgNode SVG element on which we append the circles using d3.
 * @param circlesRadiuses List of {key, circleradius}
 * @param cLegend Color legend, to give the drawn legend circles the same color on the map
 * @param legendWidth The width that the svg will take to draw the legend
 * @param legendHeight The height that the svg will take to draw the legend
 */
export function drawCircleSupportLine(svgNode: SVGElement, circlesRadiuses: Array<HistogramData>,
    cLegend: Legend, legendWidth: number, legendHeight: number) {
  const circleDiameters = [];
  circlesRadiuses.forEach(cr => circleDiameters.push({ key: cr.key, value: cr.value * 2 }));
  const maxHeight = getMax(circleDiameters);
  const firstRadius = circlesRadiuses[0].value;
  const lastRadius = circlesRadiuses[circlesRadiuses.length - 1].value;
  const xDomain: any = (scaleLinear()).range([0, legendWidth - firstRadius - lastRadius]);
  const xDomainExtent = [circleDiameters[0].key, circleDiameters[circleDiameters.length - 1].key];
  xDomain.domain(xDomainExtent);
  const yDomain: ScaleLinear<number, number> = scaleLinear().range([maxHeight, 0]);
  yDomain.domain([0, maxHeight]);
  const svg = select(svgNode).attr('width', legendWidth).attr('height', legendHeight);
  svg.selectAll('g').remove();
  const context = svg.append('g').attr('class', 'context');
  const l = line()
    .x((d: any) => xDomain(d.key))
    .y((d: any) => yDomain(d.value));
  context.append('path')
    .datum(circleDiameters)
    .attr('fill', 'none')
    .attr('stroke', '#eaeaea')
    .attr('stroke-width', 0.8)
    .attr('transform', 'translate(' + firstRadius + ', 0)')
    .attr('d', <any>l);
  context.append('g').append('line')
    .attr('x1', 0).attr('y1', maxHeight)
    .attr('x2', legendWidth - firstRadius - lastRadius).attr('y2', maxHeight)
    .attr('cx', 2).attr('cy', 2).attr('fill', 'none')
    .attr('stroke', '#eaeaea')
    .attr('stroke-width', 0.8)
    .attr('transform', 'translate(' + firstRadius + ', 0)');
  const circles = [circlesRadiuses[0], circlesRadiuses[circlesRadiuses.length - 1]];
  const circleColor = getMiddleColor(cLegend);
  context.append('g')
    .selectAll('dot').data(circles).enter().append('circle')
    .attr('r', (d) => d.value)
    .attr('cx', (d) => xDomain(d.key))
    .attr('cy', (d) => maxHeight - d.value)
    .attr('transform', 'translate(' + firstRadius + ', 0)')
    .style('fill', circleColor)
    .style('fill-opacity', 0.6)
    .style('stroke', circleColor)
    .style('stroke-width', 0.5);

}

export function getMax(data: Array<HistogramData>): number {
  return Math.max(...data.map(hd => +hd.value));
}

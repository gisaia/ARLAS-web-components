import { Component, OnInit, Input, AfterViewInit, SimpleChanges, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { curveLinear, area, line } from 'd3-shape';
import { scaleLinear, ScaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';
import { StyleFunction, Expression } from 'mapbox-gl';
import * as tinycolor from 'tinycolor2';

export const GET = 'get';
export const MATCH = 'match';
export const INTERPOLATE = 'interpolate';
export const OTHER = 'other_color';
export interface LegendData {
  minValue?:  string;
  maxValue?: string;
  keysColorsMap?: Map<string, string>;
}
@Component({
  selector: 'arlas-mapgl-legend',
  templateUrl: './mapgl-legend.component.html',
  styleUrls: ['./mapgl-legend.component.css']
})
export class MapglLegendComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() public layer: mapboxgl.Layer;
  @Input() public legendUpdater: Subject<any> = new Subject();
  @Input() public visibilityUpdater: Subject<any> = new Subject();

  @ViewChild('width_svg', { read: ElementRef, static: false }) public lineWidthLegendElement: ElementRef;
  @ViewChild('radius_svg', { read: ElementRef, static: false }) public circleRadiusLegendElement: ElementRef;

  public colorLegend: Legend = {};
  public widthLegend: Legend = {};
  public radiusLegend: Legend = {};
  public detail = false;
  public visibleMode = false;
  public PROPERTY_SELECTOR_SOURCE = PROPERTY_SELECTOR_SOURCE;

  private legendData: Map<string, LegendData> = new Map();
  private MAX_LINE_WIDTH = 10;
  private MAX_CIRLE_RADIUS = 7;
  private LEGEND_WIDTH = 210;

  constructor(public translate: TranslateService, private el: ElementRef) {}

  public ngOnInit() {
    this.legendUpdater.subscribe(legendData => {
      this.legendData = legendData;
      this.drawLegends(this.visibleMode);
    });
    this.visibilityUpdater.subscribe(v => {
      this.visibleMode = this.layer ? v.get(this.layer.id) : false;
      this.detail = this.visibleMode;
      if (this.layer) {
        this.drawLegends(this.visibleMode);
      }
    });
  }

  public ngAfterViewInit() {
    if (this.layer) {
      this.drawLegends(this.visibleMode);
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['layer'] !== undefined) {
      if (this.layer) {
        this.drawLegends(this.visibleMode);
      }
    }
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
    switch (type) {
      case 'circle': {
        const p: mapboxgl.CirclePaint = (paint as mapboxgl.CirclePaint);
        this.buildColorLegend(p['circle-color'], visibileMode, this.legendData);
        this.buildCircleRadiusLegend(p['circle-radius']);
        break;
      }
      case 'line': {
        const p: mapboxgl.LinePaint = (paint as mapboxgl.LinePaint);
        this.buildColorLegend(p['line-color'], visibileMode, this.legendData);
        this.buildLineWidthLegend(p['line-width']);
        break;
      }
      case 'fill': {
        const p: mapboxgl.FillPaint = (paint as mapboxgl.FillPaint);
        this.buildColorLegend(p['fill-color'], visibileMode, this.legendData);
        break;
      }
      case 'heatmap': {
        const p: mapboxgl.HeatmapPaint = (paint as mapboxgl.HeatmapPaint);
        this.colorLegend.minValue = '0';
        this.colorLegend.maxValue = '1';
        this.buildColorLegend(p['heatmap-color'], visibileMode, this.legendData);
        break;
      }
    }
  }

  private buildColorLegend(color: string | StyleFunction | Expression, visibileMode: boolean, legendData: any): void {
    if (typeof color === 'string') {
      this.colorLegend.type = PROPERTY_SELECTOR_SOURCE.fix;
      this.colorLegend.fixValue = color;
      if (!visibileMode) {
        /** apply greyscale because the layer is not visible */
        this.colorLegend.fixValue = tinycolor.default(color.toString()).greyscale().lighten(20).toHexString();
      }
    } else if (Array.isArray(color)) {
      if (color.length === 2) {
        /** color = ["get", "field"]  ==> Generated or Provided */
        const field = color[1];
        this.colorLegend.title = field;
        if ((field as string).endsWith('_color')) {
          this.colorLegend.type = PROPERTY_SELECTOR_SOURCE.generated;
          if (this.legendData.get(field)) {
            const keysToColors = this.legendData.get(field).keysColorsMap;
            const colorList = Array.from(keysToColors.keys()).map(k => k + ',' + keysToColors.get(k)).join(',').split(',');
            this.colorLegend.manualValues = new Map();
            for (let i = 0; i < colorList.length; i += 2) {
                const c = this.visibleMode ? colorList[i + 1] : '#eee';
                this.colorLegend.manualValues.set(this.translate.instant(colorList[i]), c);
            }
          } else {

          }
        } else {
          this.colorLegend.type = PROPERTY_SELECTOR_SOURCE.provided;
        }
        // todo
      } else if (color.length >= 3) {
        if (color[0] === MATCH) {
          /** color = ["match", ["get", "field"], .... ]**/
          this.colorLegend.type = PROPERTY_SELECTOR_SOURCE.manual;
          const colorsLength = color.length;
          let hasDefaultColor = false;
          if (colorsLength % 2 !== 0) {
            hasDefaultColor = true;
          }
          this.colorLegend.title = color[1].length === 2 ? color[1][1] : '';
          this.colorLegend.manualValues = new Map();
          for (let i = 2; i < color.length; i += 2) {
            if (hasDefaultColor && i === colorsLength - 3) {
              const c1 = this.visibleMode ? color[i + 1] : tinycolor.default(color[i + 1].toString()).greyscale().lighten(20).toHexString();
              const c2 = this.visibleMode ? color[i + 2] : tinycolor.default(color[i + 2].toString()).greyscale().lighten(20).toHexString();
              this.colorLegend.manualValues.set(this.translate.instant(color[i]), c1);
              this.colorLegend.manualValues.set(this.translate.instant(OTHER), c2);
              break;
            } else {
              const c = this.visibleMode ? color[i + 1] : tinycolor.default(color[i + 1].toString()).greyscale().lighten(20).toHexString();
              this.colorLegend.manualValues.set(this.translate.instant(color[i]), c);
            }
          }
        } else if (color[0] === INTERPOLATE) {
          this.colorLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
          /** color = ["interplate", ['linear'], ["get", "field"], 0, 1... ]**/
          // todo throw exception if interpolation is not linear
          const field = color[2].length === 2 ? color[2][1] : 'Heatmap-density';
          this.colorLegend.title = field;
          this.colorLegend.interpolatedValues = [];
          color.filter((c, i) => i > 2 && i % 2 === 0).forEach(c => this.colorLegend.interpolatedValues.push(c));

          if (legendData && legendData.get(field)) {
            this.colorLegend.minValue = legendData.get(field).minValue;
            this.colorLegend.maxValue = legendData.get(field).maxValue;
          }
          if (!visibileMode) {
            /** apply greyscale because the layer is not visible */
            this.colorLegend.interpolatedValues = this.colorLegend.interpolatedValues
              .map((c) => tinycolor.default(c.toString()).greyscale().lighten(20).toHexString());
          }
        }
      }
    }
    const layer = Object.assign({}, this.layer);
    this.layer = null;
    this.layer = Object.assign({}, layer);
  }

  private buildLineWidthLegend(lineWidth: number | StyleFunction | Expression): void {
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
              lineWidthEvolution.push({key: w, value: lineWidth[i + 1 + 3]});
            }
          });
          const maxLineWidth = getMax(lineWidthEvolution);
          if (maxLineWidth > this.MAX_LINE_WIDTH) {
            lineWidthEvolution.map(lw => {
              lw.value = lw.value * this.MAX_LINE_WIDTH / maxLineWidth;
              return lw;
            });
          }
          drawLineWidth(this.lineWidthLegendElement.nativeElement, lineWidthEvolution, this.colorLegend, this.LEGEND_WIDTH);
        }
      }
    }
  }

  private buildCircleRadiusLegend(circleRadius: number | StyleFunction | Expression): void {
    if (Array.isArray(circleRadius)) {
      if (circleRadius.length >= 3) {
        if (circleRadius[0] === INTERPOLATE) {
          const field = circleRadius[2][1];
          this.radiusLegend.title = field;
          if (this.legendData && this.legendData.get(field)) {
            this.radiusLegend.minValue = this.legendData.get(field).minValue;
            this.radiusLegend.maxValue = this.legendData.get(field).maxValue;
          }
          this.radiusLegend.type = PROPERTY_SELECTOR_SOURCE.interpolated;
          const circleRadiusEvolution: Array<HistogramData> = new Array();
          circleRadius.filter((w, i) => i >= 3).forEach((w, i) => {
            if (i % 2 === 0) {
              circleRadiusEvolution.push({key: w, value: circleRadius[i + 1 + 3]});
            }
          });
          const maxCircleRadius = getMax(circleRadiusEvolution);
          if (maxCircleRadius > this.MAX_CIRLE_RADIUS) {
            circleRadiusEvolution.map(lw => {
              lw.value = lw.value * this.MAX_CIRLE_RADIUS / maxCircleRadius;
              return lw;
            });
          }
          drawCircleSupportLine(this.circleRadiusLegendElement.nativeElement, circleRadiusEvolution, this.colorLegend, this.LEGEND_WIDTH);
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
 */
export function drawLineWidth(svgNode: SVGElement, lineWidths: Array<HistogramData>, cLegend: Legend, legendWidth: number) {
  const maxHeight = getMax(lineWidths);
  const xDomain: any = (scaleLinear()).range([0, legendWidth]);
  const xDomainExtent = [lineWidths[0].key, lineWidths[lineWidths.length - 1].key];
  xDomain.domain(xDomainExtent);
  const yDomain: ScaleLinear<number, number> = scaleLinear().range([maxHeight, 0]);
  yDomain.domain([0, maxHeight]);
  const svg = select(svgNode);
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
    color = colorLegend.fixValue as string ;
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.interpolated) {
    const iv = colorLegend.interpolatedValues as Array<string>;
    if (iv.length === 1 || iv.length === 2) {
      color = iv[0];
    } else if (iv.length >= 3) {
      color = iv[Math.trunc(iv.length / 2)];
    }
  } else if (colorLegend.type === PROPERTY_SELECTOR_SOURCE.manual || colorLegend.type === PROPERTY_SELECTOR_SOURCE.generated) {
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
 */
export function drawCircleSupportLine(svgNode: SVGElement, circlesRadiuses: Array<HistogramData>, cLegend: Legend, legendWidth: number) {
  const circleDiameters = [];
  circlesRadiuses.forEach(cr => circleDiameters.push({key: cr.key, value: cr.value * 2}));
  const maxHeight = getMax(circleDiameters);
  const firstRadius = circlesRadiuses[0].value;
  const lastRadius = circlesRadiuses[circlesRadiuses.length - 1].value;
  const xDomain: any = (scaleLinear()).range([0, legendWidth - firstRadius - lastRadius]);
  const xDomainExtent = [circleDiameters[0].key, circleDiameters[circleDiameters.length - 1].key];
  xDomain.domain(xDomainExtent);
  const yDomain: ScaleLinear<number, number> = scaleLinear().range([maxHeight, 0]);
  yDomain.domain([0, maxHeight]);
  const svg = select(svgNode);
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

export interface Legend {
  type?: PROPERTY_SELECTOR_SOURCE;
  title?: string;
  minValue?: string;
  maxValue?: string;
  fixValue?: string | number;
  interpolatedValues?: Array<string | number>;
  manualValues?: Map<string, string | number>;
}

export enum PROPERTY_SELECTOR_SOURCE {
  fix = 'Fix',
  provided = 'Provided',
  generated = 'Generated',
  manual = 'Manual',
  interpolated = 'Interpolated',
  metric_on_field = 'Metric on field',
  heatmap_density = 'Density'
}

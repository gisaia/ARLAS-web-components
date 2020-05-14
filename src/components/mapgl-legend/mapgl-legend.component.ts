import { Component, OnInit, Input, AfterViewInit, SimpleChanges, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { curveLinear, area, line } from 'd3-shape';
import { scaleLinear, ScaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { HistogramData } from 'arlas-d3/histograms/utils/HistogramUtils';
import { StyleFunction, Expression } from 'mapbox-gl';
import { ColorLegend, PROPERTY_SELECTOR_SOURCE, Legend } from './legend';


export const GET = 'get';
export const MATCH = 'match';
export const INTERPOLATE = 'interpolate';
export const OTHER = 'other_color';
@Component({
  selector: 'arlas-mapgl-legend',
  templateUrl: './mapgl-legend.component.html',
  styleUrls: ['./mapgl-legend.component.css']
})
export class MapglLegendComponent extends ColorLegend implements OnInit, AfterViewInit, OnChanges {

  @Input() public layer: mapboxgl.Layer;
  @Input() public legendUpdater: Subject<Map<string, {minValue: string, maxValue: string}>> =
    new Subject<Map<string, {minValue: string, maxValue: string}>>();
  @ViewChild('width_svg', { read: ElementRef, static: false }) public lineWidthLegendElement: ElementRef;
  @ViewChild('radius_svg', { read: ElementRef, static: false }) public circleRadiusLegendElement: ElementRef;

  public widthLegend: Legend = {};
  public radiusLegend: Legend = {};
  public detail = false;
  private legendData: Map<string, {minValue: string, maxValue: string}> = new Map();

  private MAX_LINE_WIDTH = 10;
  private MAX_CIRLE_RADIUS = 7;
  constructor(public translate: TranslateService, private el: ElementRef) {
    super(translate);
   }

  public ngOnInit() {
    this.legendUpdater.subscribe(legendData => {
      this.legendData = legendData;
      this.getLegends();
    });
  }

  public ngAfterViewInit() {
    if (this.layer) {
      this.getLegends();
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['layer'] !== undefined) {
      if (this.layer) {
        this.getLegends();
      }
    }
  }

  public showDetail(event: Event) {
    this.detail = !this.detail;
    event.stopPropagation();
  }

  private getLegends(): void {
    const type = this.layer.type;
    const paint = this.layer.paint;

    switch (type) {
      case 'circle': {
        const p: mapboxgl.CirclePaint = (paint as mapboxgl.CirclePaint);
        this.buildColorLegend(p['circle-color'], this.legendData);
        this.buildCircleRadiusLegend(p['circle-radius']);
        break;
      }
      case 'line': {
        const p: mapboxgl.LinePaint = (paint as mapboxgl.LinePaint);
        this.buildColorLegend(p['line-color'], this.legendData);
        this.buildLineWidthLegend(p['line-width']);
        break;
      }
      case 'fill': {
        const p: mapboxgl.FillPaint = (paint as mapboxgl.FillPaint);
        this.buildColorLegend(p['fill-color'], this.legendData);
        break;
      }
      case 'heatmap': {
        const p: mapboxgl.HeatmapPaint = (paint as mapboxgl.HeatmapPaint);
        this.buildColorLegend(p['heatmap-color'], this.legendData);
        break;
      }
    }
  }



  private buildLineWidthLegend(lineWidth: number | StyleFunction | Expression): void {
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

          drawLineWidth(this.lineWidthLegendElement.nativeElement, lineWidthEvolution, 210);
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
          drawCircleSupportLine(this.circleRadiusLegendElement.nativeElement, circleRadiusEvolution, 210);
        }
      }
    }
  }

}
export function drawLineWidth(svgNode: SVGElement, lineWidths: Array<HistogramData>, legendWidth: number) {
  const maxHeight = getMax(lineWidths);
  const xDomain: any = (scaleLinear()).range([0, legendWidth]);
  const xDomainExtent = [lineWidths[0].key, lineWidths[lineWidths.length - 1].key];
  xDomain.domain(xDomainExtent);
  const yDomain: ScaleLinear<number, number> = scaleLinear().range([maxHeight, 0]);
  yDomain.domain([0, maxHeight]);
  const svg = select(svgNode);
  const context = svg.append('g').attr('class', 'context');
  const ar = area()
      .curve(curveLinear)
      .x((d: any) => xDomain(d.key))
      .y0(maxHeight)
      .y1((d: any) => yDomain(d.value));
  context.append('path')
      .datum(lineWidths)
      .attr('class', 'width-legend-svg')
      .attr('d', <any>ar);
}


export function drawCircleSupportLine(svgNode: SVGElement, circlesRadiuses: Array<HistogramData>, legendWidth: number) {
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
  context.append('g')
      .attr('class', 'histogram__swimlane').selectAll('dot').data(circles).enter().append('circle')
      .attr('r', (d) => d.value)
        .attr('cx', (d) => xDomain(d.key))
        .attr('cy', (d) => maxHeight - d.value)
        .attr('transform', 'translate(' + firstRadius + ', 0)')
        .style('fill', 'blue')
        .style('fill-opacity', 0.2);

}

export function getMax(data: Array<HistogramData>): number {
  return Math.max(...data.map(hd => +hd.value));
}

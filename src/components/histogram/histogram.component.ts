import { Component, OnInit, Input, Output, ViewEncapsulation, ViewContainerRef, ElementRef } from '@angular/core';

import { areaChart, barsChart, timelineType, histogramType, MarginModel, DateType } from './histogram.utils';

import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as d3 from 'd3';

@Component({
  selector: 'arlas-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HistogramComponent implements OnInit {

  /* Public properties */
  margin: MarginModel = { top: 2, right: 20, bottom: 20, left: 60 };
  startValue: string = null;
  endValue: string = null;
  showTooltip = false;
  showTitle = true;
  tooltipHorizontalPosition = '0';
  tooltipVerticalPosition = '0';
  tooltipXContent: string;
  tooltipYContent: string;
  isDataAvailable = false;

  @Input() xTicks = 5;
  @Input() yTicks = 5;
  @Input() chartType = areaChart;
  @Input() chartTitle = '';
  @Input() chartWidth = 500;
  @Input() chartHeight = 100;
  @Input() histogramType = timelineType;
  @Input() customizedCssClass = '';
  @Input() dataUnit = '';
  @Input() chartData: Subject<any> = new Subject<any>();
  @Input() dateType: DateType = DateType.millisecond;

  @Output() valuesChangedEvent: Subject<any> = new Subject<any>();

  private histogramNode: any;
  private histogramElement: ElementRef;
  private histogramTitle: string;
  private context: any;
  private interval = { startvalue: null, endvalue: null };

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) { }

  ngOnInit() {
    this.histogramNode = this.viewContainerRef.element.nativeElement;
    this.chartData.subscribe(value => {
      this.plotHistogram(value)
    });
  }

  public plotHistogram(data: Array<any>): void {

    // set chartWidth value equal to container width
    this.chartWidth = this.el.nativeElement.childNodes[0].offsetWidth;

    // if there is data already ploted, remove it
    if (this.context) {
      this.context.remove();
    }

    if (data !== null && Array.isArray(data) && data.length > 0) {
      if (this.histogramType === timelineType) {
        this.parseDataKeyToDate(data);
      }
      if (this.startValue == null) {
        this.startValue = this.toString(data[0].key);
        this.interval.startvalue = data[0].key;
      }
      if (this.endValue == null) {
        this.endValue = this.toString(data[data.length - 1].key);
        this.interval.endvalue = data[data.length - 1].key;
      }
      console.log("this.interval.startvalue:"+this.interval.startvalue);
      console.log("this.interval.endvalue:"+this.interval.endvalue);

      const chartDimensions = this.initializeChartDimensions();
      const chartAxes = this.createChartAxes(chartDimensions, data);
      this.drawChartAxes(chartDimensions, chartAxes);
      this.plotHistogramData(chartDimensions, chartAxes, data);
      this.showTooltips(chartDimensions, chartAxes, data);

      let selectionBrush = d3.brushX().extent([[0, 0], [chartDimensions.width, chartDimensions.height]]);
      let selectionBrushStart = Math.max(0, chartAxes.xDomain(this.interval.startvalue));
      let selectionBrushEnd = Math.min(chartAxes.xDomain(this.interval.endvalue), chartDimensions.width);
      this.context.append('g')
        .attr('class', 'brush')
        .call(selectionBrush).call(selectionBrush.move, [selectionBrushStart, selectionBrushEnd]);
      this.handleOnBrushingEvent(selectionBrush, chartAxes);
      this.handleEndOfBrushingEvent(selectionBrush, chartAxes);
    } else {
      this.startValue = '';
      this.endValue = '';
    }
  }

  private initializeChartDimensions(): any {
    const svg = d3.select(this.histogramNode).select('svg');
    const margin = this.margin;
    const width = +this.chartWidth - this.margin.left - this.margin.right;
    const height = +this.chartHeight - this.margin.top - this.margin.bottom;
    return { svg, margin, width, height }
  }

  private createChartAxes(chartDimensions: any, data: any): any {
    let xDomain;
    if (this.histogramType === timelineType) {
      xDomain = d3.scaleTime().range([0, chartDimensions.width]);
    } else if (this.histogramType === histogramType) {
      xDomain = d3.scaleLinear().range([0, chartDimensions.width]);
    }
    const yDomain = d3.scaleLinear().range([chartDimensions.height, 0]);
    if (data == null || !Array.isArray(data) || data.length <= 0) {
      // if no data is available, we plot an empty histogram. So to give extent to x and y axes, 'data' takes histogram witdh and height
      data = [{ key: 0, value: 0 }, { key: chartDimensions.width, value: chartDimensions.height }]
    }
    xDomain.domain(d3.extent(data, (d: any) => d.key));
    yDomain.domain([0, d3.max(data, (d: any) => d.value)]);
    const xAxis = d3.axisBottom(xDomain).ticks(this.xTicks);
    const yAxis = d3.axisLeft(yDomain).ticks(this.yTicks);
    return { xDomain, yDomain, xAxis, yAxis }
  }

  private drawChartAxes(chartDimensions: any, chartAxes: any): void {
    this.context = chartDimensions.svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + chartDimensions.margin.top + ')');
    this.context.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + chartDimensions.height + ')')
      .call(chartAxes.xAxis);
    this.context.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,2)')
      .call(chartAxes.yAxis);
  }

  private plotHistogramData(chartDimensions: any, chartAxes: any, data: any): void {
    if (this.chartType === barsChart) {
      this.plotHistogramAsBars(chartDimensions, chartAxes, data);
    } else if (this.chartType === areaChart) {
      this.plotHistogramAsArea(chartDimensions, chartAxes, data);
    }
  }

  private plotHistogramAsBars(chartDimensions: any, chartAxes: any, data: any): void {
    const histogram = d3.histogram()
      .value(function (d) { return d.key; })
      .domain(chartAxes.xDomain.domain())
      .thresholds(chartAxes.xDomain.ticks(data.length));
    const bins = histogram(data);
    this.context.selectAll('rect')
      .data(bins)
      .enter().append('rect')
      .attr('class', 'histogram__chart--bar')
      .attr('x', 1)
      .attr('transform', function (d) { return 'translate(' + chartAxes.xDomain(d.x0) + ',' + chartAxes.yDomain(d[0].value) + ')'; })
      .attr('width', function (d) { return chartAxes.xDomain(d.x1) - chartAxes.xDomain(d.x0) - 0.1; })
      .attr('height', function (d) { return chartDimensions.height - chartAxes.yDomain(d[0].value); });
  }

  private plotHistogramAsArea(chartDimensions: any, chartAxes: any, data: any): void {
    const area = d3.area()
      .curve(d3.curveMonotoneX)
      .x((d: any) => chartAxes.xDomain(d.key))
      .y0(chartDimensions.height)
      .y1((d: any) => chartAxes.yDomain(d.value));
    this.context.append('path')
      .datum(data)
      .attr('class', 'histogram__chart--area')
      .attr('d', area);
  }

  private showTooltips(chartDimensions, chartAxes, data) {
    const _thisComponent = this;
    if (this.dataUnit !== '') {
      this.dataUnit = '(' + this.dataUnit + ')';
    }
    chartDimensions.svg.selectAll('dot').data(data).enter().append('circle')
      .attr('r', 2)
      .attr('cx', function (d) { return chartDimensions.margin.left + chartAxes.xDomain(d.key); })
      .attr('cy', function (d) { return chartDimensions.margin.top + chartAxes.yDomain(d.value); })
      .attr('class', 'histogram__tooltip__circle')
      .on('mouseover', function (d) {
        _thisComponent.showTooltip = true;
        _thisComponent.tooltipXContent = 'x: ' + _thisComponent.toString(d.key);
        _thisComponent.tooltipYContent = 'y: ' + d.value + ' ' + _thisComponent.dataUnit;
        _thisComponent.tooltipVerticalPosition = (d3.event.pageX) - 40 + 'px';
        _thisComponent.tooltipHorizontalPosition = (d3.event.pageY - 15) + 'px';
      })
      .on('mouseout', function (d) {
        _thisComponent.showTooltip = false;
      });
  }

  private handleOnBrushingEvent(selectionbrush: any, chartAxes: any): void {
    selectionbrush.on('brush', (datum: any, index: number) => {
      const selection = d3.event.selection;
      this.startValue = 'From ' + this.toString(selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0]);
      this.endValue = ' to ' + this.toString(selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1]);
      this.showTitle = false;
    });
  }

  private handleEndOfBrushingEvent(selectionbrush: any, chartAxes: any): void {
    const valueChangedEvent = this.valuesChangedEvent;
    selectionbrush.on('end', (datum: any, index: number) => {
      const selection = d3.event.selection;
      if (selection !== null) {
        this.interval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
        this.interval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
        this.startValue = this.toString(this.interval.startvalue);
        this.endValue = this.toString(this.interval.endvalue);
        valueChangedEvent.next(this.interval);
        this.showTitle = true;
      }

    });
  }

  private toString(value: any): any {
    if (value instanceof Date) {
      return value.toDateString();
    } else if (value.length === undefined) {
      return this.round(value, 1).toString();
    } else {
      return value;
    }
  }

  private parseDataKeyToDate(data): void {
    let multiplier = 1;
    if (this.dateType === DateType.second) {
      multiplier = 1000;
    }
    data.forEach(d => {
      d.key = new Date(d.key * multiplier);
    });
  }

  private round(value, precision): number {
    let multiplier;
    if (precision === 1) {
      multiplier = precision;
    } else {
      multiplier = Math.pow(10, precision * 10 || 0);
    }
    return Math.round(value * multiplier) / multiplier;
  }
}

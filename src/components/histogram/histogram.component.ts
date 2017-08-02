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

  public margin: MarginModel = { top: 2, right: 20, bottom: 20, left: 60 };
  public startValue: string = null;
  public endValue: string = null;
  public showTooltip = false;
  public showTitle = true;
  public tooltipHorizontalPosition = '0';
  public tooltipVerticalPosition = '0';
  public tooltipXContent: string;
  public tooltipYContent: string;
  public isDataAvailable = false;

  @Input() public xTicks = 5;
  @Input() public yTicks = 5;
  @Input() public chartType = areaChart;
  @Input() public chartTitle = '';
  @Input() public chartWidth = 500;
  @Input() public chartHeight = 100;
  @Input() public histogramType = timelineType;
  @Input() public customizedCssClass = '';
  @Input() public dataUnit = '';
  @Input() public chartData: Subject<any> = new Subject<any>();
  @Input() public dateType: DateType = DateType.millisecond;
  @Input() public xLabels = 4;
  @Input() public barsWidthPercentage = 0.6;


  @Output() public valuesChangedEvent: Subject<any> = new Subject<any>();

  private histogramNode: any;
  private histogramElement: ElementRef;
  private histogramTitle: string;
  private context: any;
  private selectionInterval = { startvalue: null, endvalue: null };

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) { }

  public ngOnInit() {
    this.histogramNode = this.viewContainerRef.element.nativeElement;
    this.chartData.subscribe(value => {
      this.plotHistogram(value);
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
        this.selectionInterval.startvalue = data[0].key;
      }
      if (this.endValue == null) {
        this.endValue = this.toString(data[data.length - 1].key);
        this.selectionInterval.endvalue = data[data.length - 1].key;
      }
      const chartDimensions = this.initializeChartDimensions();
      const chartAxes = this.createChartAxes(chartDimensions, data);
      this.drawChartAxes(chartDimensions, chartAxes);
      this.plotHistogramData(chartDimensions, chartAxes, data);
      if (this.chartType === areaChart) {
        this.showTooltipsForAreaCharts(chartDimensions, chartAxes, data);
      }
      const selectionBrush = d3.brushX().extent([[chartAxes.stepWidth, 0],
      [chartDimensions.width - chartAxes.stepWidth, chartDimensions.height]]);
      const selectionBrushStart = Math.max(0, chartAxes.xDomain(this.selectionInterval.startvalue));
      const selectionBrushEnd = Math.min(chartAxes.xDomain(this.selectionInterval.endvalue), chartDimensions.width);
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
    return { svg, margin, width, height };
  }

  private createChartAxes(chartDimensions: any, data: Array<any>): any {
    if (data == null || !Array.isArray(data) || data.length <= 0) {
      // if no data is available, we plot an empty histogram. So to give extent to x and y axes, 'data' takes histogram witdh and height
      data = [{ key: 0, value: 0 }, { key: chartDimensions.width, value: chartDimensions.height }];
    }
    if (this.chartType === areaChart) {
      return this.createAreaChartAxes(chartDimensions, data);
    }  else {
      return this.createBarsChartAxes(chartDimensions, data);
    }
  }

  private createAreaChartAxes (chartDimensions: any, data: Array<any>): any {
    let xDomain;
    if (this.histogramType === timelineType) {
      xDomain = d3.scaleTime().range([0, chartDimensions.width]);
    } else if (this.histogramType === histogramType) {
      xDomain = d3.scaleLinear().range([0, chartDimensions.width]);
    }
    xDomain.domain(d3.extent(data, (d: any) => d.key));
    const xAxis = d3.axisBottom(xDomain).ticks(this.xTicks);
    const createdYAxis = this.createYAxis(chartDimensions, data);
    const yDomain = createdYAxis.yDomain;
    const yAxis = createdYAxis.yAxis;
    const stepWidth = 0;
    return { xDomain, yDomain, xAxis, yAxis, stepWidth };
  }

  private createBarsChartAxes (chartDimensions: any, data: Array<any>): any {
    const xDomain = d3.scaleLinear().range([0, chartDimensions.width]);
    const xExtent  = this.getXDomainExtent(data);
    xDomain.domain(xExtent);
    const stepWidth = xDomain(data[0].key);
    const xDiscretDomain = d3.scaleBand()
                .range([stepWidth, chartDimensions.width - stepWidth])
                .paddingInner(0.2);
    xDiscretDomain.domain(data.map(function(d) { return d.key; }));
    const _thisComponent = this;
    const labelsPeriod = Math.max(1, Math.round(data.length / this.xLabels));
    const xAxis = d3.axisBottom(xDiscretDomain).tickSize(0).tickPadding(5).tickValues(xDiscretDomain.domain()
    .filter(function(d, i) { return !(i % labelsPeriod); }));
    const createdYAxis = this.createYAxis(chartDimensions, data);
    const yDomain = createdYAxis.yDomain;
    const yAxis = createdYAxis.yAxis;
    return { xDiscretDomain, xDomain, yDomain, xAxis, yAxis, stepWidth };
  }

  private createYAxis (chartDimensions: any, data: Array<any>): any {
    const yDomain = d3.scaleLinear().range([chartDimensions.height, 0]);
    yDomain.domain([0, d3.max(data, (d: any) => d.value)]);
    const yAxis = d3.axisLeft(yDomain).ticks(this.yTicks);
    return {yDomain, yAxis};
  }

  private drawChartAxes(chartDimensions: any, chartAxes: any): void {
    this.context = chartDimensions.svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + chartDimensions.margin.top + ')');
    this.context.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + chartDimensions.height + ')')
      .call(chartAxes.xAxis);
  }

  private plotHistogramData(chartDimensions: any, chartAxes: any, data: any): void {
    if (this.chartType === barsChart) {
      this.plotHistogramAsBars(chartDimensions, chartAxes, data);
    } else if (this.chartType === areaChart) {
      this.plotHistogramAsArea(chartDimensions, chartAxes, data);
    }
  }

  private plotHistogramAsBars(chartDimensions: any, chartAxes: any, data: any): void {
    const _thisComponent = this;
    chartDimensions.svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'histogram__chart--bar')
      .attr('x', function(d) {return chartAxes.xDiscretDomain(d.key); })
      .attr('width', chartAxes.stepWidth * _thisComponent.barsWidthPercentage)
      .attr('y', function(d) { return chartAxes.yDomain(d.value); })
      .attr('height', function(d) { return chartDimensions.height - chartAxes.yDomain(d.value); })
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + chartDimensions.margin.top + ')')
      .on('mousemove', function(d){
        _thisComponent.showTooltip = true;
        _thisComponent.tooltipXContent = 'x: ' + _thisComponent.toString(d.key);
        _thisComponent.tooltipYContent = 'y: ' + d.value + ' ' + _thisComponent.dataUnit;
        _thisComponent.tooltipVerticalPosition = (d3.event.pageX) - 45 + 'px';
        _thisComponent.tooltipHorizontalPosition = (d3.event.pageY - 15) + 'px';
        })
      .on('mouseout', function(d){ _thisComponent.showTooltip = false; });
      this.context.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(' + chartAxes.stepWidth + ', 0)')
      .call(chartAxes.yAxis);
  }

  private plotHistogramAsArea(chartDimensions: any, chartAxes: any, data: any): void {
    this.context.append('g')
      .attr('class', 'axis')
      .call(chartAxes.yAxis);
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

  private showTooltipsForAreaCharts(chartDimensions, chartAxes, data) {
    const _thisComponent = this;
    if (this.dataUnit !== '') {
      this.dataUnit = '(' + this.dataUnit + ')';
    }
    chartDimensions.svg.selectAll('dot').data(data).enter().append('circle')
      .attr('r', 10)
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
        this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
        this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
        this.startValue = this.toString(this.selectionInterval.startvalue);
        this.endValue = this.toString(this.selectionInterval.endvalue);
        valueChangedEvent.next(this.selectionInterval);
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

  private getXDomainExtent(data: Array<{key: number, value: number}>): Array<Date|number> {
    const interval = this.getBucketInterval(data);
    const xDomainExtent = new Array<any>();
    if ( this.histogramType === timelineType) {
      xDomainExtent.push(new Date(d3.min(data, (d: any) => d.key).getTime() - interval));
      xDomainExtent.push(new Date(d3.max(data, (d: any) => d.key).getTime() + interval));
    } else {
      xDomainExtent.push(d3.min(data, (d: any) => d.key) * 1 - interval);
      xDomainExtent.push(d3.max(data, (d: any) => d.key) * 1 + interval);
    }
    return xDomainExtent;
  }

  private getBucketInterval (data: Array<{key: any, value: number}>): number {
    let interval = Number.MAX_VALUE;
    if (data.length > 1 ) {
      for (let i = 0; i < (data.length - 1); i++ ) {
        if ( this.histogramType === timelineType) {
          interval = Math.min(interval, data[i + 1].key.getTime() - data[i].key.getTime());
        } else {
          interval = Math.min(interval, data[i + 1].key - data[i].key);
        }
      }
      if ( interval === Number.MAX_VALUE ) {
          interval = 0;
     }
    }
    return interval;
  }


}

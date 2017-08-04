import { Component, OnInit, Input, Output, ViewEncapsulation, ViewContainerRef, ElementRef } from '@angular/core';

import { areaChart, barsChart, timelineType, histogramType, MarginModel, DateType, HistogramData, SelectedValues,
         ChartDimensions, ChartAxes } from './histogram.utils';

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
  @Input() public chartData: Subject<Array<{key: number, value: number}>> = new Subject<Array<{key: number, value: number}>>();
  @Input() public dateType: DateType = DateType.millisecond;
  @Input() public xLabels = 4;
  @Input() public barsWidthPercentage = 0.6;


  @Output() public valuesChangedEvent: Subject<SelectedValues> = new Subject<SelectedValues>();

  private histogramNode: any;
  private histogramElement: ElementRef;
  private histogramTitle: string;
  private context: any;
  private selectionInterval: SelectedValues = {startvalue: null, endvalue: null};

  constructor(private viewContainerRef: ViewContainerRef, private el: ElementRef) { }

  public ngOnInit() {
    this.histogramNode = this.viewContainerRef.element.nativeElement;
    this.chartData.subscribe(value => {
      this.plotHistogram(value);
    });
  }

  public plotHistogram(inputData: Array<{key: number, value: number}>): void {

    // set chartWidth value equal to container width
    this.chartWidth = this.el.nativeElement.childNodes[0].offsetWidth;

    // if there is data already ploted, remove it
    if (this.context) {
      this.context.remove();
    }

    let data: Array<HistogramData>;
    if (inputData !== null && Array.isArray(inputData) && inputData.length > 0) {
      data = this.parseDataKey(inputData);

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

  private initializeChartDimensions(): ChartDimensions {
    const svg = d3.select(this.histogramNode).select('svg');
    const margin = this.margin;
    const width = +this.chartWidth - this.margin.left - this.margin.right;
    const height = +this.chartHeight - this.margin.top - this.margin.bottom;
    return { svg, margin, width, height };
  }

  // retruns d3.ScaleTime<number,number> or d3.ScaleLinear<number,number>
  private getXDomainScale(): any {
    if (this.histogramType === timelineType) {
      return d3.scaleTime();
    } else {
      return d3.scaleLinear();
    }
  }

  private createChartAxes(chartDimensions: ChartDimensions, data: Array<HistogramData>): ChartAxes {
    const xDomain = (this.getXDomainScale()).range([0, chartDimensions.width]);
    // The xDomain extent includes data domain and selected values
    const xDomainExtent = this.getXDomainExtent(data, this.selectionInterval.startvalue, this.selectionInterval.endvalue);
    xDomain.domain(xDomainExtent);
    // xDataDomain includes data domain only
    let xDataDomain;
    let xAxis;
    let stepWidth;
    // Compute the range (in pixels) of xDataDomain where data will be plotted
    const startRange = xDomain(data[0].key);
    const endRange = xDomain(data[data.length - 1].key);
    if (this.chartType === areaChart) {
      stepWidth = 0;
      xDataDomain = (this.getXDomainScale()).range([startRange, endRange]);
      xDataDomain.domain(d3.extent(data, (d: any) => d.key));
      xAxis = d3.axisBottom(xDomain).ticks(this.xTicks);
    } else {
      if (data.length > 1) {
        stepWidth = xDomain(data[1].key) - xDomain(data[0].key);
      } else {
        stepWidth = xDomain(data[0].key);
      }
      xDataDomain = d3.scaleBand().range([startRange, endRange]).paddingInner(0.2);
      xDataDomain.domain(data.map(function(d) { return d.key; }));
      const labelsPeriod = Math.max(1, Math.round(data.length / this.xLabels));
      xAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(5).tickValues(xDataDomain.domain()
                .filter(function(d, i) { return !(i % labelsPeriod); }));
    }
    const yDomain = d3.scaleLinear().range([chartDimensions.height, 0]);
    yDomain.domain([0, d3.max(data, (d: any) => d.value)]);
    const yAxis = d3.axisLeft(yDomain).ticks(this.yTicks);
    return { xDomain, xDataDomain, yDomain, xAxis, yAxis, stepWidth };
  }

  private drawChartAxes(chartDimensions: ChartDimensions, chartAxes: ChartAxes): void {
    this.context = chartDimensions.svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + chartDimensions.margin.top + ')');
    this.context.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + chartDimensions.height + ')')
      .call(chartAxes.xAxis);
    this.context.append('g')
      .attr('class', 'axis')
      .call(chartAxes.yAxis);
  }

  private plotHistogramData(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    if (this.chartType === barsChart) {
      this.plotHistogramDataAsBars(chartDimensions, chartAxes, data);
    } else if (this.chartType === areaChart) {
      this.plotHistogramDataAsArea(chartDimensions, chartAxes, data);
    }
  }

  private plotHistogramDataAsBars(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const _thisComponent = this;
    chartDimensions.svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'histogram__chart--bar')
      .attr('x', function(d) {return chartAxes.xDataDomain(d.key); })
      .attr('width', chartAxes.stepWidth * _thisComponent.barsWidthPercentage)
      .attr('y', function(d) { return chartAxes.yDomain(d.value); })
      .attr('height', function(d) { return chartDimensions.height - chartAxes.yDomain(d.value); })
      .attr('transform', 'translate(' + chartDimensions.margin.left + ',' + chartDimensions.margin.top + ')')
      .on('mousemove', function(d){
        _thisComponent.setTooltipPosition(-40, -40, d);
        console.log(this);

        })
      .on('mouseout', function(d){ _thisComponent.showTooltip = false; });
  }

  private plotHistogramDataAsArea(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const area = d3.area()
      .curve(d3.curveMonotoneX)
      .x((d: any) => chartAxes.xDataDomain(d.key))
      .y0(chartDimensions.height)
      .y1((d: any) => chartAxes.yDomain(d.value));
    this.context.append('path')
      .datum(data)
      .attr('class', 'histogram__chart--area')
      .attr('d', area);
  }

  private showTooltipsForAreaCharts(chartDimensions: ChartDimensions, chartAxes: ChartAxes, data: Array<HistogramData>): void {
    const _thisComponent = this;
    chartDimensions.svg.selectAll('dot').data(data).enter().append('circle')
      .attr('r', 10)
      .attr('cx', function (d) { return chartDimensions.margin.left + chartAxes.xDomain(d.key); })
      .attr('cy', function (d) { return chartDimensions.margin.top + chartAxes.yDomain(d.value); })
      .attr('class', 'histogram__tooltip__circle')
      .on('mouseover', function (d) {
        _thisComponent.setTooltipPosition(-40, -40 , d);
      })
      .on('mouseout', function (d) {
        _thisComponent.showTooltip = false;
      });
  }

  private setTooltipPosition(dx: number, dy: number, data: HistogramData): void {
    this.showTooltip = true;
    if (this.dataUnit !== '') {
      this.dataUnit = '(' + this.dataUnit + ')';
    }
    this.tooltipXContent = 'x: ' + this.toString(data.key);
    this.tooltipYContent = 'y: ' + data.value + ' ' + this.dataUnit;
    this.tooltipVerticalPosition = (d3.event.pageX + dx)  + 'px';
    this.tooltipHorizontalPosition = (d3.event.pageY + dy)  + 'px';

  }

  private handleOnBrushingEvent(selectionbrush: d3.BrushBehavior<any>, chartAxes: ChartAxes): void {
    selectionbrush.on('brush', (datum: any, index: number) => {
      const selection = d3.event.selection;
      this.startValue = 'From ' + this.toString(selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0]);
      this.endValue = ' to ' + this.toString(selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1]);
      this.showTitle = false;
    });
  }

  private handleEndOfBrushingEvent(selectionbrush: d3.BrushBehavior<any>, chartAxes: ChartAxes): void {
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

  private toString(value: Date|number): string {
    if (value instanceof Date) {
      return value.toDateString();
    } else {
      return this.round(value, 1).toString();
    }
  }


  private parseDataKey(inputData: Array<{key: number, value: number}>): Array<HistogramData> {
     if (this.histogramType === timelineType) {
        return this.parseDataKeyToDate(inputData);
      } else {
        return inputData;
      }
  }
  private parseDataKeyToDate(inputData: Array<{key: number, value: number}>) {
    const parsedData = new Array<HistogramData>();
    let multiplier = 1;
    if (this.dateType === DateType.second) {
      multiplier = 1000;
    }
    inputData.forEach(d => {
      parsedData.push({key: new Date(d.key * multiplier), value: d.value});
    });
    return parsedData;
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

  private getXDomainExtent(data: Array<HistogramData>, selectedStartValue: Date|number,
  selectedEndValue: Date|number): Array<Date | number | { valueOf(): number }> {
    let interval = 0;
    if (this.chartType === barsChart) {
      interval = this.getBucketInterval(data);
    }
    const xDomainExtent = new Array<Date | number | { valueOf(): number }>();
    const dataKeyUnionSelectedValues = new Array<Date|number>();
    data.forEach(d => {
      dataKeyUnionSelectedValues.push(d.key);
    });
    dataKeyUnionSelectedValues.push(selectedStartValue);
    dataKeyUnionSelectedValues.push(selectedEndValue);
    if ( this.histogramType === timelineType) {
      xDomainExtent.push(new Date(d3.min(dataKeyUnionSelectedValues, (d: Date) => d).getTime() - interval));
      xDomainExtent.push(new Date(d3.max(dataKeyUnionSelectedValues, (d: Date) => d).getTime() + interval));
    } else {
      xDomainExtent.push(d3.min(dataKeyUnionSelectedValues, (d: number) => d) * 1 - interval);
      xDomainExtent.push(d3.max(dataKeyUnionSelectedValues, (d: number) => d) * 1 + interval);
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

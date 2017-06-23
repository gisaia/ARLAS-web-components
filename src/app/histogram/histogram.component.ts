import { Component, OnInit, Input, Output, ViewEncapsulation, ViewContainerRef, Injectable } from '@angular/core';

import { MarginModel } from '../models/margin.model';
import { ChartType } from '../enumerations/type.chart';
import { HistogramType } from '../enumerations/type.histogram';


import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as d3 from 'd3';

@Injectable()
@Component({
  selector: 'arlas-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HistogramComponent implements OnInit {

  private histogramNode: any;
  private histogramTitle: string;
  private context: any;
  private margin: MarginModel = { top: 2, right: 20, bottom: 20, left: 60 };
  private valueInterval = { startvalue: null, endvalue: null};
  startValue: string = null;
  endValue: string = null;
  showTooltip = false;
  tooltipHorizontalPosition = '0';
  tooltipVerticalPosition = '0';
  tooltipXContent: string;
  tooltipYContent: string;



  @Input() xTicks = 5;
  @Input() yTicks = 5;
  @Input() chartType = ChartType.bars;
  @Input() chartTitle = '';
  @Input() histogramType = HistogramType.timeline;
  @Input() startEndValuesColor = 'deeppink';
  @Input() startEndValuesBackgroundColor = 'rgba(220, 220, 220, 0)';
  @Input() dataUnit = '';

  @Output() valueChangedEvent: Subject<any> = new Subject<any>();

  constructor(private viewContainerRef: ViewContainerRef) {}


  showTimelineData() {
      this.histogramType = HistogramType.timeline;
      const parseDate = d3.timeParse('%b %Y');
      function type(d) {
          d.key = parseDate(d.key);
          d.value = +d.value;
          return d;
      }
      const _this = this;
      let data;
      d3.csv('sp502.csv', type, function(error, datas) {
          if (error) { throw error };
          data = datas
          _this.plotHistogram(data)
      });
  }

  showHistogramData() {
      this.histogramType = HistogramType.histogram;

      const parseDate = d3.timeParse('%b %Y');
      function type(d) {
          d.value = +d.value;
          return d;
      }
      const _this = this;
      let data;
      d3.csv('sp503.csv', type, function(error, datas) {
          if (error) { throw error };
          data = datas
          _this.plotHistogram(data)
      });
  }

  ngOnInit() {
      this.histogramNode = this.viewContainerRef.element.nativeElement;
      this.applyCssStyle();

      if (this.histogramType === HistogramType.timeline) {
        this.showTimelineData();
      } else if (this.histogramType === HistogramType.histogram) {
        this.showHistogramData();
      }
  }

  public plotHistogram(data: Array<any>): void {
      // if there is data already ploted, remove it
      if (this.context) {
          this.context.remove();
      }

      if (this.histogramType === HistogramType.timeline) {
        // this.parseDataKeyToDate(data);
      }
      this.startValue = this.toString(data[0].key);
      this.valueInterval.startvalue = data[0].key;
      this.endValue = this.toString(data[data.length - 1].key);
      this.valueInterval.endvalue = data[data.length - 1].key;

      const chartDimensions = this.initializeChartDimensions();
      const chartAxes = this.createChartAxes(chartDimensions, data);
      this.drawChartAxes(chartDimensions, chartAxes);
      this.plotHistogramData(chartDimensions, chartAxes, data);
      this.showTooltips(chartDimensions, chartAxes, data);

      const selectionbrush = d3.brushX().extent([[0, chartDimensions.height], [chartDimensions.width, 0]]);
      this.handleOnBrushingEvent(selectionbrush, chartAxes);
      this.handleEndOfBrushingEvent(selectionbrush, chartAxes);
      selectionbrush.extent([[Math.max(0, chartAxes.xDomain(this.valueInterval.startvalue)), 0],
                             [Math.min(chartAxes.xDomain(this.valueInterval.endvalue), chartDimensions.width), chartDimensions.height]]);
      this.context.append('g')
          .attr('class', 'brush')
          .call(selectionbrush);
  }

  private initializeChartDimensions(): any {
      const svg = d3.select(this.histogramNode).select('svg');
      const margin = this.margin;
      const width = +svg.attr('width') - this.margin.left - this.margin.right;
      const height = +svg.attr('height') - this.margin.top - this.margin.bottom;
      return {svg, margin, width, height}
  }

  private createChartAxes(chartDimensions: any, data: any): any {
      let xDomain;
      if (this.histogramType === HistogramType.timeline) {
          xDomain = d3.scaleTime().range([0, chartDimensions.width]);
        // this.parseDataKeyToDate(data);
      } else if (this.histogramType === HistogramType.histogram) {
          xDomain = d3.scaleLinear().range([0, chartDimensions.width]);
      }
      const yDomain = d3.scaleLinear().range([chartDimensions.height, 0]);
      xDomain.domain(d3.extent(data, (d: any) =>  d.key));
      yDomain.domain([0, d3.max(data, (d: any) => d.value)]);
      const xAxis = d3.axisBottom(xDomain).ticks(this.xTicks);
      const yAxis = d3.axisLeft(yDomain).ticks(this.yTicks);
      return {xDomain, yDomain, xAxis, yAxis}
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
      if (this.chartType === ChartType.bars) {
          this.plotHistogramAsBars(chartDimensions, chartAxes, data);
      } else if (this.chartType === ChartType.area) {
          this.plotHistogramAsArea(chartDimensions, chartAxes, data);
      }
  }

  private plotHistogramAsBars(chartDimensions: any, chartAxes: any, data: any): void {
      const histogram = d3.histogram()
          .value(function(d) { return d.key; })
          .domain(chartAxes.xDomain.domain())
          .thresholds(chartAxes.xDomain.ticks(data.length));
      const bins = histogram(data);
      this.context.selectAll('rect')
          .data(bins)
          .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', 1)
          .attr('transform', function(d) {return 'translate(' + chartAxes.xDomain(d.x0) + ',' + chartAxes.yDomain(d[0].value) + ')'; })
          .attr('width', function(d) { return chartAxes.xDomain(d.x1) - chartAxes.xDomain(d.x0) - 0.1 ; })
          .attr('height', function(d) { return chartDimensions.height - chartAxes.yDomain(d[0].value); });
  }

  private plotHistogramAsArea(chartDimensions: any, chartAxes: any, data: any): void {
      const area = d3.area()
          .curve(d3.curveMonotoneX)
          .x((d: any) =>  chartAxes.xDomain(d.key))
          .y0(chartDimensions.height)
          .y1((d: any) => chartAxes.yDomain(d.value));
      this.context.append('path')
          .datum(data)
          .attr('class', 'area')
          .attr('d', area);
  }

  private showTooltips(chartDimensions, chartAxes, data) {
      const _thisComponent = this;
      if (this.dataUnit !== '') {
          this.dataUnit = '(' + this.dataUnit + ')';
      }
      chartDimensions.svg.selectAll('dot').data(data).enter().append('circle')
          .attr('r', 2)
          .attr('cx', function(d) { return chartDimensions.margin.left + chartAxes.xDomain(d.key); })
          .attr('cy', function(d) { return chartDimensions.margin.top + chartAxes.yDomain(d.value); })
          .style('opacity', 0)
          .on('mouseover', function(d) {
              _thisComponent.showTooltip = true;
              _thisComponent.tooltipXContent = 'x: ' + _thisComponent.toString(d.key);
              _thisComponent.tooltipYContent = 'y: ' + d.value + ' ' + _thisComponent.dataUnit;
              _thisComponent.tooltipVerticalPosition = (d3.event.pageX) - 40 + 'px';
              _thisComponent.tooltipHorizontalPosition = (d3.event.pageY - 15) + 'px';
              })
          .on('mouseout', function(d) {
            _thisComponent.showTooltip = false;
          });
  }

  private handleOnBrushingEvent(selectionbrush: any, chartAxes: any): void {
      selectionbrush.on('brush', (datum: any, index: number) => {
          const selection = d3.event.selection;
          this.startValue = 'From ' + this.toString(selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0]);
          this.endValue = ' to ' + this.toString(selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1]);
          d3.select(this.histogramNode).select('#timeline_title_id')
              .style('display', 'none');
      });
  }

  private handleEndOfBrushingEvent(selectionbrush: any, chartAxes: any): void {
      const valueChangedEvent = this.valueChangedEvent;
      selectionbrush.on('end', (datum: any, index: number) => {
          const selection = d3.event.selection;
          this.valueInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
          this.valueInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
          this.startValue = this.toString(this.valueInterval.startvalue);
          this.endValue = this.toString(this.valueInterval.endvalue);
          valueChangedEvent.next(this.valueInterval);
          d3.select(this.histogramNode).select('#timeline_title_id')
              .style('display', 'inline');
      });
  }

  private toString (value: any): any {
    if (value instanceof Date) {
      return value.toDateString();
    } else if (value.length === undefined) {
      return this.round(value, 1).toString();
    } else {
      return value;
    }
  }

  private applyCssStyle(): void {
      // #start #end color
      /*d3.select(this.histogramNode).select('#tooltip').select('#start')
          .style('color', this.startEndValuesColor);
      d3.select(this.histogramNode).select('#tooltip').select('#end')
          .style('color', this.startEndValuesColor);*/
      // #start #end background color
      d3.select(this.histogramNode).select('#tooltip').select('#start')
          .style('background', this.startEndValuesBackgroundColor);
      d3.select(this.histogramNode).select('#tooltip').select('#end')
          .style('background', this.startEndValuesBackgroundColor);
  }

  private parseDataKeyToDate(data): void {
    if (data !== null && Array.isArray(data) && data.length > 0) {
        data.forEach(d => {
            d.key = new Date(d.key);
        });
    }
  }

  private round(value, precision): number {
        let multiplier ;
        if (precision === 1) {
           multiplier = precision;
        } else {
           multiplier = Math.pow(10, precision * 10 || 0);
        }
        return Math.round(value * multiplier) / multiplier;
  }

  setMargin(top: number, right: number, bottom: number, left: number): void {
      this.margin = {top, right, bottom, left};
  }
}

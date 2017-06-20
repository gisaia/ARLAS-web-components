import { Component, OnInit, Input, Output, ViewEncapsulation, ViewContainerRef, Injectable } from '@angular/core';

import { MarginModel } from '../models/margin.model';
import { ChartType } from '../enumerations/type.chart';
import { HistogramType } from '../enumerations/type.histogram';


import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as d3 from 'd3';

@Injectable()
@Component({
  selector: 'gisaia-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TimelineComponent implements OnInit {


  @Input() margin: MarginModel = { top: 2, right: 20, bottom: 20, left: 60 } ;
  @Input() dateFormat = '%Y %m';
  @Input() xTicks = 5;
  @Input() yTicks = 5;
  @Input() chartType = ChartType.bars;
  @Input() histogramType = HistogramType.timeline;
  @Input() startEndValuesColor = 'deeppink';
  @Input() startEndValuesBackgroundColor = 'rgba(220, 220, 220, 0)';

  @Output() timeLineEvents: Subject<any> = new BehaviorSubject<any>(undefined);
  @Output() valueChangedEvent: Subject<any> = new Subject<any>();
  private histogramNode;
  private histogramTitle;
  private context: any;
  private area: any;
  private histogram: any;
  private valueInterval: { startvalue: any, endvalue: any} = null;
  private startvalue: Date = null;
  private endvalue: Date = null;

  constructor(private viewContainerRef: ViewContainerRef) {
   }

  ngOnInit() {
      this.histogramNode = this.viewContainerRef.element.nativeElement;
      this.applyCssStyle();

      const parseDate = d3.timeParse('%b %Y');
      function type(d) {
          d.key = parseDate(d.key);
          d.value = +d.value;
          return d;
      }
      const _this = this;
      let data;
      d3.csv('sp500.csv', type, function(error, datas) {
          if (error) { throw error };
          data = datas
          _this.plotHistogram(data)
      });
  }

  public plotHistogram(data: Array<any>) {
      if (this.context) {
          this.context.remove();
      }
      const valueChangedEvent = this.valueChangedEvent;
      const svg = d3.select(this.histogramNode).select('svg');
      const margin = this.margin;
      const width = +svg.attr('width') - margin.left - margin.right;
      const height = +svg.attr('height') - margin.top - margin.bottom;
      let x ;
      if (this.histogramType === HistogramType.timeline) {
        x = d3.scaleTime().range([0, width]);
        this.histogramTitle = 'TIMELINE';
      } else if (this.histogramType === HistogramType.histogram) {
        x = d3.scaleLinear().range([0, width]);
        this.histogramTitle = 'HISTOGRAM';
      }
      const y = d3.scaleLinear().range([height, 0]);
      x.domain(d3.extent(data, (d: any) =>  d.key));
      y.domain([0, d3.max(data, (d: any) => d.value)]);
      const parseDate = d3.timeParse(this.dateFormat);

      const xAxis = d3.axisBottom(x).ticks(this.xTicks);
      const yAxis = d3.axisLeft(y).ticks(this.yTicks);

      if (this.chartType === ChartType.bars) {
          this.histogram = d3.histogram()
              .value(function(d) { return d.key; })
              .domain(x.domain())
              .thresholds(x.ticks(data.length));
      } else if (this.chartType === ChartType.area) {
          this.area = d3.area()
              .curve(d3.curveMonotoneX)
              .x((d: any) =>  x(d.key))
              .y0(height)
              .y1((d: any) => y(d.value));
      }

      this.context = svg.append('g')
          .attr('class', 'context')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      this.context.append('g')
          .attr('class', 'axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);
      this.context.append('g')
          .attr('class', 'axis')
          .attr('transform', 'translate(0,2)')
          .call(yAxis);

      if (this.chartType === ChartType.bars) {
          const bins = this.histogram(data);
          this.context.selectAll('rect')
              .data(bins)
              .enter().append('rect')
              .attr('class', 'bar')
              .attr('x', 1)
              .attr('transform', function(d) {return 'translate(' + x(d.x0) + ',' + y(d[0].value) + ')'; })
              .attr('width', function(d) { return x(d.x1) - x(d.x0) - 0.1 ; })
              .attr('height', function(d) { return height - y(d[0].value); });
      } else if (this.chartType === ChartType.area) {
          this.context.append('path')
              .datum(data)
              .attr('class', 'area')
              .attr('d', this.area);
      }

      this.valueInterval = { startvalue: null, endvalue: null}
      this.startvalue = data[0].key;
      this.valueInterval.startvalue = this.startvalue;
      this.endvalue = data[data.length - 1].key;
      this.valueInterval.endvalue = this.endvalue;

      const selectionbrush = d3.brushX().extent([[0, height], [width, 0]]);
      d3.select(this.histogramNode).select('#start').classed('small', true);
      d3.select(this.histogramNode).select('#end').classed('small', true);
      d3.select(this.histogramNode).select('#tooltip').select('#start')
          .text(this.toString(this.startvalue));
      d3.select(this.histogramNode).select('#tooltip').select('#end')
          .text(this.toString(this.endvalue));

      selectionbrush.on('end', (datum: any, index: number) => {
          d3.select(this.histogramNode).select('#start').classed('small', true);
          d3.select(this.histogramNode).select('#end').classed('small', true);
          const selection = d3.event.selection;
          this.startvalue = selection.map(x.invert, x)[0];
          this.endvalue = selection.map(x.invert, x)[1];
          this.valueInterval.startvalue = this.startvalue;
          this.valueInterval.endvalue = this.endvalue;

          valueChangedEvent.next(this.valueInterval);
          d3.select(this.histogramNode).select('#tooltip').select('#start')
              .text(this.toString(selection.map(x.invert, x)[0]));
          d3.select(this.histogramNode).select('#tooltip').select('#end')
              .text(this.toString(selection.map(x.invert, x)[1]));
          d3.select(this.histogramNode).select('#timeline_title_id')
              .style('display', 'inline');

      });
      selectionbrush.on('brush', (datum: any, index: number) => {
          const selection = d3.event.selection;
          if (this.histogramType === HistogramType.timeline) {
              if (selection.map(x.invert, x)[0].getTime() !== this.startvalue.getTime()) {
                  d3.select(this.histogramNode).select('#start').classed('small', false);
              }
              if (selection.map(x.invert, x)[1].getTime() !== this.endvalue.getTime()) {
                  d3.select(this.histogramNode).select('#end').classed('small', false);
              }
          } else if (this.histogramType === HistogramType.histogram) {
              if (selection.map(x.invert, x)[0] !== this.startvalue) {
                  d3.select(this.histogramNode).select('#start').classed('small', false);
              }
              if (selection.map(x.invert, x)[1] !== this.endvalue) {
                  d3.select(this.histogramNode).select('#end').classed('small', false);
              }
          }
          d3.select(this.histogramNode).select('#tooltip').select('#start')
              .text('From ' + this.toString(selection.map(x.invert, x)[0]));
          d3.select(this.histogramNode).select('#tooltip').select('#end')
              .text(' to ' + this.toString(selection.map(x.invert, x)[1]));
          d3.select(this.histogramNode).select('#timeline_title_id')
              .style('display', 'none');
      });
      selectionbrush.extent([[Math.max(0, x(this.startvalue)), 0], [Math.min(x(this.endvalue), width), height]]);
      this.context.append('g')
          .attr('class', 'brush')
          .call(selectionbrush);
  }

  private toString (value: any): any {
    if (value instanceof Date) {
      return value.toDateString();
    } else {
      return this.round(value, 1);
    }
  }

  private isDataKeyInstanceofDate(data: any) {
    if (data !== null && Array.isArray(data) && data.length > 0) {
      if (data[0].key instanceof Date) {
        return true;
      } else {
        return false;
      }
    } else {
      // throw new Error('Invalid data : data is null, or is an empty array');
    }
  }

  private applyCssStyle() {
      // #start #end color
      d3.select(this.histogramNode).select('#tooltip').select('#start')
          .style('color', this.startEndValuesColor);
      d3.select(this.histogramNode).select('#tooltip').select('#end')
          .style('color', this.startEndValuesColor);
      // #start #end background color
      d3.select(this.histogramNode).select('#tooltip').select('#start')
          .style('background', this.startEndValuesBackgroundColor);
      d3.select(this.histogramNode).select('#tooltip').select('#end')
          .style('background', this.startEndValuesBackgroundColor);
  }

  private parseDataKey(data) {
    if (data !== null && Array.isArray(data) && data.length > 0) {
        data.forEach(d => {
            d.key = new Date(d.key);
        });
    }
  }

  private round(value, precision) {
        let multiplier ;
        if (precision === 1) {
           multiplier = precision;
        } else {
           multiplier = Math.pow(10, precision * 10 || 0);
        }
        return Math.round(value * multiplier) / multiplier;
    }

  setMargin(top: number, right: number, bottom: number, left: number) {
      this.margin = {top, right, bottom, left};
      this.timeLineEvents.next(this.margin);
  }

  setDateFormat(dateFormat: string) {
      this.dateFormat = dateFormat;
      this.timeLineEvents.next(this.margin);
  }
}

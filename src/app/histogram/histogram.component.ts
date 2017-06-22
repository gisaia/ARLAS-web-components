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
  private area: any;
  private margin: MarginModel = { top: 2, right: 20, bottom: 20, left: 60 };
  private histogram: any;
  private valueInterval: { startvalue: any, endvalue: any} = null;
  private startValueString: string = null;
  private endValueString: string = null;

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

  public plotHistogram(data: Array<any>) {
      // if there is data already ploted, remove it
      if (this.context) {
          this.context.remove();
      }

      const valueChangedEvent = this.valueChangedEvent;

      // initialize the chart size
      const svg = d3.select(this.histogramNode).select('#svgix');
      const margin = this.margin;
      const width = +svg.attr('width') - margin.left - margin.right;
      const height = +svg.attr('height') - margin.top - margin.bottom;

      // Create x and y axes and set their domains and ticks
      let x ;
      if (this.histogramType === HistogramType.timeline) {
        x = d3.scaleTime().range([0, width]);
        // this.parseDataKey(data);
      } else if (this.histogramType === HistogramType.histogram) {
        x = d3.scaleLinear().range([0, width]);
      }
      const y = d3.scaleLinear().range([height, 0]);
      x.domain(d3.extent(data, (d: any) =>  d.key));
      y.domain([0, d3.max(data, (d: any) => d.value)]);
      const xAxis = d3.axisBottom(x).ticks(this.xTicks);
      const yAxis = d3.axisLeft(y).ticks(this.yTicks);

      // depending on the chartType input, we create bars or a continuous curve (monotone)
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

      // draw the x, y axes and the curve/bars in the right positions
      const div = d3.select('body').append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0);
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

      // plot the data in the chart
      if (this.chartType === ChartType.bars) {
          const bins = this.histogram(data);
          this.context.selectAll('rect')
              .data(bins)
              .enter().append('rect')
              .attr('class', 'bar')
              .attr('x', 1)
              .attr('transform', function(d) {console.log(d);
               return 'translate(' + x(d.x0) + ',' + y(d[0].value) + ')'; })
              .attr('width', function(d) { return x(d.x1) - x(d.x0) - 0.1 ; })
              .attr('height', function(d) { return height - y(d[0].value); });
      } else if (this.chartType === ChartType.area) {
          this.context.append('path')
              .datum(data)
              .attr('class', 'area')
              .attr('d', this.area);
      }

      // show tooltips
      const _thisElement = this;
      if (this.dataUnit !== '') {
          this.dataUnit = '(' + this.dataUnit + ')';
      }
      svg.selectAll('dot').data(data).enter().append('circle')
              .attr('r', 2)
              .attr('cx', function(d) { return margin.left + x(d.key); })
              .attr('cy', function(d) { return margin.top + y(d.value); })
              .style('opacity', 0)
              .on('mouseover', function(d) {
                  div.transition()
                    .duration(0)
                    .style('opacity', .9);
                  div.html('x: ' + _thisElement.toString(d.key) + '<br/>' + 'y: ' + d.value + ' ' + _thisElement.dataUnit)
                    .style('left', (d3.event.pageX) + 'px')
                    .style('top', (d3.event.pageY - 10) + 'px')
                    .style('z-index', 20000);
                  })
                .on('mouseout', function(d) {
                  div.transition()
                    .duration(500)
                    .style('opacity', 0);
                  });

      // initialize brush extent values
      this.valueInterval = { startvalue: null, endvalue: null}
      let startValue = data[0].key;
      this.startValueString = this.toString(startValue);
      this.valueInterval.startvalue = startValue;
      let endValue = data[data.length - 1].key;
      this.endValueString = this.toString(endValue);
      this.valueInterval.endvalue = endValue;
      console.log('qifj');

      // create brush
      const selectionbrush = d3.brushX().extent([[0, height], [width, 0]]);

      // handle on end brush event
      selectionbrush.on('end', (datum: any, index: number) => {
          const selection = d3.event.selection;
          startValue = selection.map(x.invert, x)[0];
          endValue = selection.map(x.invert, x)[1];
          this.valueInterval.startvalue = startValue;
          this.valueInterval.endvalue = endValue;
          this.startValueString = this.toString(startValue);
          this.endValueString = this.toString(endValue);
          valueChangedEvent.next(this.valueInterval);
          d3.select(this.histogramNode).select('#timeline_title_id')
              .style('display', 'inline');

      });

      // handle while brushing event
      selectionbrush.on('brush', (datum: any, index: number) => {
          const selection = d3.event.selection;
          this.startValueString = 'From ' + this.toString(selection.map(x.invert, x)[0]);
          this.endValueString = ' to ' + this.toString(selection.map(x.invert, x)[1]);
          d3.select(this.histogramNode).select('#timeline_title_id')
              .style('display', 'none');
      });
      selectionbrush.extent([[Math.max(0, x(startValue)), 0], [Math.min(x(endValue), width), height]]);
      this.context.append('g')
          .attr('class', 'brush')
          .call(selectionbrush);
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
  }
}

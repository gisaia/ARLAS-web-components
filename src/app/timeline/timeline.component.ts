import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

import { MarginModel } from '../models/margin.model';

import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as d3 from 'd3';

@Component({
  selector: 'gisaia-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TimelineComponent implements OnInit {


  @Input() margin: MarginModel = { top: 2, right: 20, bottom: 20, left: 60 } ;
  @Input() dateFormat = '%Y %m';
  @Input() xTicks: number;
  @Input() yTicks: number;

  timeLineEvents: Subject<any> = new BehaviorSubject<any>(undefined);
  dateChangedEvent: Subject<any> = new Subject<any>();

  counter = 0;
  timelineNode = 'body';
  context: any;
  area: any;
  dateInterval: { startdate: any, enddate: any}
  startdate: Date = null;
  enddate: Date = null;

  constructor() { }

  ngOnInit() {


    function type(d) {
      // d.date = parseDate(d.date);
      d.price = +d.price;
      d.price2 = +d.price2;

      return d;
    }
    this.plot(null, null, null);
  }

  setMargin(top: number, right: number, bottom: number, left: number) {
    this.margin = {top, right, bottom, left};
    this.timeLineEvents.next(this.margin);
  }

  setDateFormat(dateFormat: string) {
    this.dateFormat = dateFormat;
    this.timeLineEvents.next(this.margin);
  }

  public plot(datas: Array<any>, startDate: any, endDate: any) {

    const svg = d3.select('svg'),
    margin = {top: 20, right: 20, bottom: 110, left: 40},
    margin2 = {top: 430, right: 20, bottom: 30, left: 40},
    width = +svg.attr('width') - margin.left - margin.right,
    height = +svg.attr('height') - margin.top - margin.bottom,
    height2 = +svg.attr('height') - margin2.top - margin2.bottom;
    const dateChangedEvent = this.dateChangedEvent;
    const parseDate = d3.timeParse('%b %Y');

    const x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]);

    const xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    const brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on('brush', brushed);

    const zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on('zoom', zoomed);

    const area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x(d.date); })
        .y0(height)
        .y1(function(d) { return y(d.price); });

    const area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x2(d.date); })
        .y0(height2)
        .y1(function(d) { return y2(d.price); });

    svg.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);

    const focus = svg.append('g')
        .attr('class', 'focus')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const context = svg.append('g')
        .attr('class', 'context')
        .attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')');

    const count = this.counter;
    d3.csv('sp500.csv', type, function(error, data) {
      if (error) { throw error };

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.price; })]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      focus.append('path')
          .datum(data)
          .attr('class', 'area')
          .attr('d', area);

      focus.append('g')
          .attr('class', 'axis axis--x')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

      focus.append('g')
          .attr('class', 'axis axis--y')
          .call(yAxis);

      context.append('path')
          .datum(data)
          .attr('class', 'area')
          .attr('d', area2);

      context.append('g')
          .attr('class', 'axis axis--x')
          .attr('transform', 'translate(0,' + height2 + ')')
          .call(xAxis2);

      // if (this.counter === 0) {
      context.append('g')
          .attr('class', 'brush')
          .call(brush)
          .call(brush.move, x.range());
      // }

      svg.append('rect')
          .attr('class', 'zoom')
          .attr('width', width)
          .attr('height', height)
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          .call(zoom);
    });
    this.counter++;
    function brushed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {return}; // ignore brush-by-zoom
      const s = d3.event.selection || x2.range();
      x.domain(s.map(x2.invert, x2));
      focus.select('.area').attr('d', area);
      focus.select('.axis--x').call(xAxis);
      svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
          .scale(width / (s[1] - s[0]))
          .translate(-s[0], 0));
      dateChangedEvent.next(s);
    }

    function zoomed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') {return}; // ignore zoom-by-brush
      const t = d3.event.transform;
      x.domain(t.rescaleX(x2).domain());
      focus.select('.area').attr('d', area);
      focus.select('.axis--x').call(xAxis);
      context.select('.brush').call(brush.move, x.range().map(t.invertX, t));
    }

    function type(d) {
      d.date = parseDate(d.date);
      d.price = +d.price;
      return d;
    }
  }


}

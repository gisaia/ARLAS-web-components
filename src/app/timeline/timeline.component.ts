import { Component, OnInit, Input, ViewEncapsulation, ViewContainerRef } from '@angular/core';

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
  dateInterval: { startdate: any, enddate: any} = null;
  startdate: Date = null;
  enddate: Date = null;

  constructor(private viewContainerRef: ViewContainerRef) { }

  ngOnInit() {
    this.timelineNode = this.viewContainerRef.element.nativeElement;
    const parseDate = d3.timeParse('%b %Y');
    function type(d) {


      d.date = parseDate(d.date);
      d.price = +d.price;

      return d;
    }
    const _this = this;
    let data;
    d3.csv('sp500.csv', type, function(error, datas) {
      if (error) { throw error };
        data = datas
        _this.plot(data, null, null)
      });

  }

  setMargin(top: number, right: number, bottom: number, left: number) {
    this.margin = {top, right, bottom, left};
    this.timeLineEvents.next(this.margin);
  }

  setDateFormat(dateFormat: string) {
    this.dateFormat = dateFormat;
    this.timeLineEvents.next(this.margin);
  }

  public plotFake(data: Array<any>, startDate: any, endDate: any) {
    const parseDate = d3.timeParse('%b %Y');
    function type(d) {


      d.date = parseDate(d.date);
      d.price = +d.price;

      return d;
    }
    const _this = this;
    d3.csv('sp500.csv', type, function(error, datas) {
      if (error) { throw error };
        _this.plot(datas, null, null)
      });
  }

  public plot(data: Array<any>, startDate: any, endDate: any) {
      if (this.context) {
          this.context.remove();
      }

      // this.timelineNode = 'body'
      const dateChangedEvent = this.dateChangedEvent;
      const svg = d3.select(this.timelineNode).select('svg');
      const margin = this.margin;
      const width = +svg.attr('width') - margin.left - margin.right;
      const height = +svg.attr('height') - margin.top - margin.bottom;
      const x = d3.scaleTime().range([0, width]);
      const y = d3.scaleLinear().range([height, 0]);
      x.domain(d3.extent(data, (d: any) =>  d.date));
      y.domain([0, d3.max(data, (d: any) => d.price)]);
      const parseDate = d3.timeParse(this.dateFormat);
      const xAxis = d3.axisBottom(x).ticks(5);
      const yAxis = d3.axisLeft(y).ticks(2);

      this.area = d3.area()
          .curve(d3.curveMonotoneX)
          .x((d: any) =>  x(d.date))
          .y0(height)
          .y1((d: any) => y(d.price));

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

      this.context.append('path')
          .datum(data)
          .attr('class', 'area')
          .attr('d', this.area);

      const selectionbrush = d3.brushX().extent([[0, height], [width, 0]]);
          // .x(d3.scaleIdentity().domain([0, width]))
          // .y(d3.scaleIdentity().domain([height, 0]));

      this.dateInterval = { startdate: null, enddate: null}
      if (startDate !== null) {
          this.startdate = startDate;
          this.dateInterval.startdate = this.startdate;
      } else {
          this.startdate = data[0].date;
          this.dateInterval.startdate = this.startdate;
      }
      if (endDate != null) {
          this.enddate = endDate;
      } else {
          this.enddate = data[data.length - 1].date;
          this.dateInterval.enddate = this.enddate;
      }
      d3.select(this.timelineNode).select('#start').classed('small', true);
      d3.select(this.timelineNode).select('#end').classed('small', true);
      d3.select(this.timelineNode).select('#tooltip').select('#start')
          .text(this.startdate.toDateString());
      d3.select(this.timelineNode).select('#tooltip').select('#end')
          .text(this.enddate.toDateString());

      selectionbrush.on('end', (datum: any, index: number) => {
          d3.select(this.timelineNode).select('#start').classed('small', true);
          d3.select(this.timelineNode).select('#end').classed('small', true);
          const selection = d3.event.selection;
          this.startdate = selection.map(x.invert, x)[0];
          this.enddate = selection.map(x.invert, x)[1];
          this.dateInterval.startdate = this.startdate;
          this.dateInterval.enddate = this.enddate;
          dateChangedEvent.next(this.dateInterval)
          // this.esservice.setPeriod(this.startdate, this.enddate);
          d3.select(this.timelineNode).select('#tooltip').select('#start')
              .text(selection.map(x.invert, x)[0].toDateString());
          d3.select(this.timelineNode).select('#tooltip').select('#end')
              .text(selection.map(x.invert, x)[1].toDateString());
      });
      selectionbrush.on('brush', (datum: any, index: number) => {
          const selection = d3.event.selection;
          if (selection.map(x.invert, x)[0].getTime() !== this.startdate.getTime()) {
              d3.select(this.timelineNode).select('#start').classed('small', false);
          }
          if (selection.map(x.invert, x)[1].getTime() !== this.enddate.getTime()) {
              d3.select(this.timelineNode).select('#end').classed('small', false);
          }
          d3.select(this.timelineNode).select('#tooltip').select('#start')
              .text('From ' + selection.map(x.invert, x)[0].toDateString());
          d3.select(this.timelineNode).select('#tooltip').select('#end')
              .text(' to ' + selection.map(x.invert, x)[1].toDateString());
      });
      selectionbrush.extent([[Math.max(0, x(this.startdate)), 0], [Math.min(x(this.enddate), width), height]]);
      this.context.append('g')
          .attr('class', 'brush')
          .call(selectionbrush);

      function type(d) {
        // d.date = parseDate(d.date);
        d.price = +d.price;
        return d;
      }

  }


}

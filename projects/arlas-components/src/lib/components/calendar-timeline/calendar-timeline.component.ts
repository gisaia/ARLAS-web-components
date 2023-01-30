/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Component, Input, ElementRef, ViewChild, AfterViewInit, Output } from '@angular/core';
import { Dimensions, Granularity, Margins, Timeline, TimelineData, TimelineTooltip } from 'arlas-d3';
import { Subject } from 'rxjs';
import * as timelineJsonSchema from './calendar-timeline.schema.json';


@Component({
  selector: 'arlas-calendar-timeline',
  templateUrl: './calendar-timeline.component.html',
  styleUrls: ['./calendar-timeline.component.css']
})
/**
 * todo : documentation of the component
 */
export class CalendarTimelineComponent implements AfterViewInit {

  @Input() public id;
  @Input() public granularity: Subject<Granularity> = new Subject();
  @Input() public boundDates: Subject<Date[]> = new Subject();
  @Input() public data: Subject<TimelineData[]> = new Subject();
  @Output() public selectedData: Subject<TimelineData> = new Subject();
  @Output() public hoveredData: Subject<TimelineTooltip> = new Subject();

  public width: number;
  public height: number;

  @ViewChild('timeline_container', { static: false }) private timelineContainer: ElementRef;

  public ngAfterViewInit(): void {
    const element: HTMLElement = this.timelineContainer.nativeElement;
    const svg = element.querySelector('svg');
    const margins = (new Margins()).setBottom(5).setTop(5).setRight(5).setLeft(5);
    this.width = element.offsetWidth;
    this.height = 90;
    const dimensions = (new Dimensions(this.width, this.height)).setMargins(margins);
    const timeline = (new Timeline(svg));
    this.selectedData = timeline.selectedData;
    timeline.setDimensions(dimensions);
    this.granularity.subscribe(g => {
      timeline.setGranularity(g);
    });
    this.boundDates.subscribe(g => {
      timeline.setBoundDates(g);
    });
    this.data.subscribe(g => {
      timeline.setData(g);
      timeline.plot();
    });
    
    timeline.hoveredData.subscribe(r => {
      this.hoveredData.next(r);
    })
  }



}

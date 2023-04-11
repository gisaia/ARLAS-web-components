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

import { Component, Input, ElementRef, ViewChild, AfterViewInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Dimensions, Granularity, Margins, Timeline, TimelineData, TimelineTooltip } from 'arlas-d3';
import { debounceTime, fromEvent, Subject } from 'rxjs';
import * as timelineJsonSchema from './calendar-timeline.schema.json';

export enum TranslationDirection {
  past = 'past',
  future = 'future'
}

@Component({
  selector: 'arlas-calendar-timeline',
  templateUrl: './calendar-timeline.component.html',
  styleUrls: ['./calendar-timeline.component.css']
})
/**
 * todo : documentation of the component
 */
export class CalendarTimelineComponent implements AfterViewInit, OnChanges {

  @Input() public id;
  @Input() public granularity: Granularity;
  @Input() public climatological: boolean;
  @Input() public boundDates: Date[] = [];
  @Input() public data: TimelineData[] = [];
  @Input() public cursorPosition: Date;
  @Input() public hideLeftButton: boolean;
  @Input() public hideRightButton: boolean;

  @Output() public selectedData: Subject<TimelineData> = new Subject();
  @Output() public hoveredData: Subject<TimelineTooltip> = new Subject();
  @Output() public translate: Subject<TranslationDirection> = new Subject();

  public width: number;
  public height: number;

  private timeline: Timeline;

  @ViewChild('timeline_container', { static: false }) private timelineContainer: ElementRef;

  public constructor() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(500))
      .subscribe((event: Event) => {
        const element: HTMLElement = this.timelineContainer.nativeElement;
        const margins = (new Margins()).setBottom(5).setTop(5).setRight(5).setLeft(5);
        this.width = element.offsetWidth;
        this.height = 90;
        const dimensions = (new Dimensions(this.width, this.height)).setMargins(margins);
        if (this.timeline) {
          this.timeline.setDimensions(dimensions);
          this.timeline.plot();
        }
      });
  }
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && this.timeline) {
      this.timeline.setData(this.data);
      if (this.timeline.boundDates && this.timeline.boundDates.length === 2) {
        this.timeline.plot(true);
      }
    }
    if (changes.boundDates && this.timeline) {
      this.timeline.setBoundDates(this.boundDates);
      this.timeline.plot();
    }
    if (changes.granularity && this.timeline) {
      this.timeline.setGranularity(this.granularity);
    }
    if (changes.climatological && this.timeline) {
      this.timeline.setClimatological(this.climatological);
    }
    if (changes.cursorPosition && this.timeline) {
      this.timeline.moveCursor(this.cursorPosition);
    }
  }
  public ngAfterViewInit(): void {
    const element: HTMLElement = this.timelineContainer.nativeElement;
    const svg = element.querySelector('svg');
    const margins = (new Margins()).setBottom(5).setTop(5).setRight(5).setLeft(5);
    this.width = element.offsetWidth;
    this.height = 90;
    const dimensions = (new Dimensions(this.width, this.height)).setMargins(margins);
    this.timeline = (new Timeline(svg));
    this.timeline.setDimensions(dimensions);
    this.timeline.setBoundDates(this.boundDates);

    this.timeline.hoveredData.subscribe(r => {
      this.hoveredData.next(r);
    });
    this.timeline.selectedData.subscribe(r => {
      this.selectedData.next(r);
    });
  }

  public plot(): void {
    if (this.timeline) {
      this.timeline.plot();
    }
  }

  public translateFuture(): void {
    this.translate.next(TranslationDirection.future);
  }

  public translatePast(): void {
    this.translate.next(TranslationDirection.past);
  }
}

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

import { AfterViewInit, Component, ElementRef, input, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Dimensions, Granularity, Margins, Timeline, TimelineData, TimelineTooltip } from 'arlas-d3';
import { debounceTime, fromEvent, Subject, takeUntil } from 'rxjs';

export enum TranslationDirection {
  past = 'past',
  future = 'future'
}

@Component({
    selector: 'arlas-calendar-timeline',
    templateUrl: './calendar-timeline.component.html',
    styleUrls: ['./calendar-timeline.component.scss'],
    imports: [MatIcon, MatButtonModule]
})
/**
 * todo : documentation of the component
 */
export class CalendarTimelineComponent implements AfterViewInit, OnChanges, OnDestroy {

  public id = input.required<string>();
  @Input() public granularity?: Granularity;
  @Input() public climatological = false;
  @Input() public boundDates: Date[] = [];
  @Input() public data: TimelineData[] = [];
  @Input() public cursorPosition?: Date;
  @Input() public hideLeftButton = false;
  @Input() public hideRightButton = false;

  @Output() public selectedData: Subject<TimelineData> = new Subject();
  @Output() public hoveredData: Subject<TimelineTooltip> = new Subject();
  @Output() public translate: Subject<TranslationDirection> = new Subject();

  public width?: number;
  public height = 90;

  private timeline?: Timeline;

  private _onDestroy$ = new Subject<boolean>();

  @ViewChild('timeline_container', { static: false }) private readonly timelineContainer?: ElementRef;

  public constructor() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(500), takeUntil(this._onDestroy$))
      .subscribe((event: Event) => {
        if (this.timelineContainer) {
          const element: HTMLElement = this.timelineContainer.nativeElement;
          const margins = (new Margins()).setBottom(5).setTop(5).setRight(5).setLeft(5);
          this.width = element.offsetWidth;
          const dimensions = (new Dimensions(this.width, this.height)).setMargins(margins);
          if (this.timeline) {
            this.timeline.setDimensions(dimensions);
            this.timeline.plot();
          }
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
      this.timeline.setGranularity(changes.granularity.currentValue);
    }
    if (changes.climatological && this.timeline) {
      this.timeline.setClimatological(this.climatological);
    }
    if (changes.cursorPosition && this.timeline) {
      this.timeline.moveCursor(changes.cursorPosition.currentValue);
    }
  }

  public ngAfterViewInit(): void {
    if (!this.timelineContainer) {
      throw new Error('Failed to initialise CalendarTimelineComponent');
    }

    const element: HTMLElement = this.timelineContainer.nativeElement;
    const svg = element.querySelector('svg');
    const margins = (new Margins()).setBottom(5).setTop(5).setRight(5).setLeft(5);
    this.width = element.offsetWidth;
    this.height = 90;
    const dimensions = (new Dimensions(this.width, this.height)).setMargins(margins);

    if (svg) {
      this.timeline = (new Timeline(svg));
      this.timeline.setDimensions(dimensions);
      this.timeline.setBoundDates(this.boundDates);

      this.timeline.hoveredData
        .pipe(takeUntil(this._onDestroy$))
        .subscribe(r => {
          this.hoveredData.next(r);
        });
      this.timeline.selectedData
        .pipe(takeUntil(this._onDestroy$))
        .subscribe(r => {
          this.selectedData.next(r);
        });
    }
  }

  public ngOnDestroy() {
    this._onDestroy$.next(true);
    this._onDestroy$.complete();
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

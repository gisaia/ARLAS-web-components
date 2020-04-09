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

import { Directive, Input, Output, HostListener, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { ModeEnum } from '../utils/enumerations/modeEnum';
import { Item } from '../model/item';

@Directive({
  selector: '[arlasResultScroll]',
})

export class ResultScrollDirective implements OnChanges {
  @Input() public items: Array<Item>;
  @Input() public nbLinesBeforeFetch: number;
  @Input() public nbGridColumns: number;
  @Input() public resultMode: ModeEnum;
  @Input() public fetchState: { endListUp: true, endListDown: false };
  @Input() public scrollOptions: { maintainScrollUpPosition: boolean, maintainScrollDownPosition: boolean, nbLines: number };
  /**
   * @deprecated moreDataEvent is replaced with `nextDataEvent`.
   */
  @Output() public moreDataEvent: Subject<number> = new Subject<number>();
  @Output() public nextDataEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();
  @Output() public previousDataEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();
  private lastScrollTop = 0;
  private moreDataCallsCounter = 0;
  private previousFirstId: string = null;
  private previousLastId: string = null;
  private tbodyHeight;
  private scrolledProgramatically = false;
  private nbScrolledLines;
  private top;
  private height;
  constructor(private el: ElementRef) { }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['items']) {
      /** New data is loaded : we reset all the variables */
      this.lastScrollTop = 0;
      this.moreDataCallsCounter = 0;
      this.previousFirstId = null;
      this.previousLastId = null;
      /** Repositioning the scroll bar to the top*/
      this.el.nativeElement.scrollTop = 0;
    }
    if (changes['resultMode']) {
      this.adjustScrollToMode();
    }

    if (changes['scrollOptions']) {
      if (this.scrollOptions.maintainScrollUpPosition === true && this.items) {
        /**
         * Maintains the scroll position after loading rows in the top of the list
         */
        this.el.nativeElement.scrollTop = this.el.nativeElement.scrollHeight * this.scrollOptions.nbLines / this.items.length;
      }
      if (this.scrollOptions.maintainScrollDownPosition === true && this.items) {
        /**
         * Maintains the scroll position after loading rows in the bottom of the list
         */
        this.el.nativeElement.scrollTop = this.el.nativeElement.scrollHeight -
        this.el.nativeElement.scrollHeight * this.scrollOptions.nbLines / this.items.length - this.tbodyHeight / 2;
      }
    }
  }

  /** This method allows to stay around the same items when switching the mode grid/list */
  public adjustScrollToMode() {
    if (this.items) {
      if (this.resultMode === ModeEnum.grid) {
        this.nbScrolledLines = Math.round(this.top / this.height * this.items.length);
        if (this.nbScrolledLines % this.nbGridColumns !== 0) {
          this.nbScrolledLines = Math.max(this.nbScrolledLines - this.nbScrolledLines % this.nbGridColumns, 0);
        }
      } else {
        this.nbScrolledLines = Math.round(this.top / this.height * this.items.length);
      }
      this.triggerScrollEvent();
    }
  }

  // When scrolling, the position of the scroll bar is calculated
  // Loading the previous/next data is triggered when [nbEndScrollItems] items are left while scrolling up/down respectively
  @HostListener('scroll', ['$event'])
  public onScroll(event) {
    this.tbodyHeight = this.el.nativeElement.offsetHeight;
    const scrollTop = this.el.nativeElement.scrollTop;
    const scrollHeight = this.el.nativeElement.scrollHeight;

    const nLastLines = this.nbLinesBeforeFetch / ((this.nbGridColumns - 1) * this.resultMode + 1);
    const dataLength = this.items.length / ((this.nbGridColumns - 1) * this.resultMode + 1);
    const downPositionTrigger = scrollHeight * (1 - nLastLines / dataLength - this.tbodyHeight / scrollHeight);
    const upPositionTrigger = scrollHeight * nLastLines / dataLength;
    if (this.scrolledProgramatically) {
      this.el.nativeElement.scrollTop = scrollHeight * this.nbScrolledLines / this.items.length;
      this.scrolledProgramatically = false;
    }
    this.top = scrollTop;
    this.height = scrollHeight;
    if (this.previousFirstId) {
        if (this.previousFirstId !== this.items[0].identifier || (this.fetchState && this.fetchState.endListDown)) {
          this.previousFirstId = null;
        }
    }
    if (this.previousLastId) {
      if (this.previousLastId !== this.items[this.items.length - 1].identifier || (this.fetchState && this.fetchState.endListUp)) {
        this.previousLastId = null;
      }
    }
    if (scrollTop >= downPositionTrigger && this.isScrollingDown(scrollTop)) {
      /** The following condition answers the question : when should I stop emitting `nextDataEvent` even if i reach the end of the scroll?
       * The answer is: when `nextDataEvent` is emitted and there is no new items loaded.
       * In other words if `downPositionTrigger` is reached and the last identifier we remember
       * from the previous scoll is different from the actual last identifer,
       * it means `nextDataEvent` still can be emitted
      **/
      if (this.items.length > 0 && this.items[this.items.length - 1].identifier !== this.previousLastId && this.fetchState
         && !this.fetchState.endListDown) {
        this.previousLastId = this.items[this.items.length - 1].identifier;
        this.previousFirstId = null;
        this.nextDataEvent.next(this.items[this.items.length - 1].itemData);
        this.moreDataCallsCounter++;
        this.moreDataEvent.next(this.moreDataCallsCounter);
      }
    }
    if (scrollTop <= upPositionTrigger && this.isScrollingUp(scrollTop)) {
      /** Same logic as the condition above but on the top of the list this time. */
      if (this.items.length > 0 && this.items[0].identifier !== this.previousFirstId && this.fetchState && !this.fetchState.endListUp) {
        this.previousFirstId = this.items[0].identifier;
        this.previousLastId = null;
        this.previousDataEvent.next(this.items[0].itemData);
      }
    }
    this.lastScrollTop = this.el.nativeElement.scrollTop;
  }

  private isScrollingDown(scrollTop) {
    if (scrollTop > this.lastScrollTop) {
      return true;
    }
  }
  private isScrollingUp(scrollTop) {
    if (scrollTop < this.lastScrollTop) {
      return true;
    }
  }

  private triggerScrollEvent() {
    this.scrolledProgramatically = true;
    this.el.nativeElement.scrollTop = 0;
  }
}

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

import { CdkDropList } from '@angular/cdk/drag-drop';
import {
  AfterViewInit, ChangeDetectorRef, contentChildren, DestroyRef, Directive, ElementRef,
  forwardRef, inject, input, OnDestroy, OnInit, output, OutputRefSubscription, Renderer2
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, fromEvent, Subject } from 'rxjs';
import { Column } from '../model/column';

/** CSS class for the cursor of the resizable columns */
const CURSOR_CSS_PRETTY_NAME = 'arlas-resizable-cursor';
/** CSS class to make the cursor visible */
const CURSOR_RESIZE_CSS_PRETTY_NAME = 'arlas-resizable-cursor--visible';
/** CSS class for a resizable table */
const TABLE_CSS_PRETTY_NAME = 'arlas-resizable-table';
/** CSS class for a table being resized */
const TABLE_RESIZING_CSS_PRETTY_NAME = 'arlas-resizable-table--resizing';
/** CSS class for a header cell */
const TABLE_HEADER_CSS_PRETTY_NAME = 'arlas-resizable-header-cell';
/** CSS class for the anchor */
const TABLE_ANCHOR_CSS_PRETTY_NAME = 'arlas-resizable-anchor';

/**
 * Directive to declare a table with resizable columns
 */
@Directive({
  selector: '[arlasResizableTable]'
})
export class ResizableTableDirective implements AfterViewInit, OnDestroy, OnInit {
  /**
   * Whether the columns of the table can be resized
   */
  public arlasResizableTable = input(true);

  /**
   * Source of truth that helps to keep the column ordered
   */
  public columns = input.required<Column[]>();

  /**
   * Column that needs to be resized and has the directive ResizableDirective
   */
  protected currentResizableDirective?: ResizableColumnDirective;

  /**
   * Mouse X position when the drag starts
   */
  private currentStartX = -1;

  /**
   * Cursor indicator
   */
  private cursor?: HTMLElement;

  /** Child directive reference */
  private readonly childDirectiveRef = contentChildren(forwardRef(() => ResizableColumnDirective), {descendants: true});

  /**
   * Store child event ref to be unsubscribed on destroy
   */
  private readonly eventRef: OutputRefSubscription[] = [];

  /** Event triggered when the column is resized */
  public columnResized = output<ResizableColumnMoveEvent>();

  /** Subject through which each child can declare themselves */
  public readonly childrenOnInit$ = new Subject<ResizableColumnDirective>();

  /** Destroy reference */
  private readonly destroyRef = inject(DestroyRef);
  /** HTML reference of the mat-table hosting the directive */
  private readonly tableElementRef = inject(ElementRef);
  /** Angular utility to manipulate DOM */
  private readonly renderer = inject(Renderer2);
  /** Cdk drop list reference */
  private readonly cdkDropList = inject(CdkDropList, {optional: true});
  private readonly cdr = inject(ChangeDetectorRef);

  public constructor() {
    this.listenToInitialisedChildren();
  }

  /**
   * Updates stored widths and table width when the window is resized
   */
  public ngOnInit() {
    fromEvent(globalThis, 'resize')
      .pipe(debounceTime(100), takeUntilDestroyed(this.destroyRef))
      .subscribe((event: Event) => {
        for (const d of this.childDirectiveRef()) {
          const width = this.getElementWidth(d.getNativeEl());
          this.storeWidth(width, d.arlasResizableColumn());
        }
      });
  }

  public ngAfterViewInit() {
    if (this.arlasResizableTable()) {
      this.createCursor();
    }
  }

  public ngOnDestroy() {
    this.clearChildSubscription();
  }

  /** Gets the table's native element */
  private getNativeEl() {
    return this.tableElementRef.nativeElement as HTMLElement;
  }

  /**
   * Create the HTML for the cursor
   */
  private createCursor() {
    this.cursor = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(this.cursor, CURSOR_CSS_PRETTY_NAME);
    this.renderer.appendChild(this.getNativeEl(), this.cursor);
    this.renderer.addClass(this.getNativeEl(), TABLE_CSS_PRETTY_NAME);
  }

  private clearChildSubscription() {
    for (const ref of this.eventRef) {
      ref.unsubscribe();
    }
  }

  /**
   * Listen for child update to be sure to update the width before content is created.
   */
  private listenToInitialisedChildren() {
    let index = 0;
    this.childrenOnInit$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((child) => {
        this.bindColumnResizeEvents(child);

        // If the column after cannot be resized, then this one can only be resized using the handle before it
        if (!child.allowResize() && index > 0) {
          const previousColumn = this.childDirectiveRef()[index - 1] as ResizableColumnDirective;
          if (previousColumn?.allowResize()) {
            previousColumn.removeAnchor();
          }
        }
        index++;
    });
  }

  /**
   * Bind all necessary event to track column resize
   * @param childDirective
   * @private
   */
  private bindColumnResizeEvents(childDirective: ResizableColumnDirective) {
    this.eventRef.push(
      childDirective.resizing.subscribe(event => this.moveCursor(event.event)),
      childDirective.resizeStarted.subscribe(event => this.onResizeStarted(event, childDirective)),
      childDirective.resizeEnded.subscribe((e) => this.onResizeEnded(e))
    );
  }

  /**
   * Store width for each column
   * @param width Width of the column (in pixels)
   * @param id Column name
   */
  private storeWidth(width: number, id: string): void {
    const column = this.columns().find(c => c.columnName === id);
    if (column) {
      column.width = width;
    }
  }

  /**
   * Calculate child Directive width
   * @param htmlElement
   */
  private getElementWidth(htmlElement: Element): number {
   return (htmlElement as HTMLElement).offsetWidth;
  }

  /**
   * Updates column width and resets main attributes
   * @param {ResizableColumnMoveEvent} event
   */
  private onResizeEnded(event: ResizableColumnMoveEvent) {
    this.resizeColumn(event);
    if(this.cdkDropList){
      this.cdkDropList.disabled = false;
    }
    this.columnResized.emit(event);

    this.hideCursor();
    this.currentStartX = -1;
    this.currentResizableDirective = undefined;
    this.renderer.removeClass(this.getNativeEl(), TABLE_RESIZING_CSS_PRETTY_NAME);
    this.cdr.detectChanges();
  }

  /**
   * Updates the column width and displays the cursor
   * @param event
   * @param childDirective
   */
  private onResizeStarted(event: ResizableColumnMoveEvent, childDirective: ResizableColumnDirective) {
    this.currentResizableDirective = childDirective;

    if (this.cdkDropList){
      this.cdkDropList.disabled = true;
    }

    this.currentStartX = event.event.pageX;
    this.showCursor();
    this.renderer.addClass(this.getNativeEl(), TABLE_RESIZING_CSS_PRETTY_NAME);
  }

  /**
   * Called when user move cursor
   * @param e
   */
  private moveCursor(e: MouseEvent): void {
    this.updateCursorPosition(e);
  }

  /**
   * Updates cursor position
   * @param e
   */
  private updateCursorPosition(e: MouseEvent){
    if (this.cursor && this.currentResizableDirective?.anchor) {
      const tableElement = this.getNativeEl();
      const newWidth = this.getCurrentWidth(e, this.currentResizableDirective.getNativeEl());
      if (newWidth) {
        const translate = `translate(${(e.pageX - tableElement.getBoundingClientRect().x)}px)`;
        this.renderer.setStyle(this.cursor, 'transform', translate);
      }
    }
  }

  /**
   * Show cursor when user click
   */
  private showCursor(): void {
    if (this.cursor && this.currentResizableDirective?.anchor) {
      const anchorPosition = this.currentResizableDirective?.anchor.getBoundingClientRect();
      const el = this.tableElementRef.nativeElement as Element;
      const pxLeftBetweenAnchorAndCursorSIze = 3;
      const translate = `translate(${((anchorPosition?.x - el.getBoundingClientRect().x) + pxLeftBetweenAnchorAndCursorSIze)}px)`;
      this.renderer.setStyle(this.cursor, 'transform', translate);
      this.renderer.addClass(this.cursor, CURSOR_RESIZE_CSS_PRETTY_NAME);
    }
  }

  /**
   * Hide cursor
   */
  private hideCursor(): void {
    if (this.cursor && this.currentResizableDirective?.anchor) {
      this.renderer.setStyle(this.cursor, 'transform', 'translate(0px)');
      this.renderer.removeClass(this.cursor, CURSOR_RESIZE_CSS_PRETTY_NAME);
    }
  }

  /**
   * Get current width of the column while dragging the anchor to change its width
   * @param event Mouse position after dragging started
   * @param el Element to measure
   */
  private getCurrentWidth(event: MouseEvent, el: Element): number {
    const deltaX = (event.pageX - this.currentStartX);
    return this.getElementWidth(el) + deltaX;
  }

  /**
   * Resize current column and right column
   * @param resizeEvent
   */
  private resizeColumn(resizeEvent: ResizableColumnMoveEvent): void {
    if (this.currentResizableDirective) {
      const event = resizeEvent.event;
      const newWidth = this.getCurrentWidth(event, this.currentResizableDirective.getNativeEl());

      const resizedColumnIdx = this.columns().findIndex(c => c.columnName === this.currentResizableDirective?.arlasResizableColumn());
      // If the next column is resizeable
      const nextColumn = this.columns()[resizedColumnIdx + 1];
      if (resizedColumnIdx >= 0 && nextColumn.isResizable) {
        const dx = newWidth - this.columns()[resizedColumnIdx].width;

        if (newWidth) {
          this.storeWidth(newWidth, this.currentResizableDirective.arlasResizableColumn());
          // Resize next column by -dx
          this.storeWidth(nextColumn.width - dx, nextColumn.columnName);
        }
      }
    }
  }
}


/**
 * Structure of the event for a column to be resized
 */
export interface ResizableColumnMoveEvent {
  /** DOM element subjected to the resize */
  el: Element;
  /** Type of MouseEvent leading to the resize */
  event: MouseEvent;
  /** Name of the column */
  columnName: string;
}


/**
 * Directive to declare the column to resize
 */
@Directive({
  selector: '[arlasResizableColumn]'
})
export class ResizableColumnDirective implements OnInit, AfterViewInit, OnDestroy {
  /**
   * Column id
   */
  public arlasResizableColumn = input.required<string>();

  /**
   * Whether to allow the resize of the column.
   * Added so that not-resizeable columns are taken into account when updating the table width
   */
  public allowResize = input(true);
  /**
   * Header cell element reference
   */
  private readonly headerCellEl = inject(ElementRef);
  /**
   * Emit when resize starts
   */
  public resizeStarted = output<ResizableColumnMoveEvent>();
  /**
   * Emit when resize ends
   */
  public resizeEnded = output<ResizableColumnMoveEvent>();
  /**
   * Emit when we are resizing a column
   */
  public resizing = output<ResizableColumnMoveEvent>();
  /**
   * Anchor placed next to column title
   */
  public anchor: Element | undefined;
  /**
   * Resizable column directive. Mandatory to work.
   */
  private readonly parent = inject(ResizableTableDirective);
  /**
   * Angular utility to manipulate dom
   */
  private readonly renderer = inject(Renderer2);
  /**
   * Whether we are resizing
   */
  private isResizing = false;
  /**
   * Hold mouse move event reference to be cleared when component is destroyed
   */
  private mouseMoveRef?: () => void;
  /**
   * Hold mouse up event reference to be cleared when component is destroyed
   */
  private mouseUpRef?: () => void;
  /**
   * Hold mouse down event reference to be cleared when component is destroyed
   */
  private mouseDownRef?: () => void;

  public ngOnInit() {
    this.parent.childrenOnInit$.next(this);

    if (this.allowResize()) {
      this.renderer.addClass(this.headerCellEl.nativeElement, TABLE_HEADER_CSS_PRETTY_NAME);
    }
  }

  /**
   * Get native element
   * @returns {Element}
   */
  public getNativeEl(): Element {
    return this.headerCellEl.nativeElement as Element;
  }

  public ngOnDestroy() {
    this.mouseDownRef?.();
  }

  public ngAfterViewInit() {
    if (this.parent && this.allowResize()) {
      this.addAnchor();
      this.mouseDown();
    }
  }

  /**
   * Initialise mousemove behavior
   */
  private mouseMove() {
    this.mouseMoveRef = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      e.stopPropagation();
      if (this.isResizing && this.allowResize()) {
        this.resizing.emit({el: this.headerCellEl.nativeElement, event: e, columnName: this.arlasResizableColumn()});
      }
    });
  }

  /**
   * Initialise mouseup behavior
   */
  private mouseUp() {
    this.mouseUpRef = this.renderer.listen('document', 'mouseup', (e) => {
      e.stopPropagation();
      if (this.isResizing && this.allowResize()) {
        this.resizeEnded.emit({el: this.headerCellEl.nativeElement, event: e, columnName: this.arlasResizableColumn()});
        this.isResizing = false;
        this.mouseUpRef?.();
        this.mouseMoveRef?.();
      }
    });
  }

  /**
   * Initialise mousedown behavior
   */
  private mouseDown() {
    this.mouseDownRef = this.renderer.listen(this.anchor, 'mousedown', (e) => {
      e.stopPropagation();
      if (!this.isResizing && this.allowResize()) {
        this.isResizing = true;
        this.resizeStarted.emit({el: this.getNativeEl(), event: e, columnName: this.arlasResizableColumn()});
        this.mouseMove();
        this.mouseUp();
      }
    });
  }

  /**
   * Create an anchor to show where the user can start to resize column
   */
  private addAnchor() {
    const el = this.getNativeEl();
    this.anchor = this.renderer.createElement('span');
    this.renderer.addClass(this.anchor, TABLE_ANCHOR_CSS_PRETTY_NAME);
    this.renderer.appendChild(el, this.anchor);
  }

  /**
   * Remove the anchor if the column can't be resized
   */
  public removeAnchor() {
    this.renderer.removeClass(this.anchor, TABLE_ANCHOR_CSS_PRETTY_NAME);
  }
}

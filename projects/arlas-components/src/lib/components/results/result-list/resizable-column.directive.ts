import { CdkDropList } from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  contentChildren,
  DestroyRef,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  OutputRefSubscription,
  Renderer2,
  RendererStyleFlags2,
  viewChildren
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTable } from '@angular/material/table';
import { debounceTime, Subject, tap } from 'rxjs';

/** CSS class for the cursor of the resizable columns */
const CURSOR_CSS_PRETTY_NAME = 'hry-resizable-cursor';
/** CSS class for the anchor indicator */
const CURSOR_ANCHOR_INDICATOR_PRETTY_NAME = 'hry-resizable-anchor-indicator';
/** CSS class to make the cursor visible */
const CURSOR_RESIZE_CSS_PRETTY_NAME = 'hry-resizable-cursor--visible';
/** CSS class for a resizable table */
const TABLE_CSS_PRETTY_NAME = 'hry-resizable-table';
/** CSS class for a table being resized */
const TABLE_RESIZING_CSS_PRETTY_NAME = 'hry-resizable-table--resizing';
/** CSS class for a header cell */
const TABLE_HEADER_CSS_PRETTY_NAME = 'hry-resizable-header-cell';
/** CSS class for the anchor */
const TABLE_ANCHOR_CSS_PRETTY_NAME = 'hry-resizable-anchor';

/**
 * Directive to declare a table with resizable columns
 */
@Directive({
  standalone: true,
  selector: '[libHarryResizableColumn]'
})
export class ResizableColumnDirective implements AfterViewInit, OnDestroy {

  /**
   * To scope selector
   */
  public tableId = input<string>('');

  /**
   * Whether the column can be resized
   */
  public libHarryResizableColumn = input(true);

  /**
   * Sets the minimum size of a column in pixels
   */
  public defaultMinWidth = input(10);

  /**
   * Sets the minimum size of a column in pixels
   */
  public keepTableSize = input(true);


  /**
   * Source of truth that helps to keep the column ordered
   */
  public columnOrder = input.required<string[]>();

  /**
   * Column that needs to be resized and has the directive ResizableDirective
   */
  protected currentResizableDirective: ResizableDirective | undefined;

  /**
   * Mouse X position when the drag starts
   */
  private _currentStartX = -1;

  /**
   * Cursor indicator
   */
  private _cursor: HTMLElement | undefined;

  /** Destroy reference */
  private readonly _destroyRef = inject(DestroyRef);

  /** Child directive reference */
  private readonly _childDirectiveRef = contentChildren<ResizableDirective>(
    forwardRef(() => ResizableDirective), {descendants: true});

  /** Child directive reference */
  private readonly _columnsDirectivesRef = viewChildren(forwardRef(() => ResizableDirective));

  private _sortedColumns: ResizableDirective[] = [];

  /**
   * HTML reference of the host that hosts the directive. In this case the mat-table
   */
  private readonly _tableElementRef = inject(ElementRef);

  /**
   * Angular utility to manipulate DOM
   */
  private readonly _renderer = inject(Renderer2);

  /**
   * Angular utility to virtualize row
   */
  // private readonly _cdkVirtualScroll = inject(CdkVirtualScrollViewport);

  /**
   * Cdk drop list reference
   */
  private readonly _cdkDropList = inject(CdkDropList, {optional: true});

  /**
   * Mat table reference
   */
  private readonly _matTable = inject(MatTable, {optional: true});

  /**
   * Store columns width
   */
  private _columnsWidth: Record<string, number> = {};

  /**
   * Store child event ref to be unsubscribed on destroy
   */
  private _eventRef: OutputRefSubscription[] = [];

  /** Event triggered when the column is resized */
  public columnResized =  output<ResizableColumnMoveEvent>();
  public childrenOnInit$ = new Subject<ResizableDirective>();

  /** Gets the table's native element */
  private getNativeEl() {
    return this._tableElementRef.nativeElement as HTMLElement;
  }

  public constructor() {
    this._refreshReference(true);
  }

  /**
   * Create the HTML for the cursor
   */
  private _createCursor() {
    this._cursor = this._renderer.createElement('div') as HTMLElement;
    this._renderer.addClass(this._cursor, CURSOR_CSS_PRETTY_NAME);
    this._renderer.appendChild(this.getNativeEl(), this._cursor);
    this._renderer.addClass(this.getNativeEl(), TABLE_CSS_PRETTY_NAME);
  }

  /**
   * Create the HTML for the cursor
   */
  private _createAnchorIndicator() {
    const anchor = this._renderer.createElement('div') as HTMLElement;
    this._renderer.addClass(anchor, CURSOR_ANCHOR_INDICATOR_PRETTY_NAME);

    this._renderer.appendChild(anchor, this._renderer.createElement('div'));
    this._renderer.appendChild(anchor, this._renderer.createElement('div'));

    this._renderer.appendChild(this.getNativeEl(), anchor);
  }

  public ngOnDestroy() {
    this._clearChildSubscription();
  }

  private _clearChildSubscription() {
    this._eventRef.forEach(event => event.unsubscribe());
  }

  public ngAfterViewInit() {
    if (this.libHarryResizableColumn()) {
      this._createCursor();
    }
  }

  /**
   * Apply a new table width
   */
  public refreshTableWidth(){
    const width = this._calcTableWidthFromColumn();
    if (width > 0) {
      // we apply total width from column to be sure to have the good size.
      this._renderer.setStyle(this.getNativeEl(), 'width',` ${width}px`);
    }
  }

  /**
   * Add width from store or from element to the column.
   * @param {ResizableDirective} child
   */
  public applyWidthToColumn(child: ResizableDirective){
    let width;
    const columnId = child.libHarryResizable();
    // store the width. Will be useful when user drag and drop to restore previous width
    if (this._columnsWidth[columnId]) {
      width = this._columnsWidth[columnId];
    } else {
      // get width without padding, border ect
      width = this.getElementWidth(child.getNativeEl());
      this.storeWidth(width, columnId);
    }

    const value = (width === null || width === 0 || width === undefined || isNaN(width)) ? `${this.defaultMinWidth()}px` : `${width}px`;
    this._renderer.setStyle(child.getNativeEl(), 'width',value, RendererStyleFlags2.Important);
    this._renderer.setStyle(child.getNativeEl(), 'min-width',value,  RendererStyleFlags2.Important);
  }

  /**
   * Listen for child update to be sure to update the width before content is created.
   */
  private _refreshReference(updateWidth = false){
    this.childrenOnInit$.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((child) => {
        if (updateWidth) {
          this.applyWidthToColumn(child);
          this.refreshTableWidth();
        }
        this.bindColumnResizeEvents(child);
    });
  }

  /**
   * Bind all necessary event to track column resize
   * @param {ResizableDirective} childDirective
   * @private
   */
  private bindColumnResizeEvents(childDirective: ResizableDirective) {
    this._eventRef.push(childDirective.resizing.subscribe(event => this._moveCursor(event.event)));
    this._eventRef.push(childDirective.resizeStarted.subscribe(event => this._onResizeStarted(event, childDirective)));
    this._eventRef.push(childDirective.resizeEnded.subscribe((e) => this._onResizeEnded(e)));
  }

  /**
   * Store width for each column
   * @param {number} width
   * @param {string} id
   */
  protected storeWidth(width: number, id: string): void {
    this._columnsWidth[id] = width;
  }

  /**
   * Calculate child Directive width
   * @param {ResizableDirective} htmlElement
   * @returns {number}
   */
  protected getElementWidth(htmlElement: Element, includePading = false): number {
    let widthToRemove;
    if(!includePading){
      const elementComputedStyle = getComputedStyle(htmlElement, null);
      if(elementComputedStyle){
        const totalPadding = parseFloat(elementComputedStyle.paddingLeft) + parseFloat(elementComputedStyle.paddingRight);
        const totalBorder= parseFloat(elementComputedStyle.borderLeftWidth) + parseFloat(elementComputedStyle.borderRightWidth);

        widthToRemove = (totalBorder ?? 0) + (totalPadding ?? 0);
      }
    }

    let w = (htmlElement as HTMLElement).offsetWidth;
    if (widthToRemove !== undefined && !isNaN(widthToRemove)) {
      w = (htmlElement as HTMLElement).offsetWidth - widthToRemove;
    }

   return w;
  }

  /**
   * Updates column width and resets main attributes
   * @param {ResizableColumnMoveEvent} event
   */
  private _onResizeEnded(event: ResizableColumnMoveEvent) {
    this._resizeColumn(event);
    if(this._cdkDropList){
      this._cdkDropList.disabled = false;
    }
    this.columnResized.emit(event);

    this.hideCursor();
    this._currentStartX = -1;
    this.currentResizableDirective = undefined;
    this._renderer.removeClass(this.getNativeEl(), TABLE_RESIZING_CSS_PRETTY_NAME);
  }

  /**
   * Updates the column width and displays the cursor
   * @param {ResizableColumnMoveEvent} event
   * @param {number} index
   */
  private _onResizeStarted(event: ResizableColumnMoveEvent, childDirective: ResizableDirective) {
    this.currentResizableDirective = childDirective;

    if(this._cdkDropList){
      this._cdkDropList.disabled = true;
    }

    this._currentStartX = event.event.pageX;
    this.showCursor();
    this._renderer.addClass(this.getNativeEl(), TABLE_RESIZING_CSS_PRETTY_NAME);
  }

  /**
   * Called when user move cursor
   * @param {MouseEvent} e
   */
  private _moveCursor(e: MouseEvent): void {
    this.updateCursorPosition(e);
  }

  /**
   * Updates cursor position
   * @param {MouseEvent} e
   */
  protected updateCursorPosition(e: MouseEvent){
    if (this._cursor && this.currentResizableDirective?.anchor) {
      const tableElement = this.getNativeEl();
      const newWidth = this._getCurrentWidth(e, this.currentResizableDirective.getNativeEl());
      if (newWidth && this.defaultMinWidth() < newWidth) {
        const translate = `translate(${(e.pageX - tableElement.getBoundingClientRect().x)}px)`;
        this._renderer.setStyle(this._cursor, 'transform', translate);
      }
    }
  }

  /**
   * Show cursor when user click
   */
  protected showCursor(): void {
    if (this._cursor && this.currentResizableDirective?.anchor) {
      const anchorPosition = this.currentResizableDirective?.anchor.getBoundingClientRect();
      const el = this._tableElementRef.nativeElement as Element;
      const pxLeftBetweenAnchorAndCursorSIze = 3;
      const translate = `translate(${((anchorPosition?.x - el.getBoundingClientRect().x) + pxLeftBetweenAnchorAndCursorSIze)}px)`;
      this._renderer.setStyle(this._cursor, 'transform', translate);
      this._renderer.addClass(this._cursor, CURSOR_RESIZE_CSS_PRETTY_NAME);
    }
  }

  /**
   * Hide cursor
   */
  protected hideCursor(): void {
    if (this._cursor && this.currentResizableDirective?.anchor) {
      this._renderer.setStyle(this._cursor, 'transform', 'translate(0px)');
      this._renderer.removeClass(this._cursor, CURSOR_RESIZE_CSS_PRETTY_NAME);
    }
  }

  /**
   * Get current width from a start position
   * @param {MouseEvent} event
   * @param {Element} el
   * @returns {number | null}
   */
  private _getCurrentWidth(event: MouseEvent, el: Element): number | null {
    const deltaX = (event.pageX - this._currentStartX);
    if (!el) {
      return null;
    }
    return  this.getElementWidth(el) + deltaX;
  }

  /**
   * Calculate table width from column width
   * @returns {number}
   * @private
   */
  private _calcTableWidthFromColumn(){
    let tot = 0;
    this._childDirectiveRef().forEach( (c, i) => {
      tot+= this._columnsWidth[c.libHarryResizable()];
    });
    return tot;
  }

  /**
   * Resize current column and right column
   * @param {ResizableColumnMoveEvent} resizeEvent
   */
  private _resizeColumn(resizeEvent: ResizableColumnMoveEvent): void {
    if (this.currentResizableDirective) {
      const event = resizeEvent.event;
      const newWidth = this._getCurrentWidth(event, this.currentResizableDirective.getNativeEl());

      if (newWidth &&  this.defaultMinWidth() < newWidth) {
        this._renderer.setStyle(this.currentResizableDirective.getNativeEl(), 'width',` ${newWidth}px`,  RendererStyleFlags2.Important);
        this._renderer.setStyle(this.currentResizableDirective.getNativeEl(), 'min-width',` ${newWidth}px`, RendererStyleFlags2.Important);
        this.storeWidth(newWidth, this.currentResizableDirective.libHarryResizable());


        if(this.keepTableSize()){
          let neightbours = this._childDirectiveRef()
            .findIndex(c => c.libHarryResizable() === this.currentResizableDirective.libHarryResizable());
          neightbours = neightbours - 1 >= 0 ? neightbours  - 1 : neightbours  + 1;
            const nChild = this._childDirectiveRef()[neightbours];

            const deltaX = event.pageX - this._currentStartX;
            // we reverse the operation to reduce the left column when we increase the current column and vis versa.
            const newNextWidth = this._getCurrentWidth(event, nChild.getNativeEl()) - deltaX;
          this._renderer.setStyle(nChild.getNativeEl(), 'width',` ${newNextWidth}px`,  RendererStyleFlags2.Important);
          this._renderer.setStyle(nChild.getNativeEl(), 'min-width',` ${newNextWidth}px`, RendererStyleFlags2.Important);
          this.storeWidth(newWidth, nChild.libHarryResizable());
        } else {
          const totalColumnWidth = this._calcTableWidthFromColumn();
          if(totalColumnWidth > 0){
            // we affect total width to table to be sur to have the good value
            this._renderer.setStyle(this.getNativeEl(), 'width',` ${totalColumnWidth}px`);
            this._renderer.setStyle(this.getNativeEl(), 'min-width',` ${totalColumnWidth}px`);
          }
        }
       }
    }
  }

  /**
   * Set a column width
   * @param {number} width
   * @param {Element} element
   */
  protected setElementWidth(width: number, element: Element) {
    //TODO wi have to bring more robustness here.
    this._renderer.setStyle(element, 'width', `${width}px`);
  }


  /**
   * Set a column min width
   * @param {number} width
   * @param {Element} element
   */
  protected setElementMinWidth(width: number, element: Element) {
    //TODO wi have to bring more robustness here.
    this._renderer.setStyle(element, 'min-width', `${width}px`);
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
  standalone: true,
  selector: '[libHarryResizable]'
})
export class ResizableDirective implements OnInit, AfterViewInit, OnDestroy {
  /**
   * Column id
   */
  public libHarryResizable = input('');
  /**
   * Header cell element reference
   */
  private readonly _headerCellEl = inject(ElementRef);
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
  private readonly _parent = inject(ResizableColumnDirective);
  /**
   * Angular utility to manipulate dom
   */
  private readonly _renderer = inject(Renderer2);
  /**
   * Whether we are resizing
   */
  private _isResizing = false;
  /**
   * Hold mouse move event reference to be cleared when component is destroyed
   */
  private _mouseMoveRef!: () => void;
  /**
   * Hold mouse up event reference to be cleared when component is destroyed
   */
  private _mouseUpRef!: () => void;
  /**
   * Hold mouse down event reference to be cleared when component is destroyed
   */
  private _mouseDownRef!: () => void;

  public ngOnInit() {
    this._parent?.childrenOnInit$.next(this);
    this._renderer.addClass(this._headerCellEl.nativeElement, TABLE_HEADER_CSS_PRETTY_NAME);
  }

  /**
   * Get native element
   * @returns {Element}
   */
  public getNativeEl(): Element {
    return this._headerCellEl.nativeElement as Element;
  }

  public ngOnDestroy() {
    this._mouseDownRef();
  }

  public ngAfterViewInit() {
    if (this._parent) {
      this._addAnchor();
      this._mouseDown();
    }
  }

  /**
   * Initialise mousemove behavior
   */
  private _mouseMove() {
    this._mouseMoveRef = this._renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      e.stopPropagation();
      if (this._isResizing) {
        this.resizing.emit({el: this._headerCellEl.nativeElement, event: e, columnName: this.libHarryResizable()});
      }
    });
  }

  /**
   * Initialise mouseup behavior
   */
  private _mouseUp() {
    this._mouseUpRef = this._renderer.listen('document', 'mouseup', (e) => {
      e.stopPropagation();
      if (this._isResizing) {
        this.resizeEnded.emit({el: this._headerCellEl.nativeElement, event: e, columnName: this.libHarryResizable()});
        this._isResizing = false;
        this._mouseUpRef();
        this._mouseMoveRef();
      }
    });
  }

  /**
   * Initialise mousedown behavior
   */
  private _mouseDown() {
    this._mouseDownRef = this._renderer.listen(this.anchor, 'mousedown', (e) => {
      e.stopPropagation();
      if (!this._isResizing) {
        this._isResizing = true;
        this.resizeStarted.emit({el: this.getNativeEl(), event: e, columnName: this.libHarryResizable()});
        this._mouseMove();
        this._mouseUp();
      }
    });
  }

  /**
   * Create an anchor to show where user can start to resize column
   */
  private _addAnchor() {
    const el = this.getNativeEl();
    this.anchor = this._renderer.createElement('span');
    this._renderer.addClass(this.anchor, TABLE_ANCHOR_CSS_PRETTY_NAME);
    this._renderer.appendChild(el, this.anchor);
  }
}

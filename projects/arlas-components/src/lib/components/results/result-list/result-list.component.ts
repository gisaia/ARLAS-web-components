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

import { AfterViewInit, ChangeDetectorRef, Component, DoCheck, ElementRef, HostListener, Input,
  IterableDiffers, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { OnChanges, OnInit, Output } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatSelectChange } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import { ngxLoadingAnimationTypes } from 'ngx-loading';
import { fromEvent, Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ArlasColorService } from '../../../services/color.generator.service';
import { Column } from '../model/column';
import { Item } from '../model/item';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { CellBackgroundStyleEnum } from '../utils/enumerations/cellBackgroundStyleEnum';
import { ModeEnum } from '../utils/enumerations/modeEnum';
import { PageEnum } from '../utils/enumerations/pageEnum';
import { SortEnum } from '../utils/enumerations/sortEnum';
import { ThumbnailFitEnum } from '../utils/enumerations/thumbnailFitEnum';
import { Action, ElementIdentifier, FieldsConfiguration, PageQuery, ResultListOptions } from '../utils/results.utils';

/**
 * ResultList component allows to structure data in a filterable and sortable table.
 * Items can be represented as rows or grids and are multi-selectable.
 * For both list and grid modes, each item has detailed data that can be displayed in a togglable space.
 */
@Component({
  selector: 'arlas-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ResultListComponent implements OnInit, DoCheck, OnChanges, AfterViewInit {

  /**
   * @constant
   */
  public GEO_DISTANCE = 'geodistance';

  /**
   * @constant
   */
  public SORT_DESCENDING = 'click for descending sort';
  /**
   * @constant
   */
  public SORT_ASCENDING = 'click for ascending sort';
  /**
   * @constant
   */
  public FILTER_ON = 'Filter on';
  /**
   * @constant
   */
  public CHECK_INBETWEEN = 'Check in between';
  /**
   * @constant
   */
  public CHECK_ALL = 'Check all visible items';
  /**
   * @constant
   */
  public GLOBAL_ACTIONS = 'Global actions';
  /**
   * @constant
   */
  public GEOSORT_ACTION = 'Geo sort action';
  /**
   * @constant
   */
  public GRID_MODE = 'Grid mode';
  /**
   * @constant
   */
  public LIST_MODE = 'List mode';


  public CONTAIN_FIT = 'Fit the whole thumbnail to the tile';
  public WIDTH_FIT = 'Fit the thumbnail\'s width to the tile';
  public HEIGHT_FIT = 'Fit the thumbnail\'s height to the tile';

  /**
   * @constant
   */
  public GEOSORT_BUTTON = 'Geo-sort';
  public COLUMN_ACTIONS_HEIGHT = 52;
  public COLUMN_NAME_HEIGHT = 27;
  public FILTERS_HEIGHT = 50;
  public TAIL_HEIGHT = 30;


  public loadAnimationConfig = {
    animationType: ngxLoadingAnimationTypes.threeBounce, backdropBackgroundColour: 'rgba(100,100,100,0.5)',
    backdropBorderRadius: '0', primaryColour: '#ffffff', secondaryColour: '#ffffff', tertiaryColour: '#ffffff'
  };

  public scrollOptions = { maintainScrollUpPosition: true, maintainScrollDownPosition: true, nbLines: 0 };

  /**
   * @Input : Angular
   * @description An input to customize the resultlist
   */
  @Input() public options: ResultListOptions;

  @Input() public fetchState = { endListUp: true, endListDown: false };
  /**
   * @Input : Angular
   * @description List of the fields displayed in the table (including the id field)
   * - fieldName : Name/path of the field to add to list
   * - columnName : Name of the field that will be displayed on the list column
   * - dataType : Unit of the field values if it exists (degree, percentage, etc)
   * - useColorService : Whether to colorize values on cells of the list with a color generated from the field value
   * NOTE : This list should include the ID field. It will be the id of each item
   */
  @Input() public fieldsList: Array<{
    fieldName: string;
    columnName: string;
    dataType: string;
    useColorService?: boolean;
  }>;

  /**
   * @Input : Angular
   * @description List of fieldName-fieldValue map. Each map corresponds to a row/grid.
   * @note In order to apply `selectInBetween` method properly, this list must be ascendingly sorted on the item identifier.
   */
  @Input() public rowItemList: Array<Map<string, string | number | Date>>;

  /**
   * @Input : Angular
   * @description A configuration object that sets id field, title field and urls
   * to images && thumbnails
   */
  @Input() public fieldsConfiguration: FieldsConfiguration;

  /**
   * @Input : Angular
   * @description The table width. If not specified, the tableWidth value is
   * equal to container width.
   */
  @Input() public tableWidth: number = null;

  /**
   * @Input : Angular
   * @description The number of items left on the list/grid when scrolling up or down upon which loading new data is triggered.
   * When scrolling up or down, once there is `nLastLines` items left at the top or bottom of the list, previous/next data is loaded.
   * @deprecated nLastLines is deprecated and used only if `nbLinesBeforeFetch` is not set
  */
  @Input() public nLastLines: number;

  /**
   * @Input : Angular
   * @description The number of items left on the list/grid when scrolling up or down upon which loading new data is triggered.
   * When scrolling up or down, once there is `nbLinesBeforeFetch` items left at the top or bottom of the list, previous/next
   * data is loaded.
  */
  @Input() public nbLinesBeforeFetch = 5;

  /**
   * @Input : Angular
   * @description Height of the detail grid div (Grid Mode).
   */
  @Input() public detailedGridHeight = 300;

  /**
   * @Input : Angular
   * @description Number of grid columns (Grid Mode).
   */
  @Input() public nbGridColumns = 4;

  /**
   * @Input : Angular
   * @description List of actions to apply on the selected items.
   */
  @Input() public globalActionsList = new Array<Action>();

  /**
   * @Input : Angular
   * @description A detailed-data-retriever object that implements
   * DetailedDataRetriever interface.
   */
  @Input() public detailedDataRetriever: DetailedDataRetriever = null;

  /**
   * @Input : Angular
   * @description List of items ids that are in a indeterminated status.
   */
  @Input() public indeterminatedItems: Set<string> = new Set<string>();

  /**
 * @Input : Angular
 * @description List of items ids that are in a selected status.
 */
  @Input() public selectedItems: Set<string> = new Set<string>();

  /**
   * @Input : Angular
   * @description List of items ids to be highlighted.
   */
  @Input() public highlightItems: Set<string> = new Set<string>();

  /**
   * @Input : Angular
   * @description Mode of representation : `list` or `grid`.
   */
  @Input() public defautMode: ModeEnum;

  /**
 * @Input : Angular
 * @description Whether the body table is hidden or not.
 */
  @Input() public isBodyHidden: boolean;
  /**
   * @Input : Angular
   * @description Whether filters on list are displayed.
   */
  @Input() public displayFilters = true;

  /**
   * @Input : Angular
   * @description Whether the sort on the geometry is enabled.
   */
  @Input() public isGeoSortEnabled = false;

  /**
   * @Input : Angular
   * @description Whether the sort on the geometry is activated
   */
  @Input() public isGeoSortActivated = false;

  /**
   * @Input : Angular
   * @description The column that is currently sorted on
   */
  @Input() public currentSortedColumn: Column;

  /**
   * @Input : Angular
   * @description A fieldName-fieldValue map of fields to filter.
   */

  @Input() public filtersMap: Map<string, string | number | Date>;

  /**
   * @Input : Angular
   * @description A  map of fieldName- Observable of array value for dropdown filter
   */

  @Input() public dropDownMapValues: Map<string, Observable<Array<string>>>;
  /**
   * @Input : Angular
   * @description A  boolean to show or hide thead of table
   */
  @Input() public displayThead = true;

  /**
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public keysToColors: Array<[string, string]>;

  /**
   * @Input : Angular
   * @description Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a
   * factor (between 0 and 1) that tightens this scale to [(1-colorsSaturationWeight), 1].
   * Therefore saturation of generated colors will be within this tightened scale..
   */
  @Input() public colorsSaturationWeight = 1 / 2;

  /**
   * @Input : Angular
   * @description Whether to allow colorizing cells and the grid tile of the list.
   */
  @Input() public useColorService = false;

  /**
   * @Input : Angular
    * @description The way the cell will be colorized: filled or outlined
   */
  @Input() public cellBackgroundStyle: CellBackgroundStyleEnum = CellBackgroundStyleEnum.filled;
  /**
   * @Input : Angular
   * @description A  item to show detail
   */
  @Input() public selectedGridItem: Item;
  /**
   * @Input
   * @description Whether display group with no detail.
   */
  @Input() public showEmptyGroup = false;
  /**
   * @Input
   * @description Whether display the detailled part in grid mode.
   */
  @Input() public isDetailledGridOpen = false;

  /**
   * @Input
   * @description How to fit the thumbnail to the tile:
   * - `height` fit the height of the thumbnail.
   * - `width` fit the width of the thumbnail.
   * - `contain` fit the wholethumbnail.
   */
  @Input() public thumbnailFit: ThumbnailFitEnum = ThumbnailFitEnum.contain;

  /**
   * @Output : Angular
   * @description Emits the event of sorting data on the specified column.
   */
  @Output() public sortColumnEvent: Subject<{ fieldName: string; sortDirection: SortEnum; }> =
    new Subject<{ fieldName: string; sortDirection: SortEnum; }>();

  /**
   * @Output : Angular
   * @description Emits the event of geo-sorting data.
   */
  @Output() public geoSortEvent: Subject<string> = new Subject<string>();

  /**
   * @Output : Angular
   * @description Emits the event of geo-sorting data.
   */
  @Output() public geoAutoSortEvent: Subject<boolean> = new Subject<boolean>();

  /**
   * @Output : Angular
   * @description Emits the list of items identifiers whose checkboxes are selected.
   */
  @Output() public selectedItemsEvent: Subject<Array<string>> = new Subject<Array<string>>();

  /**
   * @Output : Angular
   * @description Emits one item identifier that is hovered, selected or clicked on it
   * for consultation purposes.
   */
  @Output() public consultedItemEvent: Subject<ElementIdentifier> = new Subject<ElementIdentifier>();

  /**
   * @Output : Angular
   * @description Emits the filtred fields map (fieldName-fieldValue map).
   */
  @Output() public setFiltersEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();

  /**
   * @Output : Angular
   * @description Emits the request of more data to load. The emitted number is the number of times this event has been emitted.
   * @deprecated moreDataEvent can be replaced by `paginationEvent`
   */
  @Output() public moreDataEvent: Subject<number> = new Subject<number>();

  /**
   * @Output : Angular
   * @description Emits the request of a new page to load.
   * The emitted PageQuery contains the reference item from which the new page is loaded
   * and whether it is the previous or the next page.
   */
  @Output() public paginationEvent: Subject<PageQuery> = new Subject<PageQuery>();

  /**
   * @Output : Angular
   * @description Emits the event of applying the specified action on the specified item.
   */
  @Output() public actionOnItemEvent: Subject<{ action: Action; elementidentifier: ElementIdentifier; }> =
    new Subject<{ action: Action; elementidentifier: ElementIdentifier; }>();

  /**
   * @Output : Angular
   * @description Emits the event of applying the specified globalb action on the selected items.
   */
  @Output() public globalActionEvent: Subject<Action> = new Subject<Action>();

  /**
   * @Output : Angular
   * @description Emits the event of applying the specified global action on the selected items.
   */
  @Output() public columnFilterChanged: Subject<Column> = new Subject<Column>();

  /**
   * @Output : Angular
   * @description Emits the event of clicking on a grid tile.
   */
  @Output() public clickOnTile: Subject<Item> = new Subject<Item>();

  /**
   * @Output : Angular
   * @description Emits the event of clicking on the switch mode button. Emits the new mode (grid or list).
   */
  @Output() public changeResultMode: Subject<ModeEnum> = new Subject<ModeEnum>();

  /**
   * @Output : Angular
   * @description Emits the current visible items in the viewport.
   */
  @Output() public visibleItems: Subject<Array<Item>> = new Subject<Array<Item>>();

  /**
  * @Output : Angular
  * @description Emits on changes rowItemList current value.
  */
  @Output() public onChangeItems: Subject<Array<any>> = new Subject<Array<any>>();

  /**
   * @Output : Angular
   * @description Emits when changing how thumbnails fit in their div.
   */
  @Output() public thumbnailFitEvent: Subject<ThumbnailFitEnum> = new Subject();


  public columns: Array<Column>;
  public items: Array<Item> = new Array<Item>();
  public sortedColumn: { fieldName: string; sortDirection: SortEnum; } = { fieldName: '', sortDirection: SortEnum.asc };
  public lastSortedColumn: Column;


  // Heights of table elements
  public tbodyHeight: number = null;
  public theadHeight: number = null;

  public ModeEnum = ModeEnum;
  public ThumbnailFitEnum = ThumbnailFitEnum;
  public PageEnum = PageEnum;
  public SortEnum = SortEnum;

  private iterableRowsDiffer;
  private iterableColumnsDiffer;

  public isNextPageRequested = false;
  public isPreviousPageRequested = false;
  public hasGridMode = false;
  public resultMode: ModeEnum;
  public allItemsChecked = false;

  public borderStyle = 'solid';
  public displayListGrid = 'inline';
  public isShiftDown = false;

  private debouncer = new Subject<ElementIdentifier>();
  private scrollDebouncer = new Subject<any>();
  private emitVisibleItemsDebouncer = new Subject<any>();


  public constructor(iterableRowsDiffer: IterableDiffers, iterableColumnsDiffer: IterableDiffers, private el: ElementRef,
    private colorService: ArlasColorService, public translate: TranslateService,
    private cdr: ChangeDetectorRef) {
    this.iterableRowsDiffer = iterableRowsDiffer.find([]).create(null);
    this.iterableColumnsDiffer = iterableColumnsDiffer.find([]).create(null);
    // Resize the table height on window resize
    fromEvent(window, 'resize')
      .pipe(debounceTime(500))
      .subscribe((event: Event) => {
        this.setTableHeight();
      });
    // Add debounce on hover item list
    this.debouncer.pipe(debounceTime(500)).subscribe(elementidentifier => this.consultedItemEvent.next(elementidentifier));
    this.scrollDebouncer.pipe(debounceTime(1000)).subscribe(page => this.paginationEvent.next(page));
    this.emitVisibleItemsDebouncer.pipe(debounceTime(1000)).subscribe(event => this.visibleItems.next(event));
  }

  @HostListener('document:keydown.shift', ['$event'])
  public shiftDown(_) {
    this.isShiftDown = true;
  }

  @HostListener('document:keyup.shift', ['$event'])
  public shiftUp(event: KeyboardEvent) {
    this.isShiftDown = false;
  }

  public ngOnInit() {
    this.resultMode = (this.defautMode && (this.defautMode.toString() === 'grid' ||
      this.defautMode.toString() === ModeEnum.grid.toString())) ? ModeEnum.grid : ModeEnum.list;
    this.options = Object.assign(new ResultListOptions(), this.options);
    if (!!this.fieldsConfiguration) {
      if (this.fieldsConfiguration.urlThumbnailTemplate !== undefined) {
        this.hasGridMode = true;
      }
    }
  }

  public ngAfterViewInit(): void {
    this.setTableWidth();
    this.setTableHeight();
  }

  public emitThumbnailsFitStatus(fitChange: MatButtonToggleChange): void {
    this.thumbnailFit = ThumbnailFitEnum[fitChange.value as string];
    this.thumbnailFitEvent.next(this.thumbnailFit);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['defautMode'] !== undefined) {
      if (this.defautMode.toString() === 'grid' || this.defautMode.toString() === ModeEnum.grid.toString()) {
        this.resultMode = ModeEnum.grid;
        this.displayListGrid = 'block';
      } else {
        this.resultMode = ModeEnum.list;
        this.displayListGrid = 'inline';
      }
      this.setTableHeight();
    }

    if (changes['rowItemList'] !== undefined) {
      this.items = [];
      this.isPreviousPageRequested = false;
      this.onChangeItems.next(changes['rowItemList'].currentValue);
      this.closeDetail(true);
    }
    if (changes['isDetailledGridOpen'] !== undefined) {
      this.isDetailledGridOpen = changes['isDetailledGridOpen'].currentValue;
    }
    if (changes['indeterminatedItems'] !== undefined) {
      this.items.forEach(item => {
        item.isindeterminated = false;
        this.indeterminatedItems.forEach(id => {
          if (item.identifier === id && !this.selectedItems.has(id)) {
            item.isindeterminated = true;
          }
        });
      });
    }
    if (changes['selectedItems'] !== undefined) {
      this.items.forEach(item => {
        item.isChecked = false;
        this.selectedItems.forEach(id => {
          if (item.identifier === id) {
            item.isChecked = true;
          }
        });
      });
      this.setSelectedItems(this.selectedItems);
    }
    if (changes['highlightItems'] !== undefined) {
      if (this.highlightItems.size > 0) {
        this.items.forEach(item => {
          if (this.highlightItems.has(item.identifier)) {
            item.ishighLight = true;
          } else {
            item.ishighLight = false;
          }
        });
      } else {
        this.items.forEach(item => {
          item.ishighLight = undefined;
        });
      }
    }
    if (changes['fetchState'] !== undefined) {
      if (this.fetchState && this.fetchState.endListUp) {
        this.isPreviousPageRequested = false;
      }
      if (this.fetchState && this.fetchState.endListDown) {
        this.isNextPageRequested = false;
      }
    }
    if (changes['currentSortedColumn'] !== undefined && changes['currentSortedColumn'].currentValue) {
      this.sortedColumn.fieldName = changes['currentSortedColumn'].currentValue.fieldName;
      this.sortedColumn.sortDirection = changes['currentSortedColumn'].currentValue.sortDirection;
      this.lastSortedColumn = changes['currentSortedColumn'].currentValue;
    }
  }

  public ngDoCheck() {
    const columnChanges = this.iterableColumnsDiffer.diff(this.fieldsList);
    const itemChanges = this.iterableRowsDiffer.diff(this.rowItemList);
    if (columnChanges) {
      this.setColumns();
    }
    if (itemChanges) {
      let itemIndex = 0;
      itemChanges.forEachAddedItem(i => {
        this.onAddItems(i.item, this.isPreviousPageRequested, itemIndex);
        itemIndex++;
      });
      itemChanges.forEachRemovedItem(i => {
        if (this.isNextPageRequested) {
          this.items.splice(0, 1);
        } else if (this.isPreviousPageRequested) {
          this.items.splice(this.items.length - 1, 1);
        }
      });
      /**
       * This variable notifies the ResultScrollDirective whether the end of list is reached at top or bottom
       */
      if (this.isPreviousPageRequested) {
        /**
         * This variable is set and given as an input to the `ResultScrollDirective`.
         * The objective of this input is to inform `ResultScrollDirective` that it should
         * maintain the Scroll Position when Adding Content to the top of the list
         */
        this.scrollOptions = { maintainScrollUpPosition: true, maintainScrollDownPosition: false, nbLines: itemIndex };
      }
      if (this.isNextPageRequested) {
        /**
         * This variable is set and given as an input to the `ResultScrollDirective`.
         * The objective of this input is to inform `ResultScrollDirective` that it should
         * maintain the Scroll Position when Adding Content to the bottom of the list
         */
        this.scrollOptions = { maintainScrollUpPosition: false, maintainScrollDownPosition: true, nbLines: itemIndex };
      }
      this.setSelectedItems(this.selectedItems);
      this.isNextPageRequested = false;
      this.isPreviousPageRequested = false;
    }
  }

  public emitVisibleItems(items: Array<Item>) {
    this.emitVisibleItemsDebouncer.next(items);
  }

  /**
   * @description Emits the event of asking for next or previous page of items
   * @param referenceIdentifier : item identifier used as reference to fetch the next/previous page
   * @param whichPage : Whether to fetch the `next` or `previous` page
   */
  public paginate(itemData: Map<string, string | number | Date>, whichPage: PageEnum) {
    this.isNextPageRequested = whichPage === PageEnum.next;
    this.isPreviousPageRequested = whichPage === PageEnum.previous;
    this.scrollDebouncer.next({ reference: itemData, whichPage: whichPage });

  }

  /**
   * @description Emits which action to apply on which item/product
   */
  public triggerActionOnItem(actionOnItem: { action: Action; elementidentifier: ElementIdentifier; }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

  /**
   * @description Sets and emits the action to apply to all selected items
   */
  public setGlobalAction(action: Action) {
    this.globalActionEvent.next(action);
  }

  public setGeoSortAction() {
    if (!this.isGeoSortActivated) {
      this.geoSort();
    }
    this.isGeoSortActivated = !this.isGeoSortActivated;
    this.geoAutoSortEvent.next(this.isGeoSortActivated);
  }

  /**
   * @description Sets and emits the [fieldName, filterValue] map of filtered fields
   */
  // Emits a map of only filtered fields
  public setFilters(filtersMap: Map<string, string | number | Date>): void {
    this.filtersMap = filtersMap;
    this.setFiltersEvent.next(this.filtersMap);
  }

  /**
   * @description Sets and emits the identifiers list of selected items
   */
  public setSelectedItems(selectedItems: Set<string>, stopPropagation?: boolean) {
    // remove all text selection on current document
    // SB : Sometime blinking append, need to be deepened
    document.getSelection().removeAllRanges();

    this.selectedItems = selectedItems;
    if (selectedItems.size < this.items.length) {
      this.allItemsChecked = false;
    } else if (this.items.length !== 0) {
      this.allItemsChecked = this.items.filter(i => i.isChecked).length === this.items.length;
    }
    this.selectedItemsEvent.next(Array.from(this.selectedItems));
    if (this.isShiftDown && this.selectedItems.size > 1 && !stopPropagation) {
      this.selectInBetween();
    }
  }

  /**
   * @description Emits the column to sort on and the sort direction
   */
  public sort(paramSortedColumn: Column): void {
    this.isGeoSortActivated = false;
    paramSortedColumn.sortDirection = this.sortedColumn.sortDirection;
    this.columns.forEach(column => {
      if (column.fieldName !== paramSortedColumn.fieldName) {
        column.sortDirection = SortEnum.none;
      }
    });
    this.sortColumnEvent.next(paramSortedColumn);
    // Reset direction to ASC after a clean
    if (this.sortedColumn.sortDirection === SortEnum.none) {
      this.sortedColumn.sortDirection = SortEnum.asc;
    }
  }

  public setDirection(direction: string) {
    this.sortedColumn.sortDirection = SortEnum[direction];
    if (this.lastSortedColumn) {
      this.sort(this.lastSortedColumn);
    }
  }

  public setSortedColumn(event: MatSelectChange) {
    if (event.value) {
      this.lastSortedColumn = event.value;
      this.sortedColumn.fieldName = event.value.fieldName;
      this.sort(event.value);
    } else {
      this.sortedColumn.sortDirection = SortEnum.none;
      this.sortedColumn.fieldName = '';
      this.sort(this.sortedColumn as any);
    }
  }

  /**
   * @description Emits the request event of geo-sorting
   */
  public geoSort(): void {
    this.columns.forEach(column => {
      if (!column.isIdField) {
        column.sortDirection = SortEnum.none;
      }
    });
    // Reset column filter when geo sort request
    this.sortedColumn.fieldName = '';
    this.currentSortedColumn = null;

    this.geoSortEvent.next(this.GEO_DISTANCE);
  }

  /**
   * @description Sets and emits the hovered item's identifier
   */
  public setConsultedItem(identifier: string) {
    const elementidentifier: ElementIdentifier = {
      idFieldName: this.fieldsConfiguration.idFieldName,
      idValue: identifier
    };
    this.debouncer.next(elementidentifier);
  }

  /**
   * @description called on hovering an item : its sets the items actions + emits the item's identifier
   * @param item hovered item
   */
  public onEnterItem(item: Item): void {
    this.setItemActions(item);
    this.setConsultedItem(item.identifier);
  }

  /**
   * @description called on leaving an item : emits the item's identifier
   * @param item item previously hovered
   */
  public onLeaveItem(item: Item): void {
    this.setConsultedItem('leave-' + item.identifier);
  }

  /**
   * @description Sets the border style of rows
   */
  public setBorderStyle(borderStyle): void {
    this.borderStyle = borderStyle;
  }

  /**
   * @description Sets the selected grid item
   */
  public setSelectedGridItem(item: Item) {
    this.selectedGridItem = item;
    this.isDetailledGridOpen = true;
    this.setTableHeight();
    this.clickOnTile.next(item);
  }

  public closeDetail(isClosed: boolean) {
    if (isClosed) {
      this.isDetailledGridOpen = false;
      this.setTableHeight();
    }
  }

  /**
   * @description Sets the display style according to the mode
   */
  public whichMode(toggleChangeEvent: MatButtonToggleChange) {
    if (toggleChangeEvent.value === ModeEnum.grid.toString()) {
      this.resultMode = ModeEnum.grid;
      this.displayListGrid = 'block';
    } else {
      this.resultMode = ModeEnum.list;
      this.displayListGrid = 'inline';
    }
    this.changeResultMode.next(this.resultMode);
    this.setTableHeight();
  }

  /**
   * @description Selects all the items
   */
  public selectAllItems() {
    this.allItemsChecked = !this.allItemsChecked;
    this.selectedItems = new Set<string>();
    this.items.forEach(item => {
      item.isChecked = this.allItemsChecked;
      item.isindeterminated = false;
      if (this.allItemsChecked) {
        this.selectedItems.add(item.identifier);
      }
    });
    this.setSelectedItems(this.selectedItems);
  }

  /**
   * @description Selects all the items between the farest and nearest selected items
   */
  public selectInBetween() {
    const selectedItemsList = new Array();
    this.items.forEach(i => {
      if (this.selectedItems.has(i.identifier)) {
        selectedItemsList.push(i);
      }
    });
    if (selectedItemsList.length > 0) {
      const firstItem = selectedItemsList[0];
      const lastItem = selectedItemsList[selectedItemsList.length - 1];
      let inBetween = false;
      this.items.forEach(item => {
        if (item === firstItem) {
          inBetween = true;
        }
        if (item === lastItem) {
          inBetween = false;
        }
        if (inBetween) {
          item.isChecked = true;
          item.isindeterminated = false;
          this.selectedItems.add(item.identifier);
        }
      });
      this.setSelectedItems(this.selectedItems, true);
    }
  }

  /**
   * @description Emits the column when a filter is addedd
   */
  public columnChanged(colum: Column) {
    this.columnFilterChanged.next(colum);
  }

  /**
   * @description Clear set of selection
   */
  public clearSelection() {
    this.setSelectedItems(new Set());
    this.items.forEach(item => {
      item.isChecked = false;
      item.isindeterminated = false;
    });
  }

  /**
   * @description set the list of actions of an item
   * @param item
   */
  public setItemActions(item: Item): void {
    if (item && (!item.actions || (item.actions && item.actions.length === 0))) {
      item.actions = new Array<Action>();
      this.detailedDataRetriever.getActions(item).subscribe(actions => {
        actions.forEach(action => {
          item.actions.push({
            id: action.id,
            label: action.label,
            actionBus: action.actionBus,
            cssClass: action.cssClass,
            tooltip: action.tooltip
          });
        });
      });
    }
  }

  public byFieldName(item1: Column, item2: Column) {
    return item1 && item2 ? item1.fieldName === item2.fieldName : item1 === item2;
  }

  // Build the table's columns
  private setColumns() {
    this.columns = new Array<Column>();
    const checkboxColumnWidth = 25;
    const toggleColumnWidth = 35;
    // id column is the first one and has a pre fixed width
    // It is the column where checkboxes are put
    const idColumn = new Column('', this.fieldsConfiguration.idFieldName, '');
    idColumn.isIdField = true;
    idColumn.width = checkboxColumnWidth;
    this.columns.unshift(idColumn);
    this.fieldsList.forEach(field => {
      const column = new Column(field.columnName, field.fieldName, field.dataType);
      column.width = (this.tableWidth - checkboxColumnWidth - toggleColumnWidth) / this.fieldsList.length;
      column.useColorService = field.useColorService ? field.useColorService : false;
      this.columns.push(column);
    });
    // add a column for toggle icon
    const toggleColumn = new Column('', 'toggle', '');
    toggleColumn.isToggleField = true;
    toggleColumn.width = toggleColumnWidth;
    this.columns.push(toggleColumn);
  }

  private onAddItems(itemData: Map<string, string | number | Date>, addOnTop: boolean, index: number) {
    const item = new Item(this.columns, itemData);
    item.identifier = <string>itemData.get(this.fieldsConfiguration.idFieldName);
    item.imageEnabled = true;
    item.thumbnailEnabled = true;
    if (this.fieldsConfiguration.titleFieldNames) {
      item.title = this.fieldsConfiguration.titleFieldNames
        .map(field => <string>itemData.get(field.fieldPath + '_title'))
        .join(' ');
      if (item.title) {
        item.title = item.title.trim();
      }
    }
    if (this.useColorService && this.fieldsConfiguration.iconColorFieldName) {
      const colorFieldValue = <string>itemData.get(this.fieldsConfiguration.iconColorFieldName + '_title');
      if (colorFieldValue) {
        item.color = this.colorService.getColor(colorFieldValue, this.keysToColors, this.colorsSaturationWeight);
      }
    }
    if (this.fieldsConfiguration.tooltipFieldNames) {
      item.tooltip = this.fieldsConfiguration.tooltipFieldNames
        .map(field => <string>itemData.get(field.fieldPath + '_tooltip'))
        .join(' ');
      if (item.tooltip) {
        item.tooltip = item.tooltip.trim();
      }
    }

    if (this.fieldsConfiguration.icon) {
      item.icon = this.fieldsConfiguration.icon;
    }
    if (this.fieldsConfiguration.iconCssClass) {
      item.iconCssClass = <string>itemData.get(this.fieldsConfiguration.iconCssClass);
      if (item.iconCssClass) {
        item.iconCssClass = item.iconCssClass.trim();
      }
    }
    item.imageEnabled = itemData.get('imageEnabled') === 'true';
    item.thumbnailEnabled = itemData.get('thumbnailEnabled') === 'true';

    if (item.imageEnabled && this.fieldsConfiguration.urlImageTemplate) {
      item.urlImage = this.fieldsConfiguration.urlImageTemplate;
      /** match : => ["{field1}", "{field2}"] */
      const matches = this.fieldsConfiguration.urlImageTemplate.match(/{(.+?)}/g);
      if (matches) {
        matches.forEach(t => {
          const key: string = t.replace('{', '').replace('}', '');
          item.urlImage = item.urlImage.replace(t, itemData.get(key).toString());
        });
      }
    }
    if (item.thumbnailEnabled && this.fieldsConfiguration.urlThumbnailTemplate) {
      item.urlThumbnail = this.fieldsConfiguration.urlThumbnailTemplate;
      /** match : => ["{field1}", "{field2}"] */
      const matches = this.fieldsConfiguration.urlThumbnailTemplate.match(/{(.+?)}/g);
      if (matches) {
        matches.forEach(t => {
          const key: string = t.replace('{', '').replace('}', '');
          item.urlThumbnail = item.urlThumbnail.replace(t, itemData.get(key).toString());
        });
      }
    }

    item.position = this.items.length + 1;
    item.ishighLight = undefined;
    // When new data is loaded, check the one that were already checked +
    // remove the no longuer existing data from selectedItems (thanks to actualSelectedItems)
    if (this.allItemsChecked && (this.isNextPageRequested || this.isPreviousPageRequested)) {
      item.isChecked = true;
      this.selectedItems.add(item.identifier);
    } else {
      if (this.selectedItems.has(item.identifier)) {
        item.isChecked = true;
      }
      if (this.indeterminatedItems.has(item.identifier)) {
        item.isindeterminated = true;
      } else {
        item.isindeterminated = false;
      }
    }
    if (addOnTop) {
      this.items.splice(index, 0, item);
    } else {
      this.items.push(item);
    }
  }

  private setTableWidth() {
    if (this.tableWidth === null) {
      const nativeElement = this.el.nativeElement;
      if (nativeElement.childNodes && nativeElement.childNodes.length > 0 && nativeElement.childNodes[0]) {
        this.tableWidth = this.el.nativeElement.childNodes[0].offsetWidth;
      }
    }
  }

  /**
   * @description Sets the table head and body height
   */
  private setTableHeight(nbTrials = 0) {
    const tableElement = this.el.nativeElement.parentElement as HTMLElement;
    if (tableElement.getBoundingClientRect().height !== 0) {
      this.theadHeight = this.COLUMN_ACTIONS_HEIGHT +
        // Only in list mode
        this.COLUMN_NAME_HEIGHT * (this.resultMode === ModeEnum.list ? 1 : 0) +
        // Only if filters are present
        this.FILTERS_HEIGHT * (this.displayFilters ? 1 : 0);
      this.tbodyHeight = tableElement.getBoundingClientRect().height - this.theadHeight -
        // Only if the list is in grid mode
        this.TAIL_HEIGHT * (this.resultMode === ModeEnum.grid ? 1 : 0) -
        // Only if the list is in grid mode and has an element selected
        this.detailedGridHeight * (this.resultMode === ModeEnum.grid ? 1 : 0) * (this.isDetailledGridOpen ? 1 : 0);
      this.cdr.detectChanges();
    } else {
      // If the container has no height then try again for up to 10 times
      // Because of an issue with the DOM not loading properly the parent container, its height can be detected to be 0,
      // even with a preset height. Multiple tiemout values were tested, but they don't have an impact on this behavior.
      if (nbTrials < 10) {
        setTimeout(() => this.setTableHeight(nbTrials + 1), 0);
      } else {
        console.error('Failed to load the result list\'s height in less than 10 trials.' +
          'Try to limit the element visibility to when it is really on screen to avoid this issue.');
      }
    }
  }
}

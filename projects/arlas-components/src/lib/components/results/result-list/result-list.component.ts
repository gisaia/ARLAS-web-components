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

import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit, ChangeDetectorRef, Component, DoCheck, ElementRef, EventEmitter, HostListener, input, Input,
  IterableDiffer, IterableDiffers, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleChange, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect, MatSelectChange, MatSelectTrigger } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, first, fromEvent, interval, Observable, Subject, Subscription } from 'rxjs';
import { ArlasColorService } from '../../../services/color.generator.service';
import { ResultlistNotifierService } from '../../../services/resultlist.notifier.service';
import { CardFieldConfig } from '../config/cardFieldConfig';
import { TableFieldConfig } from '../config/tableFieldConfig';
import { CardField } from '../model/cardField';
import { Column } from '../model/column';
import { Item } from '../model/item';
import { SortableField } from '../model/sortableField';
import { ResultCardItemComponent } from '../result-card-item/result-card-item.component';
import { ResultDetailedGridComponent } from '../result-detailed-grid/result-detailed-grid.component';
import { ItemDetailToggleEvent, ResultDetailedItemComponent } from '../result-detailed-item/result-detailed-item.component';
import { ResultScrollDirective } from '../result-directive/result-scroll.directive';
import { ResultFilterComponent } from '../result-filter/result-filter.component';
import { ResultGridTileComponent } from '../result-grid-tile/result-grid-tile.component';
import { ResultItemComponent } from '../result-item/result-item.component';
import { AvailableProcess, TaskStatus } from '../utils/aias-process';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { CellBackgroundStyleEnum } from '../utils/enumerations/cellBackgroundStyleEnum';
import { PageEnum } from '../utils/enumerations/pageEnum';
import { ResultlistModeEnum } from '../utils/enumerations/resultlistModeEnum';
import { SortEnum } from '../utils/enumerations/sortEnum';
import { ThumbnailFitEnum } from '../utils/enumerations/thumbnailFitEnum';
import { ResizableColumnDirective, ResizableTableDirective } from '../utils/resizable-column.directive';
import {
  Action, ElementIdentifier, FieldsConfiguration, ItemDataType, matchAndReplace, PageQuery, ResultListOptions
} from '../utils/results.utils';
import { stringToResultlistModeEnum } from '../utils/stringToResultlistModeEnum';

/**
 * Structure summarizing the sort on a column
 */
export interface SortedColumn {
  fieldName: string;
  columnName: string;
  sortDirection: SortEnum;
}

/**
 * ResultList component allows to structure data in a filterable and sortable table.
 * Items can be represented as rows or grids and are multi-selectable.
 * For both list and grid modes, each item has detailed data that can be displayed in a togglable space.
 */
@Component({
  selector: 'arlas-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    ResultFilterComponent, MatTooltip, MatCheckbox, MatIcon, MatMenuTrigger, MatMenu, MatMenuItem,
    MatSlideToggle, MatSelect, FormsModule, MatSelectTrigger, MatOption, MatButtonToggleGroup, MatButtonModule,
    MatButtonToggle, ResultDetailedGridComponent, MatProgressSpinner, ResultScrollDirective, MatGridList,
    ResultItemComponent, ResultDetailedItemComponent, MatGridTile, ResultGridTileComponent, AsyncPipe, TranslatePipe,
    ResizableColumnDirective, ResizableTableDirective, ResultCardItemComponent]
})
export class ResultListComponent implements OnInit, DoCheck, OnChanges, AfterViewInit {

  /**
   * @constant
   */
  public GEO_DISTANCE = 'geodistance';

  /**
   * @constant
   */
  public FILTER_ON = marker('Filter on');

  /**
   * @constant
   */
  public GLOBAL_ACTIONS = marker('Global actions');
  /**
   * @constant
   */
  public GEOSORT_ACTION = marker('Geo sort action');
  /**
   * @constant
   */
  public GRID_MODE = marker('Grid mode');
  /**
   * @constant
   */
  public LIST_MODE = marker('List mode');
  /**
   * @constant
   */
  public CARD_MODE = marker('Card mode');
  /**
   * @constant
   */
  public CONTAIN_FIT = marker('Fit the whole thumbnail to the tile');

  /**
   * @constant
   */
  public WIDTH_FIT = marker('Fit the thumbnail\'s width to the tile');

  /**
   * @constant
   */
  public HEIGHT_FIT = marker('Fit the thumbnail\'s height to the tile');

  /**
   * @constant
   */
  public GEOSORT_BUTTON = marker('Geo-sort');

  /**
   * @constant
   */
  public COLUMN_ACTIONS_HEIGHT = 52;

  /**
   * @constant
   */
  public COLUMN_NAME_HEIGHT = 27;

  /**
   * @constant
   */
  public FILTERS_HEIGHT = 50;

  /**
   * @constant
   */
  public TAIL_HEIGHT = 35;

  public scrollOptions = { maintainScrollUpPosition: true, maintainScrollDownPosition: true, nbLines: 0 };

  /**
   * @Input : Angular
   * @description An input to customize the resultlist
   */
  @Input() public options = new ResultListOptions();

  @Input() public fetchState = { endListUp: true, endListDown: false };
  /**
   * @Input : Angular
   * @description List of the fields displayed in the table (including the id field)
   * NOTE : This list should include the ID field. It will be the id of each item
   */
  @Input() public tableFields: Array<TableFieldConfig> = [];

  /**
   * @Input : Angular
   * @description List of the card displayed in the card view.
   */
  @Input() public cardFields: Array<CardFieldConfig> = [];

  /**
   * @Input : Angular
   * @description List of fieldName-fieldValue map. Each map corresponds to a row/grid.
   * @note In order to apply `selectInBetween` method properly, this list must be ascendingly sorted on the item identifier.
   */
  @Input() public rowItemList: Array<Map<string, ItemDataType>> = [];

  /**
   * @Input : Angular
   * @description A configuration object that sets id field, title field and urls to images && thumbnails
   */
  public fieldsConfiguration = input.required<FieldsConfiguration>();

  /**
   * @Input : Angular
   * @description The table width. If not specified, the tableWidth value is
   * equal to container width.
   */
  @Input() public tableWidth!: number;

  /**
   * @Input : Angular
   * @description The number of items left on the list/grid when scrolling up or down upon which loading new data is triggered.
   * When scrolling up or down, once there is `nLastLines` items left at the top or bottom of the list, previous/next data is loaded.
   * @deprecated nLastLines is deprecated and used only if `nbLinesBeforeFetch` is not set
  */
  @Input() public nLastLines?: number;

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
  public detailedDataRetriever = input.required<DetailedDataRetriever>();

  /**
   * @Input : Angular
   * @description List of items ids that are in a selected status.
  */
  @Input() public selectedItems: Set<string> = new Set<string>();

  /**
   * @Input : Angular
   * @description Map <itemId, Set<actionIds>> : for each item, gives the list of activated actions.
  */
  @Input() public activatedActionsPerItem: Map<string, Set<string>> = new Map<string, Set<string>>();

  /**
   * @Input : Angular
   * @description List of items ids to be highlighted.
   */
  @Input() public highlightItems: Set<string> = new Set<string>();

  /**
   * @Input : Angular
   * @description Mode of representation : `list` or `grid`.
   */
  @Input() public defautMode = ResultlistModeEnum.grid;

  /**
 * @Input : Angular
 * @description Whether the body table is hidden or not.
 */
  @Input() public isBodyHidden = false;
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
  @Input() public currentSortedColumn?: SortedColumn;

  /**
   * @Input : Angular
   * @description A fieldName-fieldValue map of fields to filter.
   */

  @Input() public filtersMap = new Map<string, ItemDataType>();

  /**
   * @Input : Angular
   * @description A  map of fieldName- Observable of array value for dropdown filter
   */

  @Input() public dropDownMapValues = new Map<string, Observable<string[]>>();
  /**
   * @Input : Angular
   * @description A  boolean to show or hide thead of table
   */
  @Input() public displayThead = true;

  /**
   * @Input : Angular
   * @description List of [key, color] couples that associates a hex color to each key
   */
  @Input() public keysToColors = new Array<[string, string]>();

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
  @Input() public selectedGridItem?: Item;
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

  @Input() public hasGridMode = false;
  @Input() public hasCardMode = false;

  /**
   * Whether the columns of the resultlist in list mode can be resized
   */
  public isListResizable = input(true);

  /**
   * List of processes to not display in the Task summary
   */
  public ignoredProcesses = input<Set<AvailableProcess>>(new Set());

  /**
   * Timer between each refresh of items tasks when its detail is displayed
   */
  public taskRetrievalTimer = input<number>(5000);

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
  @Output() public selectedItemsEvent = new Subject<Array<string>>();

  /**
   * @Output : Angular
   * @description Emits one item identifier that is hovered.
   */
  @Output() public consultedItemEvent = new Subject<ElementIdentifier>();

  /**
   * @Output : Angular
   * @description Emits the filtred fields map (fieldName-fieldValue map).
   */
  @Output() public setFiltersEvent: Subject<Map<string, ItemDataType>> = new Subject();

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
  @Output() public changeResultMode: Subject<ResultlistModeEnum> = new Subject<ResultlistModeEnum>();

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

  /**
   * @Output : Angular
   * @description Emits when result list is updated.
   */
  @Output() public onResultListUpdate: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * @Output : Angular
   * @description Emits when the list is ready.
   */
  @Output() public onListLoaded = new EventEmitter<boolean>();

  public columns: Array<Column> = [];
  public cardFieldsRows: Array<CardField[]> = [];
  public items: Array<Item> = new Array<Item>();
  public sortedColumn: { columnName: string; fieldName: string; sortDirection: SortEnum; }
    = { columnName: '', fieldName: '', sortDirection: SortEnum.asc };

  // Heights of table elements
  public tbodyHeight?: number;
  public theadHeight?: number;

  public ModeEnum = ResultlistModeEnum;
  public ThumbnailFitEnum = ThumbnailFitEnum;
  public PageEnum = PageEnum;
  public SortEnum = SortEnum;

  private readonly iterableRowsDiffer: IterableDiffer<Map<string, ItemDataType>>;
  private readonly iterableColumnsDiffer;
  private readonly iterableCardsDiffer;

  public isNextPageRequested = false;
  public isPreviousPageRequested = false;
  public resultMode = ResultlistModeEnum.grid;
  public allItemsChecked = false;

  public displayListGrid = 'inline';
  public isShiftDown = false;

  private readonly debouncer = new Subject<ElementIdentifier>();
  private readonly scrollDebouncer = new Subject<any>();
  private readonly emitVisibleItemsDebouncer = new Subject<any>();
  protected sortableFields: Array<SortableField> = [];

  private itemTasksSubscriptions = new Map<string, Subscription>();

  public constructor(iterableRowsDiffer: IterableDiffers, iterableColumnsDiffer: IterableDiffers,
                     iterableCardsDiffer: IterableDiffers,
    private readonly el: ElementRef,
    private readonly colorService: ArlasColorService,
    private readonly notifier: ResultlistNotifierService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.iterableRowsDiffer = iterableRowsDiffer.find([]).create();
    this.iterableColumnsDiffer = iterableColumnsDiffer.find([]).create();
    this.iterableCardsDiffer = iterableCardsDiffer.find([]).create();
    // Resize the table height on window resize
    fromEvent(globalThis, 'resize')
      .pipe(debounceTime(500))
      .subscribe((event: Event) => {
        this.setTableHeight();
      });
    // Add debounce on hover item list
    this.debouncer.pipe(debounceTime(200)).subscribe(elementidentifier => this.consultedItemEvent.next(elementidentifier));
    this.scrollDebouncer.pipe(debounceTime(1000)).subscribe(page => this.paginationEvent.next(page));
    this.emitVisibleItemsDebouncer.pipe(debounceTime(1000)).subscribe(event => this.visibleItems.next(event));
  }

  @HostListener('document:keydown.shift')
  public shiftDown() {
    this.isShiftDown = true;
  }

  @HostListener('document:keyup.shift')
  public shiftUp() {
    this.isShiftDown = false;
  }

  public ngOnInit() {
    this.updateResultMode(this.defautMode?.toString());
    this.options = Object.assign(new ResultListOptions(), this.options);
  }

  public ngAfterViewInit(): void {
    this.onListLoaded.next(true);
    this.setTableWidth();
    this.setTableHeight();
  }

  public emitThumbnailsFitStatus(fitChange: MatButtonToggleChange): void {
    this.thumbnailFit = fitChange.value;
    this.thumbnailFitEvent.next(this.thumbnailFit);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['defautMode'] !== undefined) {
      this.updateResultMode(this.defautMode?.toString());
      this.setTableHeight();
    }

    if (changes['rowItemList'] !== undefined) {
      this.items = [];
      // Reset selected items when data change (ie a filter is applied/removed or pagination occur)
      this.selectedItems = new Set<string>();
      this.isPreviousPageRequested = false;

      // If the selected item is not in the current list of items, close the detail
      const selectedItemInData = !!this.selectedGridItem && this.rowItemList
        .map(item => <string>item.get(this.fieldsConfiguration().idFieldName))
        .includes(this.selectedGridItem.identifier);
      if (!(!!changes['rowItemList'].currentValue && selectedItemInData)) {
        this.closeDetail(true);
      }

      this.onChangeItems.next(changes['rowItemList'].currentValue);
    }
    if (changes['isDetailledGridOpen'] !== undefined) {
      this.isDetailledGridOpen = changes['isDetailledGridOpen'].currentValue;
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
      if (this.fetchState?.endListUp) {
        this.isPreviousPageRequested = false;
      }
      if (this.fetchState?.endListDown) {
        this.isNextPageRequested = false;
      }
    }
    if (changes['currentSortedColumn']?.currentValue) {
      this.sortedColumn = {
        columnName: changes['currentSortedColumn'].currentValue.columnName,
        fieldName: changes['currentSortedColumn'].currentValue.fieldName,
        sortDirection: changes['currentSortedColumn'].currentValue.sortDirection
      };
    }
  }

  public ngDoCheck() {
    const columnChanges = this.iterableColumnsDiffer.diff(this.tableFields);
    const cardFieldsChanges = this.iterableCardsDiffer.diff(this.cardFields);
    const itemChanges = this.iterableRowsDiffer.diff(this.rowItemList);
    if (columnChanges) {
      this.setColumns();
    }

    if(cardFieldsChanges){
      this.setCardFields();
    }

    if(columnChanges || cardFieldsChanges){
      this.buildSortableFields();
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
          this.items.splice(- 1, 1);
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
      this.onResultListUpdate.emit(true);
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
  public paginate(itemData: Map<string, ItemDataType>, whichPage: PageEnum) {
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
  public setFilters(filtersMap: Map<string, ItemDataType>): void {
    this.filtersMap = filtersMap;
    this.setFiltersEvent.next(this.filtersMap);
  }

  /**
   * @description Sets and emits the identifiers list of selected items
   */
  public setSelectedItems(selectedItems: Set<string>, item?: Item, stopPropagation?: boolean) {
    // remove all text selection on current document
    // SB : Sometime blinking append, need to be deepened
    document.getSelection()?.removeAllRanges();

    if (item) {
      item.isChecked = !item.isChecked;
    }

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

  public setDirection(event: Event) {
    event.stopPropagation();
    if (this.sortedColumn.sortDirection === SortEnum.asc) {
      this.sortedColumn.sortDirection = SortEnum.desc;
    } else {
      this.sortedColumn.sortDirection = SortEnum.asc;
    }
    this.sort(this.sortedColumn as any);
  }

  public setSortedColumn(event: MatSelectChange) {
    if (event.value) {
      this.sortedColumn = {
        columnName: event.value.columnName,
        fieldName: event.value.fieldName,
        sortDirection: this.sortedColumn?.sortDirection ?? SortEnum.none
      };
    } else {
      this.sortedColumn = {
        columnName: '',
        fieldName: '',
        sortDirection: SortEnum.none
      };
    }
    this.sort(this.sortedColumn as any);
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
    this.sortedColumn = { columnName: '', fieldName: '', sortDirection: SortEnum.asc };
    this.currentSortedColumn = undefined;

    this.geoSortEvent.next(this.GEO_DISTANCE);
  }

  /**
   * @description Sets and emits the hovered item's identifier
   */
  public setConsultedItem(identifier: string) {
    const elementidentifier: ElementIdentifier = {
      idFieldName: this.fieldsConfiguration().idFieldName,
      idValue: identifier
    };
    this.debouncer.next(elementidentifier);
  }

  /**
   * @description called on hovering an item : its sets the items actions + emits the item's identifier
   * @param item hovered item
   */
  public onEnterItem(item: Item): void {
    this.setConsultedItem(item.identifier);
    this.notifier.notifyItemHover(item.identifier);
  }

  /**
   * @description called on leaving an item : emits the item's identifier
   * @param item item previously hovered
   */
  public onLeaveItem(item: Item): void {
    this.setConsultedItem('leave-' + item.identifier);
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
  public switchMode(toggleChangeEvent: MatButtonToggleChange) {
    this.updateResultMode(toggleChangeEvent.value);
    this.changeResultMode.next(this.resultMode);
    this.setTableHeight();
  }

  /**
   * Update result mode to display data according to user selection
   */
  public updateResultMode(value: string){
    const enumFound = stringToResultlistModeEnum(value);
    if (enumFound === ResultlistModeEnum.grid) {
      this.resultMode = ResultlistModeEnum.grid;
      this.displayListGrid = 'block';
    } else if (enumFound === ResultlistModeEnum.card) {
      this.resultMode = ResultlistModeEnum.card;
      this.displayListGrid = 'block';
    }  else  {
      this.resultMode = ResultlistModeEnum.list;
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
      const lastItem = selectedItemsList.at(-1);
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
          this.selectedItems.add(item.identifier);
        }
      });
      this.setSelectedItems(this.selectedItems, undefined, true);
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
    });
  }


  public byFieldName(item1: Column, item2: Column) {
    return item1 && item2 ? item1.fieldName === item2.fieldName : item1 === item2;
  }

  public setCardFields(){
    this.cardFieldsRows = [];
    let cardsViewProperties: CardField[] = [];
    const sortedCards =  [...(this.cardFields || [])]
      .sort((d1, d2) => d1.lineNumber - d2.lineNumber);

    sortedCards.forEach((curr, i) => {
      const prev: CardFieldConfig = sortedCards[i - 1];
      const cardEntry = new CardField(curr.prettyName, curr.fieldName, curr.dataType, curr.isTitle,
        curr.lineNumber, curr.icon, curr?.sort);
      if(prev && prev.lineNumber !== cardEntry.lineNumber){
        this.cardFieldsRows.push(cardsViewProperties);
        cardsViewProperties = [];
      }
      cardsViewProperties.push(cardEntry);
    });
    // push the final group once we've processed the last item
    this.cardFieldsRows.push(cardsViewProperties);
  }

  /**
   * Updates the subscription to retrieve action status.
   * @param event
   */
  public onItemDetailToggle(event: ItemDetailToggleEvent) {
    if (event.open) {
      this.stopTaskRetrieval(event.item.identifier);

      // Every set interval of time, updates the status of item's tasks
      const obs$ = interval(this.taskRetrievalTimer())
        .subscribe(_ => {
          this.detailedDataRetriever().getTasks(event.item.identifier)
            .pipe(first())
            .subscribe(tasks => {
              event.item.tasks = tasks;
              // If all tasks are in a final state, then stop retrieving updated state
              if (tasks.filter(t => t.status === TaskStatus.accepted || t.status === TaskStatus.running).length === 0) {
                this.stopTaskRetrieval(event.item.identifier);
              }
            });
        });

      this.itemTasksSubscriptions.set(event.item.identifier, obs$);
      return;
    }

    this.stopTaskRetrieval(event.item.identifier);
  }

  private stopTaskRetrieval(itemId: string) {
    const previousSubscription = this.itemTasksSubscriptions.get(itemId);
    if (previousSubscription) {
      previousSubscription.unsubscribe();
      this.itemTasksSubscriptions.delete(itemId);
    }
  }

  // Build the table's columns
  private setColumns() {
    if (!this.tableWidth) {
      return;
    }

    this.columns = new Array<Column>();
    const checkboxColumnWidth = 25;
    const toggleColumnWidth = 35;
    // id column is the first one and has a pre fixed width
    // It is the column where checkboxes are put
    const idColumn = new Column('', this.fieldsConfiguration().idFieldName, '');
    idColumn.isIdField = true;
    idColumn.width = checkboxColumnWidth;
    this.columns.unshift(idColumn);
    this.tableFields.forEach(field => {
      const column = new Column(field.columnName, field.fieldName, field.dataType);
      column.width = (this.tableWidth - checkboxColumnWidth - toggleColumnWidth) / this.tableFields.length;
      column.useColorService = field.useColorService ? field.useColorService : false;
      this.columns.push(column);
    });
    // add a column for toggle icon
    const toggleColumn = new Column('', 'toggle', '');
    toggleColumn.isToggleField = true;
    toggleColumn.width = toggleColumnWidth;
    this.columns.push(toggleColumn);
  }

  private onAddItems(itemData: Map<string, ItemDataType>, addOnTop: boolean, index: number) {
    const id = <string>itemData.get(this.fieldsConfiguration().idFieldName);
    const item = new Item(this.columns, this.cardFieldsRows, itemData, id, this.items.length);
    item.identifier = id;
    if (this.fieldsConfiguration().titleFieldNames) {
      item.title = this.fieldsConfiguration().titleFieldNames
        ?.map(field => <string>itemData.get(field.fieldPath + '_title'))
        .join(' ');
      if (item.title) {
        item.title = item.title.trim();
      }
    }

    const iconColorFieldName = this.fieldsConfiguration().iconColorFieldName;
    if (this.useColorService && iconColorFieldName) {
      const colorFieldValue = <string>itemData.get(iconColorFieldName + '_title');
      if (colorFieldValue) {
        item.color = this.colorService.getColor(colorFieldValue, this.keysToColors, this.colorsSaturationWeight);
      }
    }

    const tooltipFieldNames = this.fieldsConfiguration().tooltipFieldNames;
    if (tooltipFieldNames) {
      item.tooltip = tooltipFieldNames
        .map(field => <string>itemData.get(field.fieldPath + '_tooltip'))
        .join(' ');
      if (item.tooltip) {
        item.tooltip = item.tooltip.trim();
      }
    }

    const iconCssClass = this.fieldsConfiguration().iconCssClass;
    if (iconCssClass) {
      item.iconCssClass = <string>itemData.get(iconCssClass);
      if (item.iconCssClass) {
        item.iconCssClass = item.iconCssClass.trim();
      }
    }
    item.imageEnabled = itemData.get('imageEnabled') === 'true';
    item.thumbnailEnabled = itemData.get('thumbnailEnabled') === 'true';
    item.detailsTitleEnabled = itemData.get('detailsTitleEnabled') === 'true';

    /** Retro-compatibility code */
    const urlImageTemplate = this.fieldsConfiguration().urlImageTemplate;
    if (item.imageEnabled && urlImageTemplate) {
      item.urlImages = new Array<string>();
      item.urlImages.push(matchAndReplace(itemData, urlImageTemplate));
    }
    /** End of retro-compatibility code */

    const urlImageTemplates = this.fieldsConfiguration().urlImageTemplates;
    if (item.imageEnabled && urlImageTemplates && urlImageTemplates.length > 0) {
      item.urlImages = new Array<string>();
      item.descriptions = new Array<string>();
      urlImageTemplates.forEach(descUrl => {
        let condition = !descUrl.filter;
        if (descUrl.filter) {
          const data = itemData.get(descUrl.filter.field);
          if (Array.isArray(data)) {
            condition = data.some(v => descUrl.filter?.values.includes(v));
          } else if (data) {
            condition = descUrl.filter.values.includes(data.toString());
          } else {
            condition = false;
          }
        }
        if (condition) {
          item.urlImages.push(matchAndReplace(itemData, descUrl.url));
          item.descriptions.push(matchAndReplace(itemData, descUrl.description));
        }
      });
    }

    const urlThumbnailTemplate = this.fieldsConfiguration().urlThumbnailTemplate;
    if (item.thumbnailEnabled && urlThumbnailTemplate) {
      item.urlThumbnail = matchAndReplace(itemData, urlThumbnailTemplate);
    }

    const detailsTitleTemplate = this.fieldsConfiguration().detailsTitleTemplate;
    if (item.detailsTitleEnabled && detailsTitleTemplate) {
      item.detailsTitle = matchAndReplace(itemData, detailsTitleTemplate);
    }

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
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * @description Sets the table head and body height
   */
  private setTableHeight(nbTrials = 0) {
    const tableElement = this.el.nativeElement.parentElement as HTMLElement;
    if (!!tableElement && tableElement.getBoundingClientRect().height !== 0) {
      this.theadHeight = this.COLUMN_ACTIONS_HEIGHT +
        // Only in list mode
        this.COLUMN_NAME_HEIGHT * (this.resultMode === ResultlistModeEnum.list ? 1 : 0) +
        // Only if filters are present
        this.FILTERS_HEIGHT * (this.displayFilters ? 1 : 0);
      this.tbodyHeight = tableElement.getBoundingClientRect().height - this.theadHeight -
        // Only if the list is in grid mode
        this.TAIL_HEIGHT * (this.resultMode === ResultlistModeEnum.grid ? 1 : 0) -
        // Only if the list is in grid mode and has an element selected
        this.detailedGridHeight * (this.resultMode === ResultlistModeEnum.grid ? 1 : 0) * (this.isDetailledGridOpen ? 1 : 0);
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

  /**
   * Build field list used to sort the data.
   * @private
   */
  private buildSortableFields() {
    const uniqueField = new Set<string>();
    const fields = this.hasCardMode
      ? [...this.columns, ...this.cardFieldsRows.flat()]
      : this.columns;

    for (const f of fields) {
      const sortableField = f.toSortableField();
      if (!uniqueField.has(sortableField.fieldName)) {
        uniqueField.add(sortableField.fieldName);
        this.sortableFields.push(sortableField);
      }
    }
  }
}

import { Component, OnInit, Input, Output, DoCheck, IterableDiffers, ElementRef } from '@angular/core';
import { SortEnum } from '../utils/enumerations/sortEnum';
import { ModeEnum } from '../utils/enumerations/modeEnum';

import { Column } from '../model/column';
import { Item } from '../model/item';
import { Action, ElementIdentifier, FieldsConfiguration } from '../utils/results.utils';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';
import { ANIMATION_TYPES } from 'ngx-loading';
import { MatButtonToggleChange } from '@angular/material';
import { SimpleChanges } from '@angular/core';
import { OnChanges } from '@angular/core/core';

/**
 * ResultList component allows to structure data in a filterable and sortable table.
 * Items can be represented as rows or grids and are multi-selectable.
 * For both list and grid modes, each item has detailed data that can be displayed in a togglable space.
 */

@Component({
  selector: 'arlas-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.css']
})
export class ResultListComponent implements OnInit, DoCheck, OnChanges {
  /**
   * @constant
   */
  public GEO_DISTANCE = 'geodistance';
  /**
   * @constant
   */
  public GEOSORT = 'Geo distance sort';
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
  public GEOSORT_ACTIONS = 'Geo sort actions';
  /**
   * @constant
   */
  public GRID_MODE = 'Grid mode';
  /**
   * @constant
   */
  public LIST_MODE = 'List mode';

  // columnName is the shown name
  // fieldName is the real field name that's hidden
  // dataType (degree, percentage, etc)
  // includes an ID field. It will be the id of each item
  /**
   * @Input : Angular
   * @description List of the fields displayed in the table (including the id field)
   */
  @Input() public fieldsList: Array<{ columnName: string, fieldName: string, dataType: string }>;

  /**
   * @Input : Angular
   * @description List of fieldName-fieldValue map. Each map corresponds to a row/grid
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
  * @description When the `last - n` line is reached, more data is requested.
  */
  @Input() public nLastLines = 5;

  /**
   * @Input : Angular
   * @description Number of new rows added each time the `last - n` line is reached.
   */
  @Input() public searchSize;

  /**
   * @Input : Angular
   * @description Height of the detail grid div (Grid Mode).
   */
  @Input() public detailedGridHeight = 250;

  /**
   * @Input : Angular
   * @description Number of grid columns (Grid Mode).
   */
  @Input() public nbGridColumns = 3;

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
   * @description Whether the sort on the geometry is activated.
   */
  @Input() public isGeoSortActived = false;
  /**
 * @Input : Angular
 * @description Whether the auto sort on the geometry is activated.
 */
  @Input() public isAutoGeoSortActived = false;
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
   * @Output : Angular
   * @description Emits the event of sorting data on the specified column.
   */
  @Output() public sortColumnEvent: Subject<{ fieldName: string, sortDirection: SortEnum }> =
    new Subject<{ fieldName: string, sortDirection: SortEnum }>();

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
   * @description Emits the request of more data to load. The emited number is the number
   * of times this event has been emitted.
   */
  @Output() public moreDataEvent: Subject<number> = new Subject<number>();

  /**
   * @Output : Angular
   * @description Emits the event of applying the specified action on the specified item.
   */
  @Output() public actionOnItemEvent: Subject<{ action: Action, elementidentifier: ElementIdentifier }> =
    new Subject<{ action: Action, elementidentifier: ElementIdentifier }>();

  /**
   * @Output : Angular
   * @description Emits the event of applying the specified globalb action on the selected items.
   */
  @Output() public globalActionEvent: Subject<Action> = new Subject<Action>();

  /**
   * @Output : Angular
   * @description Emits the event of applying the specified globalb action on the selected items.
   */
  @Output() public columnFilterChanged: Subject<Column> = new Subject<Column>();

  public columns: Array<Column>;
  public items: Array<Item> = new Array<Item>();
  public sortedColumn: { fieldName: string, sortDirection: SortEnum };

  // Heights of table elements
  public tbodyHeight: number = null;
  public theadHeight: number = null;

  public ANIMATION_TYPES = ANIMATION_TYPES;
  public ModeEnum = ModeEnum;
  public SortEnum = SortEnum;

  public selectedGridItem: Item;
  private selectedItemsPositions = new Set<number>();


  private iterableRowsDiffer;
  private iterableColumnsDiffer;

  public isMoreDataRequested = false;
  public hasGridMode = false;
  public resultMode: ModeEnum = this.defautMode;
  public allItemsChecked = false;

  public isDetailledGridOpen = false;

  private detailedGridCounter = 0;

  public borderStyle = 'solid';
  public displayListGrid = 'inline';

  private debouncer = new Subject<ElementIdentifier>();


  public geoSortActions: Array<Action> = [
    {
      id: 'geosort',
      label: 'Sort by geo distance'
    },
    {
      id: 'auto-geosort',
      label: 'Active auto geo distance sorting'
    },
    {
      id: 'remove-auto-geosort',
      label: 'Remove auto geo distance sorting'
    }
  ];

  constructor(iterableRowsDiffer: IterableDiffers, iterableColumnsDiffer: IterableDiffers, private el: ElementRef) {
    this.iterableRowsDiffer = iterableRowsDiffer.find([]).create(null);
    this.iterableColumnsDiffer = iterableColumnsDiffer.find([]).create(null);
    this.resultMode = this.defautMode;
    // Resize the table height on window resize
    Observable.fromEvent(window, 'resize')
      .debounceTime(500)
      .subscribe((event: Event) => {
        this.setTableHeight();
      });
    // Add debounce on hover item list
    this.debouncer.debounceTime(500).subscribe(elementidentifier => this.consultedItemEvent.next(elementidentifier));

  }

  public ngOnInit() {
    if (this.fieldsConfiguration !== undefined && this.fieldsConfiguration !== null) {
      if (this.fieldsConfiguration.urlThumbnailTemplate !== undefined) {
        this.hasGridMode = true;
      }
      this.setTableWidth();
      this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 85 - 50;
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['defautMode'] !== undefined) {
      if (this.defautMode.toString() === ModeEnum.grid.toString()) {
        this.resultMode = ModeEnum.grid;
        this.displayListGrid = 'block';
      } else {
        this.resultMode = ModeEnum.list;
        this.displayListGrid = 'inline';
      }
      this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 85 - 50 -
        (this.detailedGridHeight * this.resultMode * this.detailedGridCounter);
    }

    if (changes['rowItemList'] !== undefined) {
      this.items = [];
      this.closeDetail(true);
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
          item.ishighLight = false;
        });
      }
    }
  }

  public ngDoCheck() {
    const columnChanges = this.iterableColumnsDiffer.diff(this.fieldsList);
    const itemChanges = this.iterableRowsDiffer.diff(this.rowItemList);
    if (columnChanges) {
      this.setColumns();
    }
    if (itemChanges) {
      itemChanges.forEachAddedItem(i => {
        this.onAddItems(i.item);
      });
      this.setSelectedItems(this.selectedItems);
      this.isMoreDataRequested = false;
    }
  }

  /**
   * @description Emits the event of asking for more items to fetch
   * @param moreDataCallsCounter Counts the event's emission occurence
   */
  // when it's called for more data, an animated loading div is shown
  public askForMoreData(moreDataCallsCounter: number) {
    this.moreDataEvent.next(moreDataCallsCounter);
    this.isMoreDataRequested = true;
  }

  /**
   * @description Emits which action to apply on which item/product
   */
  public triggerActionOnItem(actionOnItem: { action: Action, elementidentifier: ElementIdentifier }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

  /**
   * @description Sets and emits the action to apply to all selected items
   */
  public setGlobalAction(action: Action) {
    this.globalActionEvent.next(action);
  }

  public setGeoSortAction(action: Action) {
    switch (action.id) {
      case 'geosort':
        this.geoSort();
        break;
      case 'auto-geosort':
        this.isAutoGeoSortActived = true;
        this.isGeoSortActived = true;
        this.geoAutoSortEvent.next(this.isAutoGeoSortActived);
        this.geoSort();
        break;
      case 'remove-auto-geosort':
        this.isAutoGeoSortActived = false;
        this.isGeoSortActived = false;
        this.geoAutoSortEvent.next(this.isAutoGeoSortActived);
        break;
    }
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
  public setSelectedItems(selectedItems: Set<string>) {
    this.selectedItems = selectedItems;
    if (selectedItems.size !== this.items.length) {
      this.allItemsChecked = false;
    } else if (this.items.length !== 0) {
      this.allItemsChecked = true;
    }
    this.selectedItemsEvent.next(Array.from(this.selectedItems));
  }

  /**
   * @description Emits the column to sort on and the sort direction
   */
  public sort(sortedColumn: Column): void {
    if (!this.isAutoGeoSortActived) {
      this.isGeoSortActived = false;
    }
    if (sortedColumn.sortDirection === SortEnum.none) {
      sortedColumn.sortDirection = SortEnum.asc;
    } else if (sortedColumn.sortDirection === SortEnum.asc) {
      sortedColumn.sortDirection = SortEnum.desc;
    } else {
      sortedColumn.sortDirection = SortEnum.asc;
    }
    this.sortedColumn = { fieldName: sortedColumn.fieldName, sortDirection: sortedColumn.sortDirection };
    this.columns.forEach(column => {
      if (column.fieldName !== sortedColumn.fieldName) {
        column.sortDirection = SortEnum.none;
      }
    });
    this.sortColumnEvent.next(this.sortedColumn);
  }

  /**
   * @description Emits the request event of geo-sorting
   */
  public geoSort(): void {
    this.isGeoSortActived = true;
    this.columns.forEach(column => {
      if (!column.isIdField) {
        column.sortDirection = SortEnum.none;
      }
    });
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
    if (this.detailedGridCounter === 0) {
      this.detailedGridCounter++;
    }
    this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 85 - 50 - this.detailedGridHeight;
  }

  public closeDetail(isClosed: boolean) {
    if (isClosed) {
      this.detailedGridCounter = 0;
      this.isDetailledGridOpen = false;
      this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 85 - 50;
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
    this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 85 - 50 -
      (this.detailedGridHeight * this.resultMode * this.detailedGridCounter);
  }

  /**
   * @description Selects all the items
   */
  public selectAllItems() {
    this.allItemsChecked = !this.allItemsChecked;
    this.selectedItems = new Set<string>();
    this.selectedItemsPositions = new Set<number>();

    this.items.forEach(item => {
      item.isChecked = this.allItemsChecked;
      item.isindeterminated = false;
      if (this.allItemsChecked) {
        this.selectedItems.add(item.identifier);
        this.selectedItemsPositions.add(item.position);
      }
    });
    this.setSelectedItems(this.selectedItems);
  }

  /**
   * @description Selects all the items between the farest and nearest selected items
   */
  public selectInBetween() {
    const sortedItemsPositions = Array.from(this.selectedItemsPositions).sort((a: number, b: number) => a - b);
    if (sortedItemsPositions.length !== 0) {
      for (let i = sortedItemsPositions[0]; i < sortedItemsPositions[sortedItemsPositions.length - 1]; i++) {
        this.items[i].isChecked = true;
        this.items[i].isindeterminated = false;
        if (!this.selectedItems.has(this.items[i].identifier)) {
          this.selectedItems.add(this.items[i].identifier);
          this.selectedItemsPositions.add(this.items[i].position);
        }
      }
      this.setSelectedItems(this.selectedItems);
    }
  }

  /**
   * @description Sets the positions list of the selected items
   */
  public setItemsPositionsList(item: Item) {
    if (item.isChecked) {
      this.selectedItemsPositions.add(item.position);
    } else {
      this.selectedItemsPositions.delete(item.position);
    }
  }

  /**
   * @description Emits the column when a filter is addedd
   */
  public columnChanged(colum: Column) {
    this.columnFilterChanged.next(colum);
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
      this.columns.push(column);
    });
    // add a column for toggle icon
    const toggleColumn = new Column('', 'toggle', '');
    toggleColumn.isToggleField = true;
    toggleColumn.width = toggleColumnWidth;
    this.columns.push(toggleColumn);
  }

  private onAddItems(itemData: Map<string, string | number | Date>) {
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
    if (this.fieldsConfiguration.urlImageTemplate) {
      item.urlImage = this.fieldsConfiguration.urlImageTemplate;
      this.fieldsConfiguration.urlImageTemplate.split('/').forEach(t => {
        if (t.indexOf('{') >= 0 && t.indexOf('}') >= 0) {
          const key: string = t.replace('{', '').replace('}', '');
          item.urlImage = item.urlImage.replace(t, itemData.get(key).toString());
        }
      });
    }
    if (this.fieldsConfiguration.urlThumbnailTemplate) {
      item.urlThumbnail = this.fieldsConfiguration.urlThumbnailTemplate;
      this.fieldsConfiguration.urlThumbnailTemplate.split('/').forEach(t => {
        if (t.indexOf('{') >= 0 && t.indexOf('}') >= 0) {
          const key: string = t.replace('{', '').replace('}', '');
          item.urlThumbnail = item.urlThumbnail.replace(t, itemData.get(key).toString());
        }
      });
    }
    if (this.fieldsConfiguration.imageEnabled) {
      if (itemData.get('imageEnabled') === 'false') {
        item.imageEnabled = false;
      }
    }
    if (this.fieldsConfiguration.thumbnailEnabled) {
      if (itemData.get('thumbnailEnabled') === 'false') {
        item.thumbnailEnabled = false;
      }
    }

    item.position = this.items.length + 1;
    item.ishighLight = false;
    // When new data is loaded, check the one that were already checked +
    // remove the no longuer existing data from selectedItems (thanks to actualSelectedItems)
    if (this.allItemsChecked) {
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
    this.items.push(item);
  }




  private setTableWidth() {
    if (this.tableWidth === null) {
      this.tableWidth = this.el.nativeElement.childNodes[0].offsetWidth;
    }
  }

  private setTableHeight() {
    this.theadHeight = this.el.nativeElement.childNodes[0].childNodes[1].offsetHeight;
    this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - this.theadHeight;
  }

}

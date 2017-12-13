import { identifierName } from '@angular/compiler/compiler';
import {
  Component, OnInit, Input, Output, DoCheck, IterableDiffers, ElementRef,
  HostListener
} from '@angular/core';
import { SortEnum } from '../utils/enumerations/sortEnum';
import { ModeEnum } from '../utils/enumerations/modeEnum';

import { Column } from '../model/column';
import { Item } from '../model/item';
import { Action, ElementIdentifier, FieldsConfiguration } from '../utils/results.utils';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Rx';
import { ANIMATION_TYPES } from 'ngx-loading';
import { MatButtonToggleChange } from '@angular/material';
import { SimpleChanges } from '@angular/core';
import { OnChanges } from '@angular/core/core';



@Component({
  selector: 'arlas-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.css']
})
export class ResultListComponent implements OnInit, DoCheck, OnChanges {

  public GEO_DISTANCE = 'geodistance';
  public GEOSORT = 'Geo distance sort';
  public SORT_DESCENDING = 'click for descending sort';
  public SORT_ASCENDING = 'click for ascending sort';
  public FILTER_ON = 'Filter on';
  public CHECK_INBETWEEN = 'Check in between';
  public CHECK_ALL = 'Check all visible items';
  public GLOBAL_ACTIONS = 'Global actions';
  public GRID_MODE = 'Grid mode';
  public LIST_MODE = 'List mode';

  // columnName is the shown name
  // fieldName is the real field name that's hidden
  // dataType (degree, percentage, etc)
  // includes an ID field. It will be the id of each item
  /**
   * @Input
   * @description List of the fields displayed in the table (including the id field)
   */
  @Input() public fieldsList: Array<{ columnName: string, fieldName: string, dataType: string }>;

  /**
   * @Input
   * @description List of fieldName-fieldValue map. Each map corresponds to a row/grid
   */
  @Input() public rowItemList: Array<Map<string, string | number | Date>>;

  /**
   * @Input
   * @description A configuration object that sets id field, title field and urls
   * to images && thumbnails
   */
  @Input() public fieldsConfiguration: FieldsConfiguration;

  /**
   * @Input
   * @description The table width. If not specified, the tableWidth value is
   * equal to container width.
   */
  @Input() public tableWidth: number = null;

   /**
   * @Input
   * @description When the `last - n` line is reached, more data is requested.
   */
  @Input() public nLastLines = 5;

  /**
   * @Input
   * @description Number of new rows added each time the `last - n` line is reached.
   */
  @Input() public searchSize;

  /**
   * @Input
   * @description Height of the detail grid div (Grid Mode).
   */
  @Input() public detailedGridHeight = 250;

  /**
   * @Input
   * @description Number of grid columns (Grid Mode).
   */
  @Input() public nbGridColumns = 3;

  /**
   * @Input
   * @description List of actions to apply on the selected items.
   */
  @Input() public globalActionsList = new Array<Action>();

  /**
   * @Input
   * @description A detailed-data-retriever object that implements
   * DetailedDataRetriever interface.
   */
  @Input() public detailedDataRetriever: DetailedDataRetriever = null;

  /**
   * @Input
   * @description List of items ids that are in a indeterminated status.
   */
  @Input() public indeterminatedItems: Set<string> = new Set<string>();

  /**
   * @Input
   * @description List of items ids to be highlighted.
   */
  @Input() public highlightItems: Set<string> = new Set<string>();

  /**
   * @Input
   * @description Mode of representation : `list` or `grid`.
   */
  @Input() public defautMode: ModeEnum;

  @Input() public isBodyHidden: boolean;

  /**
   * @Input
   * @description Whether the sort on the geometry is activated.
   */
  @Input() public isGeoSortActived = false;


  /**
   * @Input
   * @description A fieldName-fieldValue map of fields to filter.
   */
  @Input() public filtersMap: Map<string, string | number | Date>;

  /**
   * @Output
   * @description Emits the event of sorting data on the specified column.
   */
  @Output() public sortColumnEvent: Subject<{ fieldName: string, sortDirection: SortEnum }> =
  new Subject<{ fieldName: string, sortDirection: SortEnum }>();

  /**
   * @Output
   * @description Emits the event of geo-sorting data.
   */
  @Output() public geoSortEvent: Subject<string> = new Subject<string>();

  /**
   * @Output
   * @description Emits the list of items identifiers whose checkboxes are selected.
   */
  @Output() public selectedItemsEvent: Subject<Array<string>> = new Subject<Array<string>>();

  /**
   * @Output
   * @description Emits one item identifier that is hovered, selected or clicked on it
   * for consultation purposes.
   */
  @Output() public consultedItemEvent: Subject<ElementIdentifier> = new Subject<ElementIdentifier>();

  /**
   * @Output
   * @description Emits the filtred fields map (fieldName-fieldValue map).
   */
  @Output() public setFiltersEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();

  /**
   * @Output
   * @description Emits the request of more data to load. The emited number is the number
   * of times this event has been emitted.
   */
  @Output() public moreDataEvent: Subject<number> = new Subject<number>();

  /**
   * @Output
   * @description Emits the event of applying the specified action on the specified item.
   */
  @Output() public actionOnItemEvent: Subject<{ action: Action, elementidentifier: ElementIdentifier }> =
  new Subject<{ action: Action, elementidentifier: ElementIdentifier }>();

  /**
   * @Output
   * @description Emits the event of applying the specified globalb action on the selected items.
   */
  @Output() public globalActionEvent: Subject<Action> = new Subject<Action>();

  public columns: Array<Column>;
  public items: Array<Item> = new Array<Item>();
  public sortedColumn: { fieldName: string, sortDirection: SortEnum };

  // Heights of table elements
  public tbodyHeight: number = null;
  public theadHeight: number = null;

  public ANIMATION_TYPES = ANIMATION_TYPES;
  public ModeEnum = ModeEnum;
  public SortEnum = SortEnum;

  public selectedItems: Set<string> = new Set<string>();
  public selectedGridItem: Item;
  private selectedItemsPositions = new Set<number>();


  private iterableRowsDiffer;
  private iterableColumnsDiffer;

  public isMoreDataRequested = false;
  public hasGridMode = false;
  public resultMode: ModeEnum = this.defautMode;
  public allItemsChecked = false;

  private detailedGridCounter = 0;

  public borderStyle = 'solid';
  public displayListGrid = 'inline';


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
  }

  // when it's called for more data, an animated loading div is shown
  public askForMoreData(moreDataCallsCounter: number) {
    this.moreDataEvent.next(moreDataCallsCounter);
    this.isMoreDataRequested = true;
  }

  // Set the table width and height (tbody height)
  public ngOnInit() {
    if (this.fieldsConfiguration.urlThumbnailTemplate !== undefined) {
      this.hasGridMode = true;
    }
    this.setTableWidth();
    this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 85 - 50;
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
    }
    if (changes['indeterminatedItems'] !== undefined) {
      this.indeterminatedItems.forEach(id => {
        this.items.forEach(item => {
          if (item.identifier === id && !this.selectedItems.has(id)) {
            item.isindeterminated = true;
          }
        });
      });
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


  // ngDoCheck is triggered both when the instance of an object has changed or when new elements are
  // pushed in an Array
  public ngDoCheck() {
    const columnChanges = this.iterableColumnsDiffer.diff(this.fieldsList);
    const itemChanges = this.iterableRowsDiffer.diff(this.rowItemList);
    if (columnChanges) {
      this.setColumns();
    }
    if (itemChanges) {
      const itemAdded: Array<string> = new Array<string>();
      itemChanges.forEachAddedItem(i => {
        itemAdded.push(i.item.get(this.fieldsConfiguration.idFieldName));
        this.onAddItems(i.item);
      });
      this.setSelectedItems(this.selectedItems);
      this.isMoreDataRequested = false;
    }
  }

  // Emits which action is applied on which item/product
  public triggerActionOnItem(actionOnItem: { action: Action, elementidentifier: ElementIdentifier }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

  public setGlobalAction(action: Action) {
    this.globalActionEvent.next(action);
  }

  // Emits a map of only filtered fields
  public setFilters(filtersMap: Map<string, string | number | Date>): void {
    this.filtersMap = filtersMap;
    this.setFiltersEvent.next(this.filtersMap);
  }

  // Emits a list of item/product identifiers
  public setSelectedItems(selectedItems: Set<string>) {
    this.selectedItems = selectedItems;
    if (selectedItems.size !== this.items.length) {
      this.allItemsChecked = false;
    } else if (this.items.length !== 0) {
      this.allItemsChecked = true;
    }
    this.selectedItemsEvent.next(Array.from(this.selectedItems));
  }


  // Emits the column to sort on and the sort direction
  public sort(sortedColumn: Column): void {
    this.isGeoSortActived = false;
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

  public geoSort(column: Column): void {
    this.isGeoSortActived = true;
    this.columns.forEach(column => {
      if (!column.isIdField) {
        column.sortDirection = SortEnum.none;
      }
    });
    this.geoSortEvent.next(this.GEO_DISTANCE);
  }

  // Emits the identifier of the hovered item/product
  public setConsultedItem(identifier: string) {
    const elementidentifier: ElementIdentifier = {
      idFieldName: this.fieldsConfiguration.idFieldName,
      idValue: identifier
    };
    this.consultedItemEvent.next(elementidentifier);
  }

  public setBorderStyle(borderStyle): void {
    this.borderStyle = borderStyle;
  }

  public setSelectedGridItem(item: Item) {
    this.selectedGridItem = item;
    if (this.detailedGridCounter === 0) {
      this.detailedGridCounter++;
    }
    this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 85 - 50 - this.detailedGridHeight;
  }

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

  public setItemsPositionsList(item: Item) {
    if (item.isChecked) {
      this.selectedItemsPositions.add(item.position);
    } else {
      this.selectedItemsPositions.delete(item.position);
    }
  }

  // Build the table's columns
  private setColumns() {
    this.columns = new Array<Column>();
    const checkboxColumnWidth = 25;
    const toggleColumnWidth = 35;
    this.fieldsList.forEach(field => {
      const column = new Column(field.columnName, field.fieldName, field.dataType);
      if (field.fieldName === this.fieldsConfiguration.idFieldName) {
        // id column is the first one and has a pre fixed width
        // It is the column where checkboxes are put
        column.isIdField = true;
        column.width = checkboxColumnWidth;
        this.columns.unshift(column);
      } else {
        // The other columns have the same width which is the table width (without the id column) divided by the nuber of fields.
        column.width = (this.tableWidth - checkboxColumnWidth - toggleColumnWidth) / (this.fieldsList.length - 1);
        this.columns.push(column);
      }
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
    if (this.fieldsConfiguration.titleFieldName) {
      if (this.fieldsConfiguration.titleFieldName.indexOf(',') < 0) {
        item.title = <string>itemData.get(this.fieldsConfiguration.titleFieldName);
      } else {
        item.title = '';
        this.fieldsConfiguration.titleFieldName.split(',').forEach(field => {
          item.title = item.title + ' ' + itemData.get(field);
        });
      }
      item.title = item.title.trim();
    }
    if (this.fieldsConfiguration.urlImageTemplate) {
      item.urlImage = this.fieldsConfiguration.urlImageTemplate;
      this.fieldsConfiguration.urlImageTemplate.split('/').forEach(t => {
        if (t.indexOf('{') >= 0) {
          item.urlImage = item.urlImage.replace(t, itemData.get(t.slice(1, -1)).toString());
        }
      });
    }
    if (this.fieldsConfiguration.urlThumbnailTemplate) {
      item.urlThumbnail = this.fieldsConfiguration.urlThumbnailTemplate;
      this.fieldsConfiguration.urlThumbnailTemplate.split('/').forEach(t => {
        if (t.indexOf('{') >= 0) {
          item.urlThumbnail = item.urlThumbnail.replace(t, itemData.get(t.slice(1, -1)).toString());
        }
      });
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

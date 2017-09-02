import {
  Component, OnInit, Input, Output, DoCheck, IterableDiffers, ElementRef,
  HostListener
} from '@angular/core';
import { SortEnum } from '../utils/enumerations/sortEnum';
import { Column } from '../model/column';
import { RowItem } from '../model/rowItem';
import { Action, ProductIdentifier } from '../utils/results.utils';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';
import { ANIMATION_TYPES } from 'ngx-loading';


@Component({
  selector: 'arlas-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.css']
})
export class ResultListComponent implements OnInit, DoCheck {

  // columnName is the shown name
  // fieldName is the real field name that's hidden
  // dataType (degree, percentage, etc)
  // includes an ID field. It will be the id of each item
  @Input() public fieldsList: Array<{ columnName: string, fieldName: string, dataType: string }>;

  // rowItemList is a list of fieldName-fieldValue map
  @Input() public rowItemList: Array<Map<string, string | number | Date>>;

  // Name of the id field
  @Input() public idFieldName: string;

  // the table width. If not specified, the tableWidth value is equal to container width.
  @Input() public tableWidth: number = null;

  // When the scrollbar achieves this lines, more data is called
  @Input() public nLastLines = 5;

  // Number of new rows added after each moreDataEvent
  @Input() public searchSize;

  // a detailed-data retriever object that implements DetailedDataRetriever interface .
  @Input() public detailedDataRetriever: DetailedDataRetriever = null;

  // Sorting a column event. Do we use a Subject or try ngOnChange ?
  @Output() public sortColumnEvent: Subject<{ fieldName: string, sortDirection: SortEnum }> =
  new Subject<{ fieldName: string, sortDirection: SortEnum }>();

  // selectedItemsEvent emits the list of items identifiers whose checkboxes are selected.
  @Output() public selectedItemsEvent: Subject<Array<string>> = new Subject<Array<string>>();

  // consultedItemEvent emits one item identifier that is hovered, selected or clicked on it. The consulted item can be highlighted in
  // the map for example. It's only for consultation.
  @Output() public consultedItemEvent: Subject<ProductIdentifier> = new Subject<ProductIdentifier>();

  // The searchedFieldsEvent emits a list of fieldName-fieldValue
  @Output() public setFiltersEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();

  // The moreDataEvent notify the need for more data.
  @Output() public moreDataEvent: Subject<number> = new Subject<number>();

  // The action triggered on an item which identifier is 'identifier'.
  @Output() public actionOnItemEvent: Subject<{ action: Action, productIdentifier: ProductIdentifier }> =
  new Subject<{ action: Action, productIdentifier: ProductIdentifier }>();


  public columns: Array<Column>;
  public rows: Array<RowItem>;
  public filtersMap: Map<string, string | number | Date>;
  public sortedColumn: { fieldName: string, sortDirection: SortEnum };

  // Heights of table elements
  public tbodyHeight: number = null;
  public theadHeight: number = null;
  public ANIMATION_TYPES = ANIMATION_TYPES;

  public SortEnum = SortEnum;
  public selectedItems: Array<string> = new Array<string>();

  public borderStyle = 'solid';


  private iterableRowsDiffer;
  private iterableColumnsDiffer;

  public isMoreDataRequested = false;


  constructor(iterableRowsDiffer: IterableDiffers, iterableColumnsDiffer: IterableDiffers, private el: ElementRef) {
    this.iterableRowsDiffer = iterableRowsDiffer.find([]).create(null);
    this.iterableColumnsDiffer = iterableColumnsDiffer.find([]).create(null);

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
    this.setTableWidth();
    this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 85;
  }

  // ngDoCheck is triggered both when the instance of an object has changed or when new elements are
  // pushed in an Array
  public ngDoCheck() {
    const columnChanges = this.iterableColumnsDiffer.diff(this.fieldsList);
    const rowChanges = this.iterableRowsDiffer.diff(this.rowItemList);
    if (columnChanges) {
      this.setColumns();
    }
    if (rowChanges) {
      this.setRows();
      // If the called "more data" is retrieved, hide the animated loading div
      this.isMoreDataRequested = false;
    }
  }

  // Emits which action is applied on which item/product
  public triggerActionOnItem(actionOnItem: { action: Action, productIdentifier: ProductIdentifier }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

  // Emits a map of only filtered fields
  public setFilters(filtersMap: Map<string, string | number | Date>): void {
    this.filtersMap = filtersMap;
    this.setFiltersEvent.next(this.filtersMap);
  }

  // Emits a list of item/product identifiers
  public setSelectedItems(selectedItems: Array<string>) {
    this.selectedItems = selectedItems;
    this.selectedItemsEvent.next(this.selectedItems);
  }

  // Emits the column to sort on and the sort direction
  public sort(sortedColumn: Column): void {
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

  // Emits the identifier of the hovered item/product
  public setConsultedItem(identifier: string) {
    const productIdentifier: ProductIdentifier = {
      idFieldName: this.idFieldName,
      idValue: identifier
    };
    this.consultedItemEvent.next(productIdentifier);
  }

  public setBorderStyle(borderStyle): void {
    this.borderStyle = borderStyle;
  }


  // Build the table's columns
  private setColumns() {
    this.columns = new Array<Column>();
    this.filtersMap = new Map<string, string | number | Date>();
    const checkboxColumnWidth = 25;
    const toggleColumnWidth = 35;
    this.fieldsList.forEach(field => {
      const column = new Column(field.columnName, field.fieldName, field.dataType);
      if (field.fieldName === this.idFieldName) {
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

  // Build the table's rows
  private setRows() {
    this.rows = new Array<RowItem>();
    this.rowItemList.forEach(rowData => {
      // The columns are passed as parameters so we're sure to build cells of the row in the exact same order of columns
      const row = new RowItem(this.columns, rowData);
      this.rows.push(row);
    });
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

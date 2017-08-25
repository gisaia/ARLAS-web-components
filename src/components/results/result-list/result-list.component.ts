import { Component, OnInit, AfterViewInit, Input, Output, DoCheck, IterableDiffers, ViewContainerRef, ElementRef} from '@angular/core';
import { SortEnum } from '../utils/sortEnum';
import { Column } from '../utils/column';
import { RowItem } from '../utils/rowItem';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Rx';



@Component({
  selector: 'arlas-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.css']
})
export class ResultListComponent implements OnInit, DoCheck, AfterViewInit {

  // columnName is the shown name
  // fieldName is the real field name that's hidden
  // dataType (degree, percentage, etc)
  // includes an ID field. It will be the id of each item
  @Input() public fieldsList: Array<{columnName: string, fieldName: string, dataType: string}>;

  // rowItemList is a list of fieldName-fieldValue map
  @Input() public rowItemList: Array<Map<string, string | number | Date>> ;

  // Name of the id field
  @Input() public idFieldName: string;

  // the table width. If not specified, the tableWidth value is equal to container width.
  @Input() public tableWidth: number = null;

  // a detailed-data retriever object that implements DetailedDataRetriever interface .
  @Input() public detailedDataRetriever: DetailedDataRetriever = null;

  // Sorting a column event. Do we use a Subject or try ngOnChange ?
  @Output() public sortColumnEvent: Subject<{fieldName: string, sortDirection: SortEnum}> =
  new Subject<{fieldName: string, sortDirection: SortEnum}>();

  // selectedItemsEvent emits the list of items identifiers whose checkboxes are selected.
  @Output() public selectedItemsEvent: Subject<Array<string>> = new Subject<Array<string>>();

  // consultedItemEvent emits one item identifier that is hovered, selected or clicked on it. The consulted item can be highlighted in
  // the map for example. It's only for consultation.
  @Output() public consultedItemEvent: Subject<string> = new Subject<string>();

  // The searchedFieldsEvent emits a list of fieldName-fieldValue
  @Output() public setFiltersEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();

  // The moreDataEvent notify the need for more data.
  @Output() public moreDataEvent: Subject<any>;

  // The action triggered on an item which identifier is 'identifier'.
  @Output() public actionOnItemEvent: Subject<{action: {id: string, label: string,
   actionBus: Subject<{idFieldName: string, idValue: string}>},
     productIdentifier: {idFieldName: string, idValue: string}}> = new Subject<{action: {id: string, label: string,
     actionBus: Subject<{idFieldName: string, idValue: string}>}, productIdentifier: {idFieldName: string, idValue: string}}>();


  public columns: Array<Column>;
  public rows: Array<RowItem>;
  public filtersMap: Map<string, string | number | Date>;
  public sortedColumn: {fieldName: string, sortDirection: SortEnum};

  // Heights of table elements
  public tbodyHeight: number = null;
  public theadHeight: number = null;


  public SortEnum = SortEnum;
  public selectedItems: Array<string> = new Array<string>();

  private iterableRowsDiffer;
  private iterableColumnsDiffer;


  constructor(iterableRowsDiffer: IterableDiffers, iterableColumnsDiffer: IterableDiffers, private viewContainerRef: ViewContainerRef,
   private el: ElementRef) {
    this.iterableRowsDiffer = iterableRowsDiffer.find([]).create(null);
    this.iterableColumnsDiffer = iterableColumnsDiffer.find([]).create(null);

    Observable.fromEvent(window, 'resize')
        .debounceTime(500)
        .subscribe((event: Event) => {
          this.setTableHeight();
        });
}


  public ngAfterViewInit() {
  }

  public ngOnInit() {
    this.setTableWidth();
    this.tbodyHeight = this.el.nativeElement.parentElement.offsetHeight - 95;
  }

  public ngDoCheck() {
    const columnChanges = this.iterableColumnsDiffer.diff(this.fieldsList);
    const rowChanges = this.iterableRowsDiffer.diff(this.rowItemList);
    if (columnChanges) {
        this.setColumns();
    }
    if (rowChanges) {
        this.setRows();
    }
  }

  public triggerActionOnItem(actionOnItem: {action: {id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>},
  productIdentifier: {idFieldName: string, idValue: string}}) {
    this.actionOnItemEvent.next(actionOnItem);
  }

  public setFilters(filtersMap: Map<string, string | number | Date>): void {
    this.filtersMap = filtersMap;
    this.setFiltersEvent.next(this.filtersMap);
  }

  public setSelectedItems(selectedItems: Array<string>) {
    this.selectedItems = selectedItems;
    this.selectedItemsEvent.next(this.selectedItems);
  }

  public sort(sortedColumn: Column): void {
    if (sortedColumn.sortDirection === SortEnum.none) {
      sortedColumn.sortDirection = SortEnum.asc;
    } else if (sortedColumn.sortDirection === SortEnum.asc) {
      sortedColumn.sortDirection = SortEnum.desc;
    } else {
      sortedColumn.sortDirection = SortEnum.asc;
    }
    this.sortedColumn = {fieldName: sortedColumn.fieldName, sortDirection: sortedColumn.sortDirection};
    this.columns.forEach(column => {
      if (column.fieldName !== sortedColumn.fieldName) {
        column.sortDirection = SortEnum.none;
      }
    });
    this.sortColumnEvent.next(this.sortedColumn);
  }


  public setConsultedItem(identifier: string) {
    this.consultedItemEvent.next(identifier);
  }

  private setColumns() {
    this.columns = new Array<Column>();
    this.filtersMap = new Map<string, string | number | Date>();
    this.fieldsList.forEach(field => {
      const column = new Column(field.columnName, field.fieldName, field.dataType);
      column.width = (this.tableWidth - 20) / (this.fieldsList.length - 1);
      if (field.fieldName === this.idFieldName) {
        column.isIdField = true;
        // id column is the first one
        this.columns.unshift(column);
      } else {
        this.columns.push(column);
      }
    });
  }

  private setRows() {
    this.rows = new Array<RowItem>();
    this.rowItemList.forEach(rowItem => {
      const row = new RowItem(this.columns, rowItem);
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

  private getField(field: {fieldName: string, fieldValue: string}, fieldName: string) {
    return field.fieldName === fieldName;
  }



}

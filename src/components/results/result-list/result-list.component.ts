import { Component, OnInit, Input, Output, OnChanges, SimpleChange, DoCheck, IterableDiffers,
         ViewContainerRef, ElementRef} from '@angular/core';
import { SortEnum } from '../utils/sortEnum';
import { Column } from '../utils/column';
import { RowItem } from '../utils/rowItem';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Subject } from 'rxjs/Subject';


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
  @Output() public sortColumnEvent: Subject<{sort: SortEnum, fieldName: string}> = new Subject<{sort: SortEnum, fieldName: string}>();

  // selectedItemsEvent emits the list of items identifiers whose checkboxes are selected.
  @Output() public selectedItemsEvent: Subject<Array<string>>;

  // consultedItemEvent emits one item identifier that is hovered, selected or clicked on it. The consulted item can be highlighted in
  // the map for example. It's only for consultation.
  @Output() public consultedItemEvent: Subject<string>;

  // The searchedFieldsEvent emits a list of fieldName-fieldValue
  @Output() public setFiltersEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();

  // The moreDataEvent notify the need for more data.
  @Output() public moreDataEvent: Subject<any>;

  // The action triggered on an item which identifier is 'identifier'.
  @Output() public actionOnItemEvent: Subject<{action: string, identifier: string}> = new Subject<{action: string, identifier: string}>();


  public columns: Array<Column>;
  public rows: Array<RowItem>;
  public filtersMap: Map<string, string | number | Date>;
  public SortEnum = SortEnum;

  private iterableRowsDiffer;
  private iterableColumnsDiffer;


  constructor(iterableRowsDiffer: IterableDiffers, iterableColumnsDiffer: IterableDiffers, private viewContainerRef: ViewContainerRef,
   private el: ElementRef) {
    this.iterableRowsDiffer = iterableRowsDiffer.find([]).create(null);
    this.iterableColumnsDiffer = iterableColumnsDiffer.find([]).create(null);
}


  public ngOnInit() {
    if (this.tableWidth === null) {
      this.tableWidth = this.el.nativeElement.childNodes[0].offsetWidth;
    }
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

  public setActionOnItem(actionOnItem: {action: string, identifier: string}) {
    this.actionOnItemEvent.next(actionOnItem);
  }

  public setFilters(filtersMap: Map<string, string | number | Date>): void {
    this.filtersMap = filtersMap;
    this.setFiltersEvent.next(this.filtersMap);
  }

  public sort(column: Column): void {
    if (column.sortDirection === SortEnum.none) {
      column.sortDirection = SortEnum.asc;
    } else if (column.sortDirection === SortEnum.asc) {
      column.sortDirection = SortEnum.desc;
    } else {
      column.sortDirection = SortEnum.asc;
    }
    this.sortColumnEvent.next({sort: column.sortDirection, fieldName: column.fieldName});
  }

  private setColumns() {
    this.columns = new Array<Column>();
    this.filtersMap = new Map<string, string | number | Date>();
    this.fieldsList.forEach(field => {
      const column = new Column(field.columnName, field.fieldName, field.dataType);
      if (field.fieldName === this.idFieldName) {
        column.isIdField = true;
        // id column is the first one
        this.columns.unshift(column);
      } else {
        this.columns.push(column);
        this.filtersMap.set(column.fieldName, null);
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

  private getField(field: {fieldName: string, fieldValue: string}, fieldName: string) {
    return field.fieldName === fieldName;
  }



}

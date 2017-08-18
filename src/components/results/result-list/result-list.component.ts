import { Component, OnInit, Input, Output, OnChanges, SimpleChange, DoCheck, IterableDiffers,
         ViewContainerRef, ElementRef} from '@angular/core';
import { SortEnum } from '../results.utils';
import { Column } from '../utils/column';
import { RowItem } from '../utils/rowItem';
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

  // Actions list for detailed items : View, Show on map, Download ...
  @Input() public actionsList: Array<string>;

  // the table width. If not specified, the tableWidth value is equal to container width.
  @Input() public tableWidth: number = null;

  // Sorting a column event. Do we use a Subject or try ngOnChange ?
  @Output() public sortColumnEvent: Subject<{sort: SortEnum, fieldName: string}>;

  // selectedItemsEvent emits the list of items identifiers whose checkboxes are selected.
  @Output() public selectedItemsEvent: Subject<Array<string>>;

  // consultedItemEvent emits one item identifier that is hovered, selected or clicked on it. The consulted item can be highlighted in
  // the map for example. It's only for consultation.
  @Output() public consultedItemEvent: Subject<string>;

  // The searchedFieldsEvent emits a list of fieldName-fieldValue
  @Output() public searchedFieldsEvent: Subject<Array<{fieldName: string, fieldValue: string | number | Date }>>;

  // The moreDataEvent notify the need for more data.
  @Output() public moreDataEvent: Subject<any>;

  public columns: Array<Column>;
  public rows: Array<RowItem>;
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

  private setColumns() {
    this.columns = new Array<Column>();
    this.fieldsList.forEach(field => {
      const column = new Column(field.columnName, field.fieldName, field.dataType);
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

}

import { Component, OnInit, Input, Output } from '@angular/core';
import { SortEnum } from '../results.utils';

import { Subject } from 'rxjs/Subject';


@Component({
  selector: 'arlas-result-list',
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.css']
})
export class ResultListComponent implements OnInit {

  // columnName is the shown name
  // fieldName is the real field name that's hidden
  // dataType (degree, percentage, etc)
  // includes an ID field. It will be the id of each item
  @Input() public fieldsList: Array<{columnName: string, fieldName: string, dataType: string}>;

  // tableContent is a list of fieldName-fieldValue map
  @Input() public tableContent: Array<Map<string, string | number | Date>> ;

  // Actions list for detailed items : View, Show on map, Download ...
  @Input() public actionsList: Array<string>;

  // the table width. If not specified, the tableWidth value is equal to container width.
  @Input() public tableWidth: number;

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

  constructor() { }

  public ngOnInit() {
  }

}

import { DoCheck } from '@angular/core/core';
import { Component, OnInit, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Column } from '../model/column';
import { Subject } from 'rxjs/Subject';
import { MatSelectChange, MatOption } from '@angular/material';


@Component({
  selector: '[arlas-result-filter]',
  templateUrl: './result-filter.component.html',
  styleUrls: ['./result-filter.component.css']
})
export class ResultFilterComponent implements OnInit, OnChanges {

  /**
   * @Input
   * @description The column to which the filter is applied.
   */
  @Input() public column: Column;
  /**
   * @Input
   * @description A map of columns to filter : key = column (or field) name & value = field value.
   * This components sets directly this map.
   */
  @Input() public filtersMap: Map<string, string | number | Date> = new Map<string, string | number | Date>();
  /**
   * @Input
   * @description The filter value.
   */
  @Input() public inputValue: string;
  /**
   * @Input
   * @description The values of dropdown list.
   */
  @Input() public dropdownValues: Array<string> = new Array<string>();
  /**
   * @Output
   * @description Emits the map of filtered columns and the filters values (fieldName-fieldValue map).
   */
  @Output() public setFiltersEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();

  /**
   * @Output
   * @description Emits the column on change to notify the main component.
   */
  @Output() public columnChanged: Subject<Column> = new Subject<Column>();

  public selected: Array<any> = new Array<any>();

  private iterableInputDiffer;
  private iterableColumnsDiffer;

  constructor() { }

  public ngOnInit() {
  }
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtersMap'] !== undefined) {
      if (changes['filtersMap'].currentValue !== undefined) {
        if (changes['filtersMap'].currentValue !== changes['filtersMap'].previousValue) {
          if (changes['filtersMap'].currentValue.get(this.column.fieldName) !== undefined) {
            if (this.inputValue !== changes['filtersMap'].currentValue.get(this.column.fieldName)) {
              this.inputValue = changes['filtersMap'].currentValue.get(this.column.fieldName);
              this.selected = new Array<any>();
              this.inputValue.split(',').forEach(v => this.selected.push(v));
            }
          } else {
            this.inputValue = '';
            this.selected = new Array<any>();
          }
        }
      }
    }
  }

  public setFilterOnKeyEnter(event) {
    event.target.blur();
  }



  // Update the map of the filtered fields. If a filter is empty, the correspondant field is removed from the map
  public setFilter() {
    if (this.inputValue === undefined || this.inputValue === '' || this.inputValue === null) {
      if (this.filtersMap.has(this.column.fieldName)) {
        this.filtersMap.delete(this.column.fieldName);
        this.setFiltersEvent.next(this.filtersMap);
        this.columnChanged.next(this.column);
      }
    } else {
      this.filtersMap.set(this.column.fieldName, this.inputValue);
      this.setFiltersEvent.next(this.filtersMap);
      this.columnChanged.next(this.column);
    }
  }

  public selectionChange(event: MatSelectChange) {
    if (event.value.length > 0) {
      this.filtersMap.set(event.source.id, event.value.join(','));
      this.setFiltersEvent.next(this.filtersMap);
      this.columnChanged.next(this.column);
    } else {
      if (this.filtersMap.has(event.source.id)) {
        this.filtersMap.delete(event.source.id);
        this.setFiltersEvent.next(this.filtersMap);
        this.columnChanged.next(this.column);
      }
    }
  }
}

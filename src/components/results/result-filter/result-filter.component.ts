import { Component, OnInit, Input, Output } from '@angular/core';
import { Column } from '../utils/column';
import { Subject } from 'rxjs/Subject';


@Component({
  selector: '[arlas-result-filter]',
  templateUrl: './result-filter.component.html',
  styleUrls: ['./result-filter.component.css']
})
export class ResultFilterComponent implements OnInit {

  @Input() public column: Column;
  @Input() public filtersMap: Map<string, string | number | Date>;
  @Output() public setFiltersEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();
  public inputValue: string;

  constructor() { }

  public ngOnInit() {
  }

  public setFilters() {
    if (this.inputValue === undefined) {
      this.inputValue = null;
    }
    this.filtersMap.set(this.column.fieldName, this.inputValue);
    this.setFiltersEvent.next(this.filtersMap);
  }

}

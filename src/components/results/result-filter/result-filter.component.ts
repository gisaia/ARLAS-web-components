import { Component, OnInit, Input, Output, OnChanges, SimpleChange, DoCheck, IterableDiffers } from '@angular/core';
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
  @Input() public inputValue: string;
  private isKeyEnterPressed = false;

  private iterableInputDiffer;
  private iterableColumnsDiffer;

  constructor(iterableInputDiffer: IterableDiffers) {
    this.iterableInputDiffer = iterableInputDiffer.find([]).create(null);
  }

  public ngOnInit() {
  }

  public setFilterOnKeyEnter(event) {
    event.target.blur();
  }

  private setFilter() {
    if (this.inputValue === undefined || this.inputValue === '' || this.inputValue === null) {
      if (this.filtersMap.has(this.column.fieldName)) {
        this.filtersMap.delete(this.column.fieldName);
        this.setFiltersEvent.next(this.filtersMap);
      }
    } else {
      this.filtersMap.set(this.column.fieldName, this.inputValue);
      this.setFiltersEvent.next(this.filtersMap);
    }
  }

}

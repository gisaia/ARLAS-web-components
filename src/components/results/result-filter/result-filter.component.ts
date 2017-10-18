import { DoCheck } from '@angular/core/core';
import { Component, OnInit, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Column } from '../model/column';
import { Subject } from 'rxjs/Subject';


@Component({
  selector: '[arlas-result-filter]',
  templateUrl: './result-filter.component.html',
  styleUrls: ['./result-filter.component.css']
})
export class ResultFilterComponent implements OnInit, OnChanges {


  @Input() public column: Column;
  @Input() public filtersMap: Map<string, string | number | Date>;
  @Output() public setFiltersEvent: Subject<Map<string, string | number | Date>> = new Subject<Map<string, string | number | Date>>();
  @Input() public inputValue: string;

  private iterableInputDiffer;
  private iterableColumnsDiffer;

  constructor() { }

  public ngOnInit() {
  }
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtersMap'] !== undefined) {
      if (changes['filtersMap'].currentValue !== undefined) {
        if(changes['filtersMap'].currentValue!==changes['filtersMap'].previousValue){
            if(changes['filtersMap'].currentValue.get(this.column.fieldName)!==undefined){
              if(this.inputValue!==changes['filtersMap'].currentValue.get(this.column.fieldName)){
                this.inputValue=changes['filtersMap'].currentValue.get(this.column.fieldName);
              }
            }
        }
      }
    }
  }

  public setFilterOnKeyEnter(event) {
    event.target.blur();
  }



  // Update the map of the filtered fields. If a filter is empty, the correspondant field is removed from the map
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

import { Component, OnInit, Input, Output } from '@angular/core';
import { RowItem } from '../model/rowItem';
import { Action, ProductIdentifier } from '../utils/results.utils';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';

import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';


@Component({
  selector: '[arlas-result-item]',
  templateUrl: './result-item.component.html',
  styleUrls: ['./result-item.component.css']
})
export class ResultItemComponent implements OnInit {

  @Input() public rowItem: RowItem;
  @Input() public detailedDataRetriever: DetailedDataRetriever;
  @Input() public selectedItems: Array<string>;

  @Output() public selectedItemsEvent: Subject<Array<string>> =  new Subject<Array<string>>();


  public isDetailToggled = false;
  public detailedData = '';
  public actions;
  public isChecked = false;
  private retrievedDataEvent: Observable<{details: Map<string, string>, actions: Array<Action>}>;

  protected identifier: string;

  constructor() { }

  public ngOnInit() {
    this.identifier = (String)(this.rowItem.data.get(this.rowItem.columns[0].fieldName));
    this.rowItem.identifier = this.identifier;
  }

  // Detailed data is retrieved wheb the row is toggled for the first time
  public toggle() {
    if ( this.rowItem.isDetailToggled === false) {
      if (this.detailedDataRetriever !== null && this.rowItem.detailedData.length === 0 ) {
        this.retrievedDataEvent = this.detailedDataRetriever.getData(((String)(this.identifier)));
        this.retrievedDataEvent.subscribe(value => {
          this.rowItem.actions = value.actions;
          value.details.forEach((value: string, key: string) => {
            this.rowItem.detailedData.push({key: key, value: value});
          });
        });
      }
    }
    this.rowItem.isDetailToggled = !this.rowItem.isDetailToggled;
  }

  // Update the list of the selected items
  public setSelectedItem() {
    this.isChecked = !this.isChecked;
    const index = this.selectedItems.indexOf(this.identifier);
    if (this.isChecked) {
      if (index === -1) {
        this.selectedItems.push(this.identifier);
      }
    } else {
      if (index !== -1) {
        this.selectedItems.splice(index, 1);
      }
    }
    this.selectedItemsEvent.next(this.selectedItems);
  }


}

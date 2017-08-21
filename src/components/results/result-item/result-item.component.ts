import { Component, OnInit, Input, Output } from '@angular/core';
import { RowItem } from '../utils/rowItem';
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
  @Output() public actionOnItemEvent: Subject<{action: string, identifier: string}> = new Subject<{action: string, identifier: string}>();
  public isDetailToggled = false;
  public detailedData = '';
  public actions;

  private retrievedDataEvent: Observable<{details: Map<string, string>, actions: Array<string>}>;

  private identifier: string;

  constructor() { }

  public ngOnInit() {
    this.identifier = (String)(this.rowItem.data.get(this.rowItem.columns[0].fieldName));
  }

  public toggle() {
    if ( this.isDetailToggled === false) {
      if (this.detailedDataRetriever !== null && this.detailedData === '' ) {
        this.retrievedDataEvent = this.detailedDataRetriever.getData(((String)(this.identifier)));
        this.retrievedDataEvent.subscribe(value => {
          this.actions = value.actions;
          value.details.forEach((value: string, key: string) => {
            this.detailedData += key + ': ' + value + '  ';
          });
        });
    }
    }
    this.isDetailToggled = !this.isDetailToggled;

  }

  public setAction(action: string) {
    this.actionOnItemEvent.next({action: action, identifier: this.identifier});
  }

}

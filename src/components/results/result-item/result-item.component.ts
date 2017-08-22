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
  @Input() public idFieldName: string;
  @Output() public actionOnItemEvent: Subject<{action: {id: string, label: string,
    actionBus: Subject<{idFieldName: string, idValue: string}>}, productIdentifier: {idFieldName: string, idValue: string}}> =
    new Subject<{action: {id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>},
    productIdentifier: {idFieldName: string, idValue: string}}>();
  @Input() public selectedItems: Array<string>;
  @Output() public selectedItemsEvent: Subject<Array<string>> =  new Subject<Array<string>>();

  public isDetailToggled = false;
  public detailedData = '';
  public actions;
  public isChecked = false;

  private retrievedDataEvent: Observable<{details: Map<string, string>,
                              actions: Array<{id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}>}>;

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

<<<<<<< 7c30716a49f68e1ac3899d0bc45e8fdaa02f70d0
  public setAction(action: {id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}) {
    this.actionOnItemEvent.next({action: action, productIdentifier: {idFieldName: this.idFieldName, idValue: this.identifier}});
=======

  public setAction(action: string) {
    this.actionOnItemEvent.next({action: action, identifier: this.identifier});
>>>>>>> add lines selection
  }

  public setSelectedItem() {
    this.isChecked = !this.isChecked;
    if (this.isChecked) {
      if (!this.selectedItems.includes(this.identifier)) {
        this.selectedItems.push(this.identifier);
      }
    } else {
      if (this.selectedItems.includes(this.identifier)) {
        const index = this.selectedItems.indexOf(this.identifier);
        this.selectedItems.splice(index, 1);
      }
    }
    this.selectedItemsEvent.next(this.selectedItems);
  }

}

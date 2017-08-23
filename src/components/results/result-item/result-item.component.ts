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
  @Output() public consultedItemEvent: Subject<string> = new Subject<string>();


  public isDetailToggled = false;
  public detailedData = '';
  public actions;
  public isChecked = false;

  private retrievedDataEvent: Observable<{details: Map<string, string>,
                              actions: Array<{id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}>}>;

  protected identifier: string;

  constructor() { }

  public ngOnInit() {
    this.identifier = (String)(this.rowItem.data.get(this.rowItem.columns[0].fieldName));
    this.rowItem.identifier = this.identifier;
  }

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

  public setAction(action: {id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}) {
    this.actionOnItemEvent.next({action: action, productIdentifier: {idFieldName: this.idFieldName, idValue: this.identifier}});
  }

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

  public setConsultedItem() {
    this.consultedItemEvent.next(this.identifier);
  }

}

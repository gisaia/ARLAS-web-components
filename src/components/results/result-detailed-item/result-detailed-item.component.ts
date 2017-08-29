import { Component, OnInit, Input, Output } from '@angular/core';
import { Column } from '../model/column';
import { RowItem } from '../model/rowItem';

import { Subject } from 'rxjs/Subject';

@Component({
  selector: '[arlas-result-detailed-item]',
  templateUrl: './result-detailed-item.component.html',
  styleUrls: ['./result-detailed-item.component.css']
})
export class ResultDetailedItemComponent implements OnInit {
  @Input() public detailColspan: number;
  @Input() public idFieldName: string;
  @Input() public rowItem: RowItem;

  @Output() public actionOnItemEvent: Subject<{action: {id: string, label: string,
    actionBus: Subject<{idFieldName: string, idValue: string}>}, productIdentifier: {idFieldName: string, idValue: string}}> =
    new Subject<{action: {id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>},
    productIdentifier: {idFieldName: string, idValue: string}}>();

  constructor() { }

  public ngOnInit() {
  }


  public triggerActionOnItem(action: {id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}) {
    this.actionOnItemEvent.next({action: action, productIdentifier: {idFieldName: this.idFieldName, idValue: this.rowItem.identifier}});
  }

}

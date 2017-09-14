import { Component, OnInit, Input, Output } from '@angular/core';
import { Action, ProductIdentifier } from '../utils/results.utils';
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

  @Output() public actionOnItemEvent: Subject<{action: Action, productIdentifier: ProductIdentifier}> =
    new Subject<{action: Action, productIdentifier: ProductIdentifier}>();

  constructor() { }

  public ngOnInit() {
  }

  // Emits the action on this ResultDetailedItem to the parent (ResultList)
  public triggerActionOnItem(action: Action) {
    this.actionOnItemEvent.next({action: action, productIdentifier: {idFieldName: this.idFieldName, idValue: this.rowItem.identifier}});
  }

}

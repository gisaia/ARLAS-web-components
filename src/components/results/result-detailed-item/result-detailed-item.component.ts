import { Component, OnInit, Input, Output } from '@angular/core';
import { Action, ElementIdentifier } from '../utils/results.utils';
import { Column } from '../model/column';
import { Item } from '../model/item';

import { Subject } from 'rxjs/Subject';

@Component({
  selector: '[arlas-result-detailed-item]',
  templateUrl: './result-detailed-item.component.html',
  styleUrls: ['./result-detailed-item.component.css']
})
export class ResultDetailedItemComponent implements OnInit {
  @Input() public detailColspan: number;
  @Input() public idFieldName: string;
  @Input() public rowItem: Item;

  @Output() public actionOnItemEvent: Subject<{action: Action, elementidentifier: ElementIdentifier}> =
    new Subject<{action: Action, elementidentifier: ElementIdentifier}>();

  constructor() { }

  public ngOnInit() {
  }

  // Emits the action on this ResultDetailedItem to the parent (ResultList)
  public triggerActionOnItem(action: Action) {
    this.actionOnItemEvent.next({action: action, elementidentifier: {idFieldName: this.idFieldName, idValue: this.rowItem.identifier}});
  }

}

import { Component, OnInit, Input, Output } from '@angular/core';
import { Column } from '../utils/column';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: '[arlas-result-detailed-item]',
  templateUrl: './result-detailed-item.component.html',
  styleUrls: ['./result-detailed-item.component.css']
})
export class ResultDetailedItemComponent implements OnInit {
  @Input() public detailColspan: number;
  @Output() public triggerActionEvent: Subject<{id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}> =
    new Subject<{id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}>();

  // Set of detailed informations about the item
  @Input() public detailedItemInformations: string;

  // Actions list : View, Show on map, Download ...
  @Input() public actionsList: Array<{id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}>;

  constructor() { }

  public ngOnInit() {
  }

  public setAction(action: {id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}): void {
    this.triggerActionEvent.next(action);
  }

}

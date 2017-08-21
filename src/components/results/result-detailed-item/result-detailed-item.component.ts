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
  @Output() public triggerActionEvent: Subject<string> = new Subject<string>();

  // Set of detailed informations about the item
  @Input() public detailedItemInformations: string;

  // Actions list : View, Show on map, Download ...
  @Input() public actionsList: Array<string>;

  constructor() { }

  public ngOnInit() {
  }

  public setAction(action: string): void {
    this.triggerActionEvent.next(action);
  }

}

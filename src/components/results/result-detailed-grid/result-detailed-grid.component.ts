import { Component, OnInit, Input, Output, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { Action, ProductIdentifier } from '../utils/results.utils';

import { Item } from '../model/item';
import { Subject } from 'rxjs/Subject';


@Component({
  selector: 'arlas-result-detailed-grid',
  templateUrl: './result-detailed-grid.component.html',
  styleUrls: ['./result-detailed-grid.component.css']
})
export class ResultDetailedGridComponent implements OnInit, OnChanges {
  @Input() public gridTile: Item;
  @Input() public detailWidth: number;
  @Input() public detailHeight: number;
  @Input() public idFieldName = 'id';

  @Output() public actionOnItemEvent: Subject<{action: Action, productIdentifier: ProductIdentifier}> =
    new Subject<{action: Action, productIdentifier: ProductIdentifier}>();

  public isDetailedDataShowed = false;

  constructor(private el: ElementRef) { }

  public ngOnInit() {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['gridTile']) {
        this.isDetailedDataShowed = false;
    }
  }

  public showHideDetailedData() {
    this.isDetailedDataShowed = !this.isDetailedDataShowed;
  }

  // Emits the action on this ResultDetailedItem to the parent (ResultList)
  public triggerActionOnItem(action: Action) {
    this.actionOnItemEvent.next({action: action, productIdentifier: {idFieldName: this.idFieldName, idValue: this.gridTile.identifier}});
  }

}

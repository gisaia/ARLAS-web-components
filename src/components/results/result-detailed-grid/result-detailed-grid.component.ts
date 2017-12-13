import { Component, OnInit, Input, Output, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { Action, ElementIdentifier } from '../utils/results.utils';

import { Item } from '../model/item';
import { Subject } from 'rxjs/Subject';


@Component({
  selector: 'arlas-result-detailed-grid',
  templateUrl: './result-detailed-grid.component.html',
  styleUrls: ['./result-detailed-grid.component.css']
})
export class ResultDetailedGridComponent implements OnInit, OnChanges {
  public SHOW_DETAILS = 'Show details';
  public SHOW_IMAGE = 'Show image';

  /**
   * @Input
   * @description An object representing an Item and that contains the detailed data.
   */
  @Input() public gridTile: Item;
  /**
   * @Input
   * @description Width of the detailed grid.
   */
  @Input() public detailWidth: number;
  /**
   * @Input
   * @description Height of the detailed grid.
   */
  @Input() public detailHeight: number;
  /**
   * @Input
   * @description Name of the id field.
   */
  @Input() public idFieldName: string;

  /**
   * @Output
   * @description Emits the event of applying the specified action on the specified item.
   */
  @Output() public actionOnItemEvent: Subject<{ action: Action, elementidentifier: ElementIdentifier }> =
  new Subject<{ action: Action, elementidentifier: ElementIdentifier }>();

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
  public triggerActionOnItem(actionOnItem: { action: Action, elementidentifier: ElementIdentifier }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

}

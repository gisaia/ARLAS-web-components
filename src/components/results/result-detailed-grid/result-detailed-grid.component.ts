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
  public CLOSE_DETAILS = 'Close details';

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
   * @Input
   * @description Whether the detail is visible.
   */
  @Input() public isDetailShowed: boolean;
  /**
   * @Output
   * @description Emits the event of applying the specified action on the specified item.
   */
  @Output() public actionOnItemEvent: Subject<{ action: Action, elementidentifier: ElementIdentifier }> =
    new Subject<{ action: Action, elementidentifier: ElementIdentifier }>();
  /**
 * @Output
 * @description Emits the event of closing details.
 */
  @Output() public closeDetail: Subject<boolean> = new Subject();

  public isDetailedDataShowed = false;

  constructor(private el: ElementRef) { }

  public ngOnInit() {
  }

  public ngOnChanges(changes: SimpleChanges) {
  }

  public showHideDetailedData() {
    this.isDetailedDataShowed = !this.isDetailedDataShowed;
  }

  public closeDetailedData() {
    this.isDetailShowed = false;
    this.closeDetail.next(true);
  }

  // Emits the action on this ResultDetailedItem to the parent (ResultList)
  public triggerActionOnItem(actionOnItem: { action: Action, elementidentifier: ElementIdentifier }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

}

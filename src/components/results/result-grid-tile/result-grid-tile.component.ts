/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Component, OnInit, Input, Output } from '@angular/core';
import { Item } from '../model/item';
import { ItemComponent } from '../model/itemComponent';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Subject } from 'rxjs';
import { Action, ElementIdentifier, ResultListOptions } from '../utils/results.utils';

@Component({
  selector: 'arlas-result-grid-tile',
  templateUrl: './result-grid-tile.component.html',
  styleUrls: ['./result-grid-tile.component.css']
})
export class ResultGridTileComponent extends ItemComponent implements OnInit {
  public SHOW_IMAGE = 'Click to show details';

  /**
   * @Input
   * @description An object representing an Item .
   */
  @Input() public gridTile: Item;
  /**
   * @Input
   * @description List of all selected items in the result-list.component.
   * This component sets directly this list.
   */
  @Input() public selectedItems: Set<string>;
  /**
   * @Input
   * @description A detailed-data-retriever object that implements
   * DetailedDataRetriever interface.
   */
  @Input() public detailedDataRetriever: DetailedDataRetriever;

  /**
   * @Input : Angular
   * @description An input to customize the resultlist behaviour
   */
  @Input() public options: ResultListOptions;

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


  /**
   * @Output
   * @description Emits the list of selected items in result-list.component.
   */
  @Output() public selectedItemsEvent: Subject<Set<string>> = new Subject<Set<string>>();

  /**
   * @Output
   * @description Emits the selected/unselected item.
   * @deprecated
   */
  @Output() public selectedItemPositionEvent: Subject<Item> = new Subject<Item>();

  /**
   * @Output
   * @description Emits the the item that it has been clicked on it.
   */
  @Output() public clickedOnItemEvent: Subject<Item> = new Subject<Item>();

  public errorImgUrl = './assets/no-view.png';

  constructor() {
    super();
  }

  public ngOnInit() { }

  // Update the list of the selected items
  public setSelectedItem() {
    super.setSelectedItem(this.gridTile.isChecked, this.gridTile.identifier, this.selectedItems);
    this.gridTile.isChecked = !this.gridTile.isChecked;
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in list mode
    this.selectedItemsEvent.next(this.selectedItems);
  }

  public determinateItem() {
    this.gridTile.isChecked = true;
    this.gridTile.isindeterminated = false;
    this.selectedItems.add(this.gridTile.identifier);
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in grid mode
    this.selectedItemsEvent.next(this.selectedItems);
  }

  public setClickedOnItem() {
    this.retrieveAdditionalInfo(this.detailedDataRetriever, this.gridTile);
    this.clickedOnItemEvent.next(this.gridTile);
  }

  public getBackgroundImage(): string {
    if (this.gridTile.thumbnailEnabled) {
      return 'url(' + this.gridTile.urlThumbnail + ')';
    } else {
      return 'url(' + this.errorImgUrl + ')';
    }
  }

  public triggerActionOnItem(event: Event, action: Action) {
    this.actionOnItemEvent.next(
      {
        action: action,
        elementidentifier: { idFieldName: this.idFieldName, idValue: this.gridTile.identifier }
      }
    );
    event.stopPropagation();
  }
}

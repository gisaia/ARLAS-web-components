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

import { Component, input, Input, Output, ViewChild } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { Subject } from 'rxjs';
import { Item } from '../model/item';
import { ItemComponent } from '../model/itemComponent';
import { ResultThumbnailComponent } from '../result-thumbnail/result-thumbnail.component';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { ThumbnailFitEnum } from '../utils/enumerations/thumbnailFitEnum';
import { Action, ElementIdentifier, ResultListOptions } from '../utils/results.utils';

@Component({
  selector: 'arlas-result-grid-tile',
  templateUrl: './result-grid-tile.component.html',
  styleUrls: ['./result-grid-tile.component.scss'],
  imports: [MatTooltip, LazyLoadImageModule, ResultThumbnailComponent]
})
export class ResultGridTileComponent extends ItemComponent {
  /**
   * @constant
   */
  public SHOW_IMAGE = marker('Click to show details');

  @ViewChild('cellTooltip', { static: true }) public cellTooltip?: MatTooltip;

  /**
   * @Input
   * @description An object representing an Item .
   */
  public gridTile = input.required<Item>();

  /**
   * @Input
   * @description How to fit the thumbnail to the tile:
   * - `height` fit the height of the thumbnail.
   * - `width` fit the width of the thumbnail.
   * - `contain` fit the wholethumbnail.
   */
   @Input() public thumbnailFit: ThumbnailFitEnum = ThumbnailFitEnum.contain;
  /**
   * @Input
   * @description List of all selected items in the result-list.component.
   * This component sets directly this list.
   */
  @Input() public selectedItems = new Set<string>();
  /**
   * @Input
   * @description A detailed-data-retriever object that implements
   * DetailedDataRetriever interface.
   */
  public detailedDataRetriever = input.required<DetailedDataRetriever>();

  /**
   * @Input : Angular
   * @description An input to customize the resultlist behaviour
   */
  @Input() public options = new ResultListOptions();

  /**
  * @Input
  * @description Name of the id field.
  */
  public idFieldName = input.required<string>();

  /**
   * @Input : Angular
   * @description Map <itemId, Set<actionIds>> : for each item, gives the list of activated actions.
  */
  @Input() public activatedActionsPerItem = new Map<string, Set<string>>();
  /**
  * @Input
  * @description Display or not big full info icon on the grid.
  */
  @Input() public  displayInfoIcon = false;

  /**
   * @Output
   * @description Emits the event of applying the specified action on the specified item.
   */
  @Output() public actionOnItemEvent = new Subject<{ action: Action; elementidentifier: ElementIdentifier; }>();

  /**
   * @Output
   * @description Emits the list of selected items in result-list.component.
   */
  @Output() public selectedItemsEvent = new Subject<Set<string>>();

  /**
   * @Output
   * @description Emits the selected/unselected item.
   * @deprecated
   */
  @Output() public selectedItemPositionEvent = new Subject<Item>();

  /**
   * @Output
   * @description Emits the the item that it has been clicked on it.
   */
  @Output() public clickedOnItemEvent = new Subject<Item>();

  public ThumbnailFitEnum = ThumbnailFitEnum;

  /**
   * Hides the cell's tooltip when the mouse is over the attachements buttons
   * @param event mouseover event
   */
  public hideCellTooltip(event: Event) {
    event.stopPropagation();
    this.cellTooltip?.hide();
  }

  /**
   * Shows the cell's tooltip when the mouse is over the tile
   */
  public showCellTooltip() {
    this.cellTooltip?.show();
  }

  // Update the list of the selected items
  public setSelectedItem() {
    super.setSelectedItem(this.gridTile().isChecked, this.gridTile().identifier, this.selectedItems);
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in list mode
    this.selectedItemsEvent.next(this.selectedItems);
  }

  public setClickedOnItem() {
    this.retrieveAdditionalInfo(this.detailedDataRetriever(), this.gridTile());
    this.clickedOnItemEvent.next(this.gridTile());
  }

  public triggerActionOnItem(action: Action) {
    this.actionOnItemEvent.next(
      {
        action: action,
        elementidentifier: { idFieldName: this.idFieldName(), idValue: this.gridTile().identifier }
      }
    );
  }
}

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
import {Component, computed, inject, input, output, viewChild} from '@angular/core';
import {Item} from '../model/item';
import {CardViewEntry} from '../model/cardViewEntry';
import {Action, ElementIdentifier, ResultListOptions} from '..//utils/results.utils';
import {ThumbnailFitEnum} from '../utils/enumerations/thumbnailFitEnum';
import {ResultThumbnailComponent} from '../result-thumbnail/result-thumbnail.component';
import {marker} from '@colsen1991/ngx-translate-extract-marker';
import {DetailedDataRetriever} from '../utils/detailed-data-retriever';
import {ItemComponent} from '../model/itemComponent';
import {FullScreenViewerService} from '../../../services/full-screen-viewer-service';
import {ResultCardItemEntriesComponent} from '../result-card-item-entries/result-card-item-entries.component';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {MatTooltip} from '@angular/material/tooltip';
import {NUMBER_FORMAT_CHAR} from '../../componentsUtils';
import {FormatNumberPipe} from '../../../pipes/format-number/format-number.pipe';

@Component({
  selector: 'arlas-resul-card-item',
  templateUrl: './result-card-item.component.html',
  imports: [ResultThumbnailComponent, ResultCardItemEntriesComponent, MatIconButton, MatIcon,
    TranslatePipe, MatTooltip, FormatNumberPipe],
  styleUrl: './result-card-item.component.scss'
})
export class ResultCardItemComponent extends ItemComponent {
  /** Input property: the item data to be displayed in the card result view */
  public rowItem = input.required<Item>();
  /** Input property: the name of the field used as item identifier */
  public idFieldName = input.required<string>();
  /** Input property: specifies how the thumbnail should fit (default: round) */
  public thumbnailFit = input<ThumbnailFitEnum>(ThumbnailFitEnum.round);
  /** Input property: result list display options */
  public options = input<ResultListOptions>(undefined);
  /** Input property: set of currently selected item identifiers */
  public selectedItems = input<Set<string>>(undefined);
  /** Input property: map of activated actions per item */
  protected activatedActionsPerItem = input<Map<string, Set<string>>>();
  /** Input property: retriever for fetching additional item details */
  protected detailedDataRetriever = input<DetailedDataRetriever>();
  /** Output event: emitted when selected items change */
  public selectedItemsEvent = output<Set<string>>();
  /** Output event: emitted when an item is clicked */
  public clickedOnItemEvent = output<Item>();
  /** Output event: emitted when an action is triggered on an item */
  public actionOnItemEvent = output<{ action: Action; elementidentifier: ElementIdentifier; }>();

  protected readonly NUMBER_FORMAT_CHAR = NUMBER_FORMAT_CHAR;


  /**
   * @constant
   */
  public HIDE_DETAILS = marker('Hide details');
  /**
   * @constant
   */
  public SHOW_DETAILS = marker('Show details');
  private parsedCardsView = computed(() => {
    const cardsView = this.rowItem().cardsView;
    const title: CardViewEntry[] = [];
    const fields: CardViewEntry[][] = [];
    if(!cardsView){
      return  { title, fields };
    }

    for (const row of cardsView) {
      const nonTitle: CardViewEntry[] = [];
      for (const entry of row) {
        if (entry.isTitle) {
          title.push(entry);
        } else {
          nonTitle.push(entry);
        }
      }
      fields.push(nonTitle);
    }
    return { title, fields };
  });
  public titleFields = computed(() => this.parsedCardsView()?.title);
  public fields = computed(() => this.parsedCardsView().fields);

  /** Reference to the thumbnail enum for use in template */
  protected readonly ThumbnailFitEnum = ThumbnailFitEnum;

  /** View child reference to the thumbnail component */
  private readonly arlasThumbnail = viewChild<ResultThumbnailComponent>('arlasThumbnail');

  /** Service for managing full screen viewer overlay */
  private readonly fullScreenService = inject(FullScreenViewerService);

  /**
   * Hides the cell's tooltip when the mouse is over the attachements buttons
   * @param event mouseover event
   */
  public hideCellTooltip(event: Event) {
    event.stopPropagation();
    this.arlasThumbnail()?.cellTooltip().hide();
  }

  /**
   * Shows the cell's tooltip when the mouse is over the tile
   */
  public showCellTooltip() {
    this.arlasThumbnail()?.cellTooltip().show();
  }

  /**
   * Toggles the selection state of the current item and emits the updated selection
   */
  public setSelectedItem() {
    super.setSelectedItem(this.rowItem().isChecked, this.rowItem().identifier, this.selectedItems());
    this.rowItem().isChecked = !this.rowItem().isChecked;
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in list mode
    this.selectedItemsEvent.emit(this.selectedItems());
  }


  public determinateItem() {
    this.rowItem().isChecked = true;
    this.rowItem().isindeterminated = false;
    this.selectedItems().add(this.rowItem().identifier);
    // Emit to the result list the fact that this checkbox has changed in order to notify the correspondant one in grid mode
    this.selectedItemsEvent.emit(this.selectedItems());
  }


  /**
   * Retrieves additional item details and emits item click event
   */
  public setClickedOnItem() {
    this.retrieveAdditionalInfo(this.detailedDataRetriever(), this.rowItem());
    this.clickedOnItemEvent.emit(this.rowItem());
  }

  /**
   * Triggers an action on the item and emits the action event with item identifier
   * @param action the action to trigger on the item
   */
  public triggerActionOnItem(action: Action) {
    this.actionOnItemEvent.emit({
      action: action, elementidentifier: {idFieldName: this.idFieldName(), idValue: this.rowItem().identifier}
    });
  }

  /**
   * Creates and shows an overlay for full screen image viewer
   * @param image the image URL or ArrayBuffer to display
   */
  public createOverlay(image: string | ArrayBuffer) {
    this.fullScreenService
      .initOverlay()
      .destroyElementOnClose()
      .subscribe();
    this.showOverlay(image);
  }

  /**
   * Displays the image in full screen mode with a slight delay to ensure DOM is ready
   * @param image the image URL or ArrayBuffer to display in full screen
   */
  public showOverlay(image: string | ArrayBuffer) {
    setTimeout(() => {
      try {
        this.fullScreenService.showFullScreen(image);
      } catch (e) {
        console.warn('Failed to open full screen');
      }
    }, 0);
  }

  protected toggleDetail() {
    if (this.rowItem().isDetailToggled === false) {
      this.retrieveAdditionalInfo(this.detailedDataRetriever(), this.rowItem());
    }

    this.rowItem().isDetailToggled = !this.rowItem().isDetailToggled;
  }

}

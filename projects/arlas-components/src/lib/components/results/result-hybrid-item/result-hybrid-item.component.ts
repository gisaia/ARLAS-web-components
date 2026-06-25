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
import {Component, computed, inject, input, OnDestroy, output, viewChild} from '@angular/core';
import {Item} from '../model/item';
import {Action, ElementIdentifier, ResultListOptions} from '..//utils/results.utils';
import {ThumbnailFitEnum} from '../utils/enumerations/thumbnailFitEnum';
import {ResultThumbnailComponent} from '../result-thumbnail/result-thumbnail.component';
import {marker} from '@colsen1991/ngx-translate-extract-marker';
import {DetailedDataRetriever} from '../utils/detailed-data-retriever';
import {ItemComponent} from '../model/itemComponent';
import {FullScreenViewerService} from '../../../services/full-screen-viewer-service';
import {ResultMetadataEntriesComponent} from '../result-metadata-entries/result-metadata-entries.component';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'arlas-result-hybrid-item',
  templateUrl: './result-hybrid-item.component.html',
  imports: [
    ResultThumbnailComponent,
    ResultMetadataEntriesComponent,
    MatIconButton,
    MatIcon,
    TranslatePipe,
    MatTooltip
  ],
  styleUrl: './result-hybrid-item.component.scss'
})
export class ResultHybridItemComponent extends ItemComponent implements OnDestroy  {
  /** Input property: the item data to be displayed in the hybrid result view */
  public rowItem = input<Item>();
  /** Output event: emitted when selected items change */
  public selectedItemsEvent = output<Set<string>>();
  /** Output event: emitted when an item is clicked */
  public clickedOnItemEvent = output<Item>();
  /** Output event: emitted when an action is triggered on an item */
  public actionOnItemEvent = output<{ action: Action; elementidentifier: ElementIdentifier; }>();
  /** Input property: specifies how the thumbnail should fit (default: round) */
  public thumbnailFit = input<ThumbnailFitEnum>(ThumbnailFitEnum.round);
  /** Input property: the name of the field used as item identifier */
  public idFieldName = input('');
  /** Input property: map of activated actions per item */
  protected activatedActionsPerItem = input<Map<string, Set<string>>>();
  /** Input property: retriever for fetching additional item details */
  protected detailedDataRetriever = input<DetailedDataRetriever>();
  /** Input property: result list display options */
  public options = input<ResultListOptions>(undefined);
  /** Input property: set of currently selected item identifiers */
  public selectedItems = input<Set<string>>(undefined);
  /** Translation marker for full screen view action */
  public VIEW_IMAGE = marker('View in full screen');
  /**
   * @constant
   */
  public HIDE_DETAILS = marker('Hide details');
  /**
   * @constant
   */
  public SHOW_DETAILS = marker('Show details');

  public titleField = computed(() => {
   const field = this.rowItem().hybridMetadata.at(0);
   return field ? field : null;
  });

  public fields = computed(() => this.titleField() ? this.rowItem().hybridMetadata.slice(1) : this.rowItem().hybridMetadata);

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
    this.actionOnItemEvent.emit(
      {
        action: action,
        elementidentifier: { idFieldName: this.idFieldName(), idValue: this.rowItem().identifier }
      }
    );
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
  public showOverlay(image: string | ArrayBuffer){
    setTimeout(() => {
      try {
        this.fullScreenService.showFullScreen(image);
      } catch (e) {
        console.warn('Failed to open full screen');
      }
    }, 0);
  }

  /**
   * Lifecycle hook: cleans up the full screen viewer service on component destruction
   */
  public ngOnDestroy(): void {
    this.fullScreenService.destroy();
    this.rowItem().isDetailToggled = false;
  }

  protected toggleDetail() {
   // const rev
    if (this.rowItem().isDetailToggled === false) {
      this.retrieveAdditionalInfo(this.detailedDataRetriever(), this.rowItem());
    }

    this.rowItem().isDetailToggled = !this.rowItem().isDetailToggled;
  }
}

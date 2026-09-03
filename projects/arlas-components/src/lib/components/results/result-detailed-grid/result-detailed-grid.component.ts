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

import {
  ChangeDetectorRef, Component, ElementRef, inject, input,
  Input, linkedSignal, OnChanges, OnDestroy, output, Output, signal, SimpleChanges, viewChild, ViewChild
} from '@angular/core';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { FullScreenViewerService } from '../../../services/full-screen-viewer-service';
import { Item } from '../model/item';
import { ItemDetailToggleEvent, ResultDetailedItemComponent } from '../result-detailed-item/result-detailed-item.component';
import { ResultQuicklookActionsComponent } from '../result-quicklook-actions/result-quicklook-actions.component';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Action, ElementIdentifier } from '../utils/results.utils';

@Component({
  selector: 'arlas-result-detailed-grid',
  templateUrl: './result-detailed-grid.component.html',
  styleUrls: ['./result-detailed-grid.component.scss'],
  imports: [
    MatProgressSpinner, MatTooltip, MatIcon, MatMiniFabButton, ResultDetailedItemComponent, TranslatePipe, ResultQuicklookActionsComponent
  ]
})
export class ResultDetailedGridComponent implements OnChanges, OnDestroy {
  /**
   * @constant
   */
  public SHOW_DETAILS = marker('Show details');
  /**
   * @constant
   */
  public VIEW_IMAGE = marker('View in full screen');
  /**
s   * @constant
   */
  public SHOW_IMAGE = marker('Show image');
  /**
   * @constant
   */
  public CLOSE_DETAILS = marker('Close details');

  /**
   * @Input
   * @description An object representing an Item and that contains the detailed data.
   */
  public gridTile = input.required<Item>();
  /**
   * @Input
   * @description Width of the detailed grid.
   */
  public detailWidth = input.required<number>();
  /**
   * @Input
   * @description Height of the detailed grid.
   */
  public detailHeight = input.required<number>();
  /**
   * @Input
   * @description Name of the id field.
   */
  public idFieldName = input.required<string>();
  /**
   * @Input
   * @description Whether the detail is visible.
   */
  @Input() public isDetailShowed = false;
  /**
   * @Input
   * @description Whether display group with no detail.
   */
  @Input() public showEmptyGroup = false;

  /**
   * @Input : Angular
   * @description Whether to use a http request to query detailed image instead of relying on img tag internal mechanism.
   */
  @Input() public useHttp = false;

  /**
   * @Input : Angular
   * @description List of active actions per item.
  */
  @Input() public activatedActionsPerItem: Map<string, Set<string>> = new Map<string, Set<string>>();

  /**
  * @Input
  * @description A detailed-data-retriever object that implements
  * DetailedDataRetriever interface.
  */
  public detailedDataRetriever = input.required<DetailedDataRetriever>();

  /**
   * @Input
   * @description Default img
   */
  public noViewImg = input<string>('assets/no-view.png');

  /**
   * @Output
   * @description Emits the event of applying the specified action on the specified item.
   */

  @Output() public actionOnItemEvent = new Subject<{ action: Action; elementidentifier: ElementIdentifier; }>();
  /**
 * @Output
 * @description Emits the event of closing details.
 */
  @Output() public closeDetail: Subject<boolean> = new Subject();

  /**
   * Emits an event every time the detail of an item is displayed/hidden.
   * Transmits the event from the arlas-result-detailed-item component
   */
  public itemDetailToggleEvent = output<ItemDetailToggleEvent>();

  @ViewChild('image_detail', { static: false }) public imageViewer?: ElementRef;

  public quicklookActions = viewChild<ResultQuicklookActionsComponent>('quicklookActions');

  public isDetailedDataShowed = false;

  /**
   * @description The image source to display. Either is an url or the content of the image.
   */
  public imgSrc: string | undefined;

  /**
   * @description Whether the request for the image is being processed
   */
  public isLoading = signal(false);

  /**
   * @description In the case of multiple images, indicates which one is selected.
   * Since the logic is handled by the ResultQuicklookActionsComponent, default value is the component's value
   */
  public currentImageIndex = linkedSignal(() => this.quicklookActions()?.currentImageIndex() ?? 0);

  private readonly fullScreenService = inject(FullScreenViewerService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  public ngOnDestroy(): void {
    this.destroyViewer(true);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['gridTile']) {
      this.fullScreenService.destroy();
      this.currentImageIndex.set(0);
      this.getImage();
    }
  }

  /**
   * Gets the content of the image to render in the html
   * @param imgURL URL of the image to visualize
   */
  protected getImage(imgURL?: string) {
    this.imgSrc = undefined;
    if (!this.gridTile().urlImages || this.gridTile().urlImages.length === 0) {
      return;
    }
    imgURL ??= this.gridTile().urlImages[0];

    this.isLoading.set(true);
    this.fullScreenService.getImageSrc(imgURL, this.useHttp)
      .subscribe(imgSrc => {
        this.isLoading.set(false);

        if (imgSrc) {
          this.imgSrc = imgSrc;
          this.gridTile().imageEnabled = true;
          this.fullScreenService.updateViewer(this.imgSrc);
        }
      });
  }

  public destroyViewer(isComponentDestroy?: boolean): void {
    if (isComponentDestroy && this.fullScreenService.hasViewer()) {
      this.fullScreenService.destroy();
    }
    // Add a delay to allow for the viewer to be destroyed properly
    // before removing it due to visibility rules in the template
    setTimeout(() => {
      this.imgSrc = undefined;
    }, 0);
  }

  public showHideDetailedData() {
    this.isDetailedDataShowed = !this.isDetailedDataShowed;
    this.changeDetectorRef.detectChanges();
    this.fullScreenService.updateViewer(this.imgSrc as string);
  }

  public closeDetailedData() {
    this.isDetailShowed = false;
    this.closeDetail.next(true);
  }

  /**
   * Emits the action on this ResultDetailedItem to the parent (ResultList)
   */
  public triggerActionOnItem(actionOnItem: { action: Action; elementidentifier: ElementIdentifier; }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

  public showOverlay() {
    this.fullScreenService
      .initOverlay(this.gridTile(), this.imgSrc as string, this.useHttp, this.noViewImg(), this.currentImageIndex())
      ?.destroyElementOnClose()
      .subscribe();
  }
}

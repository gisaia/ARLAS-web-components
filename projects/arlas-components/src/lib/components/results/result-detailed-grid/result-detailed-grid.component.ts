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

import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef, Component, ElementRef, inject, input,
  Input, OnChanges, OnDestroy, output, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { ImageViewer } from 'iv-viewer';
import { Subject, tap } from 'rxjs';
import { FullScreenViewerService } from '../../../services/full-screen-viewer-service';
import { Item } from '../model/item';
import { ItemDetailToggleEvent, ResultDetailedItemComponent } from '../result-detailed-item/result-detailed-item.component';
import { AvailableProcess } from '../utils/aias-process';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { Action, ElementIdentifier, PROTECTED_REQUEST_HEADER } from '../utils/results.utils';

@Component({
    selector: 'arlas-result-detailed-grid',
    templateUrl: './result-detailed-grid.component.html',
    styleUrls: ['./result-detailed-grid.component.scss'],
    imports: [MatProgressSpinner, MatIconButton, MatTooltip, MatIcon, MatMiniFabButton, ResultDetailedItemComponent, TranslatePipe]
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

  /** List of processes to not display in the Task summary */
  public ignoredProcesses = input<Set<AvailableProcess>>(new Set());

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


  public isDetailedDataShowed = false;

  /**
   * @description The image source to display. Either is an url or the content of the image.
   */
  public imgSrc: string | undefined;

  /**
   * @description Whether the request for the image is being processed
   */
  public isLoading = false;

  /**
   * @description In the case of multiple images, indicates which one is selected
   */
  public currentImageIndex = 0;

  /**
   * @description Whether the viewer is in full screen mode
   */
  public isFullScreen = false;

  private viewer?: ImageViewer;

  /**
   * Full screen
   */
  private readonly fullScreenService = inject(FullScreenViewerService);

  public constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly http: HttpClient
  ) { }

  public ngOnDestroy(): void {
    this.destroyViewer(true);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['gridTile']) {
      this.resetViewer();
      this.isFullScreen = false;
      this.currentImageIndex = 0;
      this.getImage();
    }
  }

  private getImage() {
    this.imgSrc = undefined;
    if (!this.gridTile().urlImages || this.gridTile().urlImages.length === 0) {
      return;
    }

    if (this.useHttp) {
      this.isLoading = true;
      this.http.get(this.gridTile().urlImages[this.currentImageIndex], { headers: { [PROTECTED_REQUEST_HEADER]: 'true' }, responseType: 'blob' })
        .subscribe({
          next: (image: Blob) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              this.imgSrc = reader.result?.toString();
              this.gridTile().imageEnabled = true;
              this.isLoading = false;
              this.updateViewer();
            }, false);
            if (image) {
              reader.readAsDataURL(image);
            }
          }, error: (err) => {
            console.error(err);
            this.isLoading = false;
          }
        });
    } else {
      this.imgSrc = this.gridTile().urlImages[this.currentImageIndex];
      this.gridTile().imageEnabled = true;
      this.updateViewer();
    }
  }

  private updateViewer() {
    this.resetViewer();
    setTimeout(() => {
      if (this.isFullScreen) {
        try {
          this.fullScreenService.showFullScreen(this.imgSrc as string);
        } catch {
          console.warn('Failed to open full screen');
        }
      } else {
        if (!!this.imageViewer && !this.viewer) {
          this.viewer = new ImageViewer(this.imageViewer.nativeElement);
        }
      }
    }, 0);
  }

  public destroyViewer(isComponentDestroy?: boolean): void {
    this.resetViewer();
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
    this.updateViewer();
  }

  public closeDetailedData() {
    this.isDetailShowed = false;
    this.closeDetail.next(true);
  }

  // Emits the action on this ResultDetailedItem to the parent (ResultList)
  public triggerActionOnItem(actionOnItem: { action: Action; elementidentifier: ElementIdentifier; }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

  public showOverlay() {
    this.isFullScreen = true;
    this.resetViewer();
    this.fullScreenService
      .initOverlay()
      ?.destroyElementOnClose()
      .pipe(tap(() =>  {
        this.isFullScreen = false;
        this.resetViewer();
      }))
      .subscribe();
  }

  public onPrevious() {
    this.currentImageIndex -= 1;
    if (this.currentImageIndex < 0) {
      this.currentImageIndex = this.gridTile().urlImages.length - 1;
    }
    this.getImage();
  }

  public onNext() {
    this.currentImageIndex += 1;
    if (this.currentImageIndex >= this.gridTile().urlImages.length) {
      this.currentImageIndex = 0;
    }
    this.getImage();
  }

  private resetViewer() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = undefined;
    }
  }
}

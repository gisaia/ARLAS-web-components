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
  ChangeDetectorRef, Component,
  ElementRef, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { FullScreenViewer, ImageViewer } from 'iv-viewer';
import { Subject, take } from 'rxjs';
import { Item } from '../model/item';
import { Action, ElementIdentifier } from '../utils/results.utils';
import { HttpClient } from '@angular/common/http';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
  selector: 'arlas-result-detailed-grid',
  templateUrl: './result-detailed-grid.component.html',
  styleUrls: ['./result-detailed-grid.component.scss']
})
export class ResultDetailedGridComponent implements OnChanges, OnDestroy {
  public SHOW_DETAILS = 'Show details';
  public VIEW_IMAGE = 'View quicklook';
  public SHOW_IMAGE = 'Show image';
  public CLOSE_DETAILS = marker('Close details');
  private fullScreenViewer = new FullScreenViewer();
  private noViewImg = './assets/no-view.png';

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
   * @Output
   * @description Emits the event of applying the specified action on the specified item.
   */

  @Output() public actionOnItemEvent: Subject<{ action: Action; elementidentifier: ElementIdentifier; }> =
    new Subject<{ action: Action; elementidentifier: ElementIdentifier; }>();
  /**
 * @Output
 * @description Emits the event of closing details.
 */
  @Output() public closeDetail: Subject<boolean> = new Subject();

  @ViewChild('image_detail', { static: false }) public imageViewer: ElementRef;


  public isDetailedDataShowed = false;

  /**
   * @description The image source to display. Either is an url or the content of the image.
   */
  public imgSrc: string | ArrayBuffer;

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

  private viewer;

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient
  ) { }

  public ngOnDestroy(): void {
    this.destroyViewer(true);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['gridTile']) {
      if (this.viewer) {
        this.viewer = this.viewer.destroy();
      }
      this.isFullScreen = false;
      this.currentImageIndex = 0;
      this.getImage();
    }
  }

  private getImage() {
    this.imgSrc = undefined;
    if (!this.gridTile || (this.gridTile && (!this.gridTile.urlImages || this.gridTile.urlImages.length === 0))) {
      return;
    }

    if (this.useHttp) {
      this.isLoading = true;
      this.http.get(this.gridTile.urlImages[this.currentImageIndex], { responseType: 'blob' })
        .pipe(take(1))
        .subscribe({
          next: (image: Blob) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              this.imgSrc = reader.result;
              this.gridTile.imageEnabled = true;
              this.isLoading = false;
              this.resetViewer();
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
      this.imgSrc = this.gridTile.urlImages[this.currentImageIndex];
      this.gridTile.imageEnabled = true;
      this.resetViewer();
    }
  }

  private resetViewer() {
    if (this.viewer) {
      this.viewer = this.viewer.destroy();
    }
    setTimeout(() => {
      if (this.isFullScreen) {
        this.fullScreenViewer.show(this.imgSrc);
      } else {
        if (!!this.imageViewer && !this.viewer) {
          this.viewer = new ImageViewer(this.imageViewer.nativeElement);
        }
      }
    }, 0);
  }

  public destroyViewer(isComponentDestroy?: boolean): void {
    if (this.viewer) {
      this.viewer = this.viewer.destroy();
    }
    if (isComponentDestroy && this.fullScreenViewer) {
      this.fullScreenViewer.destroy();
    }
    // Add a delay to allow for the viewer to be destroyed properly
    // before removing it due to visibility rules in the template
    setTimeout(() => {
      this.imgSrc = undefined;
      if (this.gridTile) {
        this.gridTile.imageEnabled = false;
      }
    }, 0);
  }


  public showHideDetailedData() {
    this.isDetailedDataShowed = !this.isDetailedDataShowed;
    this.changeDetectorRef.detectChanges();
    this.resetViewer();
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

    let viewerContainer: HTMLElement | undefined;
    const fullScreenContainer = document.querySelector('.iv-fullscreen-container');

    const actionsInfos = document.getElementsByClassName('viewer_actions-infos');
    if (actionsInfos) {
      viewerContainer = actionsInfos[0].parentElement;
      const elements = actionsInfos.length;
      for (let i = 0; i < elements; i++) {
        // The element is removed from the list once retrieved
        fullScreenContainer.appendChild(actionsInfos.item(0));
      }
    }

    document.querySelector('.iv-fullscreen-close').addEventListener('click', () => {
      this.isFullScreen = false;
      if (viewerContainer) {
        const actionsInfosFullScreen = fullScreenContainer.getElementsByClassName('viewer_actions-infos');
        const elements = actionsInfosFullScreen.length;
        for (let i = 0; i < elements; i++) {
          // The element is removed from the list once retrieved
          viewerContainer.appendChild(actionsInfosFullScreen.item(0));
        }
      }
      this.resetViewer();
    });
  }

  public onPrevious() {
    this.currentImageIndex -= 1;
    if (this.currentImageIndex < 0) {
      this.currentImageIndex = this.gridTile.urlImages.length - 1;
    }
    this.getImage();
  }

  public onNext() {
    this.currentImageIndex += 1;
    if (this.currentImageIndex >= this.gridTile.urlImages.length) {
      this.currentImageIndex = 0;
    }
    this.getImage();
  }
}

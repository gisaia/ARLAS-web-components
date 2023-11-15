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

import { AfterViewInit, ChangeDetectorRef, Component,
  ElementRef, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FullScreenViewer, ImageViewer } from 'iv-viewer';
import { Subject, take } from 'rxjs';
import { Item } from '../model/item';
import { Action, ElementIdentifier, QUICKLOOK_HEADER } from '../utils/results.utils';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'arlas-result-detailed-grid',
  templateUrl: './result-detailed-grid.component.html',
  styleUrls: ['./result-detailed-grid.component.css']
})
export class ResultDetailedGridComponent implements OnInit, OnChanges {
  public SHOW_DETAILS = 'Show details';
  public VIEW_IMAGE = 'View quicklook';
  public SHOW_IMAGE = 'Show image';
  public CLOSE_DETAILS = 'Close details';
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

  @ViewChild('image_detail', { static: false}) public imageViewer: ElementRef;


  public isDetailedDataShowed = false;

  public imgSrc: string | ArrayBuffer;

  public isLoading = false;

  private viewer;

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient
  ) { }

  public ngOnInit() {
    this.getImage();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['gridTile']) {
      if (this.viewer) {
        this.viewer = this.viewer.destroy();
      }
      this.getImage();
    }
  }

  private getImage() {
    this.imgSrc = undefined;
    if (!this.gridTile || (this.gridTile && !this.gridTile.urlImage)) {
      return;
    }

    if (this.useHttp) {
      this.isLoading = true;
      this.http.get(this.gridTile.urlImage, {headers: {[QUICKLOOK_HEADER]: 'true'}, responseType: 'blob'})
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
      this.imgSrc = this.gridTile.urlImage;
      this.resetViewer();
    }
  }

  private resetViewer() {
    setTimeout(() => {
      if (!!this.imageViewer && !this.viewer) {
        this.viewer = new ImageViewer(this.imageViewer.nativeElement);
      }
    }, 0);
  }

  public destroyViewer(event): void {
    this.imgSrc = this.noViewImg;
    if (this.viewer) {
      this.viewer = this.viewer.destroy();
    }
    this.gridTile.imageEnabled = false;
  }

  public showHideDetailedData() {
    this.isDetailedDataShowed = !this.isDetailedDataShowed;
    this.changeDetectorRef.detectChanges();
    if (this.viewer) {
      this.viewer = this.viewer.destroy();
    }
    setTimeout(() => {
      if (!!this.imageViewer) {
        this.viewer = new ImageViewer(this.imageViewer.nativeElement);
      }
    }, 0);
  }

  public closeDetailedData() {
    this.isDetailShowed = false;
    this.closeDetail.next(true);
  }

  // Emits the action on this ResultDetailedItem to the parent (ResultList)
  public triggerActionOnItem(actionOnItem: { action: Action; elementidentifier: ElementIdentifier; }): void {
    this.actionOnItemEvent.next(actionOnItem);
  }

  public showOverlay(url) {
    this.fullScreenViewer.show(url);
  }
}

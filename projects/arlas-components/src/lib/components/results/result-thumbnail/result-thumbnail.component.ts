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

import { Component, input, output, signal, viewChild } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { Item } from '../model/item';
import { ResultActionsComponent } from '../result-actions/result-actions.component';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { ThumbnailFitEnum } from '../utils/enumerations/thumbnailFitEnum';
import { Action } from '../utils/results.utils';

@Component({
  selector: 'arlas-result-thumbnail',
  imports: [
    TranslatePipe,
    MatTooltip,
    MatIcon,
    LazyLoadImageModule,
    ResultActionsComponent,
    MatIconButton
  ],
  templateUrl: './result-thumbnail.component.html',
  styleUrl: './result-thumbnail.component.scss'
})
export class ResultThumbnailComponent {

  /** Input property (required): the grid tile item data to display */
  public gridTile = input.required<Item>();
  /** Input property: default image URL to display if item image is unavailable */
  public defaultImgUrl = input<string>('./assets/no-view.png');
  /** Input property: determines if action buttons are shown on hover */
  public showActionsOnHover = input<boolean>(false);
  /** Input property: map of activated actions per item */
  protected activatedActionsPerItem = input<Map<string, Set<string>>>(new Map());
  /** Input property: retriever for fetching additional item details */
  protected detailedDataRetriever = input.required<DetailedDataRetriever>();
  /** Input property: specifies how the thumbnail image should fit (default: contain) */
  protected thumbnailFit = input<ThumbnailFitEnum>(ThumbnailFitEnum.contain);

  public cellTooltip = viewChild<MatTooltip>('cellTooltip');
  /** Input property: tooltip text for the picture/thumbnail */
  protected readonly pictureTooltip = input<string>('');

  /** Signal: tracks whether to display the info icon */
  protected readonly displayInfoIcon = signal<boolean>(false);
  /** Reference to the ThumbnailFitEnum for use in template */
  protected readonly ThumbnailFitEnum = ThumbnailFitEnum;
  /** Output event: emitted when an action is clicked */
  protected actionClickEvent = output<Action>();
  /** Output event: emitted when focus action occurs */
  protected focusActionEvent = output<FocusEvent>();
  /** Output event: emitted when the image is clicked */
  public imageClicked = output<void>();
  /** Output event: emitted when the image is hovered */
  public imageHovered = output<void>();

  public selectDeterminateItem = output<void>();

  public setSelectedItemEvent = output<void>();
  /** Output event: emitted when full screen view is requested, contains image data */
  public openFullScreen = output<string | ArrayBuffer>();

  /**
   * Emits the image click event when the thumbnail is clicked
   */
  protected setClickedOnItem() {
    this.imageClicked.emit();
  }

  /**
   * Emits the image hover event when the thumbnail is hovered
   */
  protected hoverImage() {
    this.imageHovered.emit();
  }

  /**
   * Forwards the action event to parent component when an action is triggered
   * @param $event the action that was triggered
   */
  protected triggerActionOnItem($event: Action) {
    this.actionClickEvent.emit($event);
  }

  /**
   * Forwards the focus event to parent component when cell focus changes
   * @param $event the focus event
   */
  protected hideCellTooltip($event: FocusEvent) {
    this.focusActionEvent.emit($event);
  }

  protected determinateItem() {
    this.selectDeterminateItem.emit();
  }

  protected setSelectedItem() {
    this.setSelectedItemEvent.emit();
  }

  /**
   * Emits the full screen request event with the image data
   * Prevents event propagation to stop triggering parent click handlers
   * @param clickEv the click event to stop propagation
   * @param images array of image sources; the first one will be displayed
   */
  protected fullScreen(clickEv: Event, images: string[]) {
    clickEv.stopPropagation();
    this.openFullScreen.emit(images.at(0) ?? '');
  }
}

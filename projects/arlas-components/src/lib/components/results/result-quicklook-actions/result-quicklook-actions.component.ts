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

import { Component, input, linkedSignal, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { Item } from '../model/item';

/**
 * Handles the display of the description of the selected quicklook,
 * as well as actions to navigate between an item's quicklooks
 */
@Component({
  selector: 'arlas-result-quicklook-actions',
  imports: [
    MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe
  ],
  templateUrl: './result-quicklook-actions.component.html',
  styleUrl: './result-quicklook-actions.component.scss',
})
export class ResultQuicklookActionsComponent {
  public gridTile = input.required<Item>();

  public initialImageIndex = input<number>(0);

  public currentImageIndex = linkedSignal(() => this.initialImageIndex());

  public urlToVisualize = output<string>();

  /**
   * Emits the URL of the next image to visualize
   */
  public onNext() {
    this.currentImageIndex.update(v => {
      v += 1;
      if (v >= this.gridTile().urlImages.length) {
        v = 0;
      }
      return v;
    });

    this.urlToVisualize.emit(this.gridTile().urlImages[this.currentImageIndex()]);
  }

  /**
   * Emits the URL of the previous image to visualize
   */
  public onPrevious() {
    this.currentImageIndex.update(v => {
      v -= 1;
      if (v < 0) {
        v = this.gridTile().urlImages.length - 1;
      }
      return v;
    });

    this.urlToVisualize.emit(this.gridTile().urlImages[this.currentImageIndex()]);
  }
}

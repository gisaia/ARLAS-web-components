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

import {Injectable} from '@angular/core';
import {fromEvent} from 'rxjs';
import {FullScreenViewer} from 'iv-viewer';

@Injectable({
  providedIn: 'root'
})
export class FullScreenViewerService {
  /** The full screen viewer instance from the iv-viewer library */
  private fullScreenViewer: FullScreenViewer = new FullScreenViewer();
  /** The original container element where viewer actions are placed */
  private viewerContainer: HTMLElement | undefined;
  /** The full screen container element where actions are moved during full screen mode */
  private fullScreenContainer: Element;
  /** The close button element for the full screen viewer */
  private closeIcon: Element;
  /** CSS selector for the full screen close icon */
  private closeIconSelector = '.iv-fullscreen-close';

  /**
   * Initializes the full screen overlay by querying and moving viewer action elements
   * to the full screen container for display during full screen mode
   * @returns this service instance for method chaining
   */
  public showOverlay() {
    this.fullScreenContainer = document.querySelector('.iv-fullscreen-container');
    this.closeIcon = document.querySelector(this.closeIconSelector);

    const actionsInfos = document.getElementsByClassName('viewer_actions-infos');
    if (!!actionsInfos && !!actionsInfos[0]) {
      this.viewerContainer = actionsInfos[0].parentElement;
      const elements = actionsInfos.length;
      for (let i = 0; i < elements; i++) {
        // The element is removed from the list once retrieved
        this.fullScreenContainer.appendChild(actionsInfos.item(0));
      }
    }

    return this;
  }

  /**
   * Sets up a listener on the close icon to restore viewer action elements back to the original container
   * when the full screen view is closed
   * @returns an observable that emits when the close icon is clicked
   */
  public destroyElementOnClose() {
    return fromEvent(this.closeIcon, 'click', () => {
      if (this.viewerContainer) {
        const actionsInfosFullScreen = this.fullScreenContainer.getElementsByClassName('viewer_actions-infos');
        const elements = actionsInfosFullScreen.length;
        for (let i = 0; i < elements; i++) {
          // The element is removed from the list once retrieved
          this.viewerContainer.appendChild(actionsInfosFullScreen.item(0));
        }
      }
    });
  }

  /**
   * Displays the provided image in full screen mode
   * @param imgSrc the image URL or ArrayBuffer to display
   */
  public showFullScreen(imgSrc: string | ArrayBuffer) {
    this.fullScreenViewer.show(imgSrc);
  }

  /**
   * Destroys the full screen viewer instance and cleans up resources
   */
  public destroy(){
    if(this.fullScreenViewer){
      this.fullScreenViewer.destroy();
    }
  }

  /**
   * Checks if the full screen viewer instance exists
   * @returns the full screen viewer instance if it exists, undefined otherwise
   */
  public hasViewer(){
    return this.fullScreenViewer;
  }
}

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
import { ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable, inputBinding, outputBinding } from '@angular/core';
import { FullScreenViewer } from 'iv-viewer';
import { EMPTY, fromEvent, of, Subject } from 'rxjs';
import { Item } from '../components/results/model/item';
import { ResultQuicklookActionsComponent } from '../components/results/result-quicklook-actions/result-quicklook-actions.component';
import { PROTECTED_REQUEST_HEADER } from '../components/results/utils/results.utils';

@Injectable({
  providedIn: 'root'
})
export class FullScreenViewerService {
  /** The full screen viewer instance from the iv-viewer library */
  private fullScreenViewer: FullScreenViewer | undefined;
  /** The full screen container element where actions are moved during full screen mode */
  private fullScreenContainer: Element | null = null;
  /** The close button element for the full screen viewer */
  private closeIcon: Element | null = null;
  /** CSS selector for the full screen close icon */
  private readonly closeIconSelector = '.iv-fullscreen-close';

  private readonly injector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);
  private readonly http = inject(HttpClient);

  /**
   * Initializes the full screen overlay by querying and moving viewer action elements
   * to the full screen container for display during full screen mode.
   * Also adds the description and arrows to navigate between the item's possible quicklooks
   * @returns this service instance for method chaining
   */
  public initOverlay(item: Item, imgURL: string, useHttp: boolean, noViewImg: string, initialImageIndex = 0) {
    this.destroy();

    this.fullScreenViewer = new FullScreenViewer();
    this.fullScreenContainer = document.querySelector('.iv-fullscreen-container');
    this.closeIcon = document.querySelector(this.closeIconSelector);

    if (!this.fullScreenContainer) {
      console.warn('No full screen container found');
      return;
    }

    this.getImageSrc(imgURL, useHttp)
      .subscribe(imgSrc => {
        this.showFullScreen(imgSrc ?? noViewImg);
      });

    const actionContainer = document.createElement('quicklook-actions');

    // Create the component and bind in one call
    const ref = createComponent(ResultQuicklookActionsComponent, {
      environmentInjector: this.injector,
      hostElement: actionContainer,
      bindings: [
        inputBinding('gridTile', () => item),
        inputBinding('initialImageIndex', () => initialImageIndex),
        outputBinding('urlToVisualize', (imgURL) => {
          this.getImageSrc(imgURL as string, useHttp)
            .subscribe(imgSrc => {
              this.showFullScreen(imgSrc ?? noViewImg);
            });
        }),
      ],
    });

    // Registers the component’s view so it participates in change detection cycle.
    this.appRef.attachView(ref.hostView);

    this.fullScreenContainer?.appendChild(actionContainer);

    return this;
  }

  public updateViewer(imgSrc: string | ArrayBuffer) {
    this.destroy();
    setTimeout(() => {
      if (this.fullScreenViewer) {
        this.showFullScreen(imgSrc);
      } else if (this.fullScreenContainer) {
        this.fullScreenViewer = new FullScreenViewer();
      }
    }, 0);
  }

  /**
   * Sets up a listener on the close icon to restore viewer action elements back to the original container
   * when the full screen view is closed
   * @returns an observable that emits when the close icon is clicked
   */
  public destroyElementOnClose() {
    if (!this.closeIcon) {
      return EMPTY;
    }

    return fromEvent(this.closeIcon, 'click', () => {
      this.destroy();
    });
  }

  /**
   * Displays the provided image in full screen mode
   * @param imgSrc the image URL or ArrayBuffer to display
   */
  public showFullScreen(imgSrc: string | ArrayBuffer) {
    try {
      if (!imgSrc) {
        console.warn('Invalid image source provided');
        return;
      }
      this.fullScreenViewer?.show(imgSrc as string);
    } catch (e) {
      console.warn(e);
      console.warn('Failed to open full screen');
    }
  }

  /**
   * Destroys the full screen viewer instance and cleans up resources
   */
  public destroy() {
    if (this.fullScreenViewer) {
      try {
        this.fullScreenViewer.destroy();
      } catch { }
    }
    this.fullScreenViewer = undefined;

    // Remove node created by the iv-viewer
    const viewers = document.getElementsByClassName('iv-fullscreen');
    for (let i = 0; i < viewers.length; i++) {
      viewers.item(i)?.remove();
    }
  }

  /**
   * Checks if the full screen viewer instance exists
   * @returns the full screen viewer instance if it exists, undefined otherwise
   */
  public hasViewer() {
    return !!this.fullScreenViewer;
  }

  /**
   * Fetches the image given with the necessary headers if configured to do so
   * @param imgURL
   * @param useHttp
   */
  public getImageSrc(imgURL: string, useHttp: boolean) {
    if (useHttp) {
      const imgSrc$ = new Subject<string | undefined>();

      this.http.get(imgURL, { headers: { [PROTECTED_REQUEST_HEADER]: 'true' }, responseType: 'blob' })
        .subscribe({
          next: (image: Blob) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              imgSrc$.next(reader.result?.toString());
            }, false);
            if (image) {
              reader.readAsDataURL(image);
            }
          }, error: (err) => {
            console.error(err);
            imgSrc$.next(undefined);
          }
        });
      return imgSrc$.asObservable();
    } else {
      return of(imgURL);
    }
  }
}

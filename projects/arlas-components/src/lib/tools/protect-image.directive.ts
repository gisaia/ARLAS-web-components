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
import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { map } from 'rxjs';
import { PROTECTED_IMAGE_HEADER } from '../components/results/utils/results.utils';

/**
 * Directive to fetch an image while adding authorisation headers
 */
@Directive({
  selector: 'img[arlasProtectImage]',
  standalone: true
})
export class ProtectImageDirective {
  private readonly http = inject(HttpClient);
  private readonly imgElement: HTMLImageElement = inject(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  /**
   * Src of the image to load
   */
  public arlasProtectImage = input.required<string>();

  public constructor() {
    effect(() => {
      this.http.get(this.arlasProtectImage(), { headers: { [PROTECTED_IMAGE_HEADER]: 'true' }, responseType: 'blob' })
        .pipe(map(blob => URL.createObjectURL(blob)))
        .subscribe(r => {
          this.renderer.setAttribute(this.imgElement, 'src', r);
        });
    });
  }

}

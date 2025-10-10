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

import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ShortenNumberModule } from '../../../pipes/shorten-number/shorten-number.module';
import { ProtectImageDirective } from '../../../tools/protect-image.directive';

@Component({
  selector: 'arlas-cog-legend',
  standalone: true,
  imports: [
    ShortenNumberModule,
    TranslateModule,
    ProtectImageDirective
  ],
  templateUrl: './cog-legend.component.html',
  styleUrl: './cog-legend.component.scss'
})
export class CogLegendComponent {
  /** Url for the colormap */
  public colormapUrl = input.required<string>();
  /** Width of the colormap */
  public colormapWidth = input<number>();
  /** Name of the group represented by this legend */
  public name = input<string>();
  /** Minimum value of the visualisation */
  public minimum = input<number>();
  /** Maximum value of the visualisation */
  public maximum = input<number>();
}

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
import { NgOptimizedImage } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'arlas-result-cog-visualisation-shortcut',
  standalone: true,
  imports: [
    NgOptimizedImage,
    TranslateModule,
    MatTooltip
  ],
  templateUrl: './result-cog-visualisation-shortcut.component.html',
  styleUrl: './result-cog-visualisation-shortcut.component.scss'
})
export class ResultCogVisualisationShortcutComponent {
  public title = input<string>();
  public description = input<string>();
  public picture = input<string>('./assets/no-view.png');
  public showTooltipTitle = input<boolean>(false);
}

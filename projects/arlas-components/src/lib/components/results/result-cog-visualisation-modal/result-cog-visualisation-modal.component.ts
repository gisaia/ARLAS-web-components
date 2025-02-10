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

import { Component, inject, input, output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import {
  ResultCogVisualisationShortcutComponent
} from '../result-cog-visualisation-shortcut/result-cog-visualisation-shortcut.component';
import { TranslateModule } from '@ngx-translate/core';

export interface CogVisualisationConfig {
  picture: string;
  title: string;
  description: string;
}

export interface VisualisationInterface {
  name: string;
  description: string;
  itemsFamilies: ItemFamily[];
}

export interface ItemFamily {
  protocol: string;
  visualisationUrl: string;
  url: string;
  filter: {field: string; values: string[];};

}


@Component({
  selector: 'arlas-result-cog-visualisation-modal',
  standalone: true,
  imports: [
    MatDialogContent,
    ResultCogVisualisationShortcutComponent,
    MatDialogClose,
    TranslateModule
  ],
  templateUrl: './result-cog-visualisation-modal.component.html',
  styleUrl: './result-cog-visualisation-modal.component.scss'
})
export class ResultCogVisualisationModalComponent {
  public data: {visualisations: VisualisationInterface[];} = inject(MAT_DIALOG_DATA);
}

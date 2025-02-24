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

import { Component } from '@angular/core';
import { MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import {
  ResultCogVisualisationShortcutComponent
} from '../result-cog-visualisation-shortcut/result-cog-visualisation-shortcut.component';

export interface CogVisualisationConfig {
  picture: string;
  title: string;
  description: string;
}

@Component({
  selector: 'arlas-result-cog-visualisation-modal',
  standalone: true,
  imports: [
    MatDialogContent,
    ResultCogVisualisationShortcutComponent,
    MatDialogClose
  ],
  templateUrl: './result-cog-visualisation-modal.component.html',
  styleUrl: './result-cog-visualisation-modal.component.scss'
})
export class ResultCogVisualisationModalComponent {
  protected visualisations: CogVisualisationConfig[] = [
    {
      picture: '',
      title: 'True color',
      description: ' is simply dummy text of the printing and typesetting industry. ' +
        'Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s.',
    },
    {
      picture: 'NDVI',
      title: 'NDVI',
      description: ' is simply dummy text of the printing and typesetting industry.' +
        ' Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s,',
    },
    {
      picture: '',
      title: 'Moisture index',
      description: ' is simply dummy text of the printing and typesetting industry.' +
        ' Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s,',
    }
  ];
}

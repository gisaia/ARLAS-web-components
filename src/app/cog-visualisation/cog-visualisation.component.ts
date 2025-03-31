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
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CogModalComponent, CogPreviewComponent, CogVisualisationData } from 'arlas-web-components';

@Component({
  selector: 'arlas-cog-visualisation',
  standalone: true,
  imports: [
    CogPreviewComponent,
    CogModalComponent,
    MatButton
  ],
  templateUrl: './cog-visualisation.component.html',
  styleUrl: './cog-visualisation.component.scss'
})
export class CogVisualisationComponent {
  public readonly dialog = inject(MatDialog);
  public openDialog() {
    const data = {
      visualisations: [
        {
          visualisation: {name: 'NDVI', description: 'NDVI description'},
          match: 'all'
        },
        {
          visualisation: {name: 'TCI', description: 'TCI description'},
          match: 'partial'
        },
        {
          visualisation: {name: 'SWIR', description: 'SWIR description'},
          match: 'none'
        }
      ],
      loading: true
    };

    const dialogRef = this.dialog.open(CogModalComponent, {
      data : data,
      width: '600px',
      height:'30vh'
    });

    setTimeout(() => data.loading = false, 5000);
  }
}

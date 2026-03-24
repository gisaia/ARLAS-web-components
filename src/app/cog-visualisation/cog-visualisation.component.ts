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
import { CogLegendComponent, CogModalComponent, CogPreviewComponent } from 'arlas-web-components';

@Component({
  selector: 'arlas-cog-visualisation',
  standalone: true,
  imports: [
    CogPreviewComponent,
    MatButton,
    CogLegendComponent
  ],
  templateUrl: './cog-visualisation.component.html',
  styleUrl: './cog-visualisation.component.scss'
})
export class CogVisualisationComponent {
  public readonly dialog = inject(MatDialog);

  public longDescription = `
    The normalized difference vegetation index (NDVI) is a widely used metric for quantifying the health and density of vegetation using sensor data. It is calculated from spectrometric data at two specific bands: red and near-infrared. The spectrometric data is usually sourced from remote sensors, such as satellites.
    The metric is popular in industry because of its accuracy. It has a high correlation with the true state of vegetation on the ground. The index is easy to interpret: NDVI will be a value between -1 and 1. An area with nothing growing in it will have an NDVI of zero. NDVI will increase in proportion to vegetation growth. An area with dense, healthy vegetation will have an NDVI of one. NDVI values less than 0 suggest a lack of dry land. An ocean will yield an NDVI of -1`;

  public openDialog() {
    const data = {
      visualisations: [
        {
          visualisation: {name: 'NDVI', description: this.longDescription},
          match: 'all',
          preview: './assets/logo-gisaia.png',
          selected: true
        },
        {
          visualisation: {name: 'TCI', description: 'TCI description'},
          match: 'partial',
          // preview: './assets/no-view.png'
        },
        {
          visualisation: {name: 'SWIR', description: 'SWIR description'},
          match: 'none',
          preview: './assets/no-view.png'
        }
      ],
      loading: true
    };

    this.dialog.open(CogModalComponent, {
      data : data,
      width: '600px',
      maxHeight:'50vh'
    });

    setTimeout(() => data.loading = false, 5000);
  }
}
